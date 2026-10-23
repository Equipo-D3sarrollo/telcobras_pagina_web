import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const SUPABASE_TABLE = "solicitudes_contacto";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Rate limiting: máximo 5 envíos por ventana de 10 minutos por IP
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();

  // Limpieza periódica para evitar fugas de memoria
  if (rateLimitMap.size > 1000) {
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

function getClientIp(request: Request): string {
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim();

  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp?.trim()) return xRealIp.trim();

  return "127.0.0.1";
}

async function verifyTurnstileToken(
  token: string,
  secret: string,
  remoteIp?: string,
): Promise<{ success: boolean; errorCodes?: string[] | undefined }> {
  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);
  if (remoteIp && remoteIp !== "127.0.0.1") {
    formData.append("remoteip", remoteIp);
  }

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    if (!res.ok) {
      console.error("[api/contacto] Turnstile siteverify respondió HTTP", res.status);
      return { success: false, errorCodes: [`http_${res.status}`] };
    }

    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    return {
      success: Boolean(data.success),
      errorCodes: data["error-codes"],
    };
  } catch (err) {
    console.error("[api/contacto] Error al conectar con Cloudflare Turnstile:", err);
    return { success: false, errorCodes: ["network_error"] };
  }
}

const LIMITS = {
  nombre: 100,
  empresa: 100,
  cargo: 100,
  correo: 200,
  telefono: 20,
  servicio: 120,
  mensaje: 2000,
} as const;

type ContactoRequest = {
  nombre: string;
  empresa: string;
  cargo: string;
  correo: string;
  telefono: string;
  servicio: string;
  mensaje: string;
  consentimiento: boolean;
};

function jsonResponse(body: Record<string, unknown>, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json; charset=utf-8");
  responseHeaders.set("cache-control", "no-store");

  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseContacto(value: unknown): ContactoRequest | null {
  if (!isRecord(value)) return null;

  const { nombre, empresa, cargo, correo, telefono, servicio, mensaje, consentimiento } = value;

  if (!isBoundedString(nombre, LIMITS.nombre) || nombre.trim().length === 0) return null;
  if (!isBoundedString(correo, LIMITS.correo) || !CORREO_REGEX.test(correo.trim())) return null;
  if (!isBoundedString(telefono, LIMITS.telefono) || telefono.trim().length === 0) return null;
  if (consentimiento !== true) return null;

  if (
    !isBoundedString(empresa, LIMITS.empresa) ||
    !isBoundedString(cargo, LIMITS.cargo) ||
    !isBoundedString(servicio, LIMITS.servicio) ||
    !isBoundedString(mensaje, LIMITS.mensaje)
  ) {
    return null;
  }

  return {
    nombre: nombre.trim(),
    empresa: empresa.trim(),
    cargo: cargo.trim(),
    correo: correo.trim(),
    telefono: telefono.trim(),
    servicio: servicio.trim(),
    mensaje: mensaje.trim(),
    consentimiento: true,
  };
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > maxBytes) return null;
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function getSupabaseConfig(): { url: string; serviceRoleKey: string } | null {
  const url = process.env["SUPABASE_URL"]?.trim();
  const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !serviceRoleKey) return null;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") return null;
  } catch {
    return null;
  }

  return { url, serviceRoleKey };
}

async function handlePost(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (contentType !== "application/json") {
      return jsonResponse({ error: "unsupported_media_type" }, 415);
    }

    // 1. Rate Limiting por IP
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return jsonResponse({ error: "rate_limit_exceeded" }, 429, {
        "retry-after": String(rateLimit.retryAfterSeconds),
      });
    }

    let body: Uint8Array | null;
    try {
      body = await readLimitedBody(request, MAX_REQUEST_BYTES);
    } catch {
      return jsonResponse({ error: "invalid_request" }, 400);
    }
    if (body === null) return jsonResponse({ error: "payload_too_large" }, 413);

    let input: unknown;
    try {
      input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
    } catch {
      return jsonResponse({ error: "invalid_request" }, 400);
    }

    // 2. Honeypot check (descarta bots directos sin consultar Turnstile)
    if (isRecord(input) && typeof input["sitio_web"] === "string" && input["sitio_web"].trim()) {
      return jsonResponse({ error: "invalid_request" }, 400);
    }

    // 3. Verificación de Cloudflare Turnstile
    const turnstileToken =
      isRecord(input) && typeof input["turnstile_token"] === "string"
        ? input["turnstile_token"].trim()
        : isRecord(input) && typeof input["turnstileToken"] === "string"
          ? (input["turnstileToken"] as string).trim()
          : "";

    if (!turnstileToken || !isBoundedString(turnstileToken, MAX_TURNSTILE_TOKEN_LENGTH)) {
      return jsonResponse({ error: "turnstile_token_required" }, 400);
    }

    const turnstileSecret = process.env["TURNSTILE_SECRET_KEY"]?.trim();
    if (!turnstileSecret) {
      console.error("[api/contacto] Turnstile secret not configured");
      return jsonResponse({ error: "contacto_unavailable" }, 503);
    }

    const turnstileResult = await verifyTurnstileToken(turnstileToken, turnstileSecret, clientIp);
    if (!turnstileResult.success) {
      console.warn("[api/contacto] Verificación Turnstile fallida:", turnstileResult.errorCodes);
      return jsonResponse({ error: "turnstile_verification_failed" }, 403);
    }

    // 4. Validación de campos del formulario
    const contacto = parseContacto(input);
    if (!contacto) return jsonResponse({ error: "invalid_request" }, 400);

    // 5. Inserción en Supabase con manejo de error seguro (sin exponer error.message interno)
    const config = getSupabaseConfig();
    if (!config) return jsonResponse({ error: "contacto_unavailable" }, 503);

    const supabase = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
      const { error } = await supabase.from(SUPABASE_TABLE).insert(contacto);
      if (error) {
        console.error("Error al persistir la solicitud de contacto.", error.code);
        return jsonResponse({ error: "insert_failed" }, 500);
      }
    } catch {
      return jsonResponse({ error: "insert_failed" }, 500);
    }

    return jsonResponse({ status: "success" });
  } catch (err) {
    console.error("Error inesperado en /api/contacto:", err);
    return jsonResponse({ error: "internal_error" }, 500);
  }
}

function methodNotAllowed(): Response {
  return jsonResponse({ error: "method_not_allowed" }, 405, { allow: "POST" });
}

export const Route = createFileRoute("/api/contacto")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => methodNotAllowed(),
    },
  },
});
