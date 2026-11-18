import { createFileRoute } from "@tanstack/react-router";
import { createRateLimiter, getClientIp, NO_CLIENT_IP_KEY } from "@/lib/rate-limit";
import { insertCotizacion } from "@/lib/cotizaciones.server";
import { DbConfigError } from "@/lib/db.server";

const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Rate limiting: máximo 5 envíos por ventana de 10 minutos por IP
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;

const contactoRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  maxRequests: MAX_REQUESTS_PER_WINDOW,
  maxEntries: 10000,
});

async function verifyTurnstileToken(
  token: string,
  secret: string,
  remoteIp?: string | null,
): Promise<{
  success: boolean;
  errorCodes?: string[] | undefined;
  hostname?: string | undefined;
  testingKey?: boolean;
}> {
  const formData = new URLSearchParams();
  formData.append("secret", secret);
  formData.append("response", token);
  if (remoteIp) {
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
      hostname?: string;
      metadata?: { result_with_testing_key?: boolean };
    };

    return {
      success: Boolean(data.success),
      errorCodes: data["error-codes"],
      hostname: typeof data.hostname === "string" ? data.hostname.toLowerCase() : undefined,
      testingKey: data.metadata?.result_with_testing_key === true,
    };
  } catch (err) {
    console.error("[api/contacto] Error al conectar con Cloudflare Turnstile:", err);
    return { success: false, errorCodes: ["network_error"] };
  }
}

const IS_DEV = import.meta.env.DEV;
const DEV_HOSTNAMES = ["localhost", "127.0.0.1"];

/**
 * Hostnames desde los que se acepta un token de Turnstile (TURNSTILE_ALLOWED_HOSTNAMES,
 * separados por comas). En desarrollo se añaden localhost y 127.0.0.1. Devuelve `null`
 * si en producción no hay ninguno configurado: el envío se rechaza (fail-closed).
 */
function getAllowedTurnstileHostnames(): string[] | null {
  const configured = (process.env["TURNSTILE_ALLOWED_HOSTNAMES"] ?? "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
  if (IS_DEV) return [...configured, ...DEV_HOSTNAMES];
  return configured.length > 0 ? configured : null;
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
  idioma: "es" | "en";
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
    // Idioma en que se usó el formulario; cualquier otro valor se guarda como «es».
    idioma: value["idioma"] === "en" ? "en" : "es",
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

// Registra solo el tipo de fallo de MySQL (código, errno, sqlState): nunca el mensaje
// completo ni datos del formulario.
function logDbError(error: unknown) {
  if (error instanceof DbConfigError) {
    console.error("[api/contacto] Configuración de MySQL incompleta:", error.message);
    return;
  }
  const { code, errno, sqlState } = (isRecord(error) ? error : {}) as Record<string, unknown>;
  console.error("[api/contacto] No se pudo guardar la solicitud en MySQL.", {
    code,
    errno,
    sqlState,
  });
}

async function handlePost(request: Request): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (contentType !== "application/json") {
      return jsonResponse({ error: "unsupported_media_type" }, 415);
    }

    // 1. Rate Limiting por IP
    const clientIp = getClientIp(request);
    const rateLimitKey = clientIp ?? NO_CLIENT_IP_KEY;
    const rateLimit = contactoRateLimiter.check(rateLimitKey);
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

    const allowedHostnames = getAllowedTurnstileHostnames();
    if (!allowedHostnames) {
      console.error("[api/contacto] TURNSTILE_ALLOWED_HOSTNAMES not configured");
      return jsonResponse({ error: "contacto_unavailable" }, 503);
    }

    const turnstileResult = await verifyTurnstileToken(turnstileToken, turnstileSecret, clientIp);
    if (!turnstileResult.success) {
      console.warn("[api/contacto] Verificación Turnstile fallida:", turnstileResult.errorCodes);
      return jsonResponse({ error: "turnstile_verification_failed" }, 403);
    }

    // Con las claves de prueba de Cloudflare el hostname siempre es example.com: se
    // aceptan solo en desarrollo; en producción indican una configuración equivocada.
    if (turnstileResult.testingKey) {
      if (!IS_DEV) {
        console.error("[api/contacto] Turnstile respondió con una clave de prueba en producción");
        return jsonResponse({ error: "turnstile_verification_failed" }, 403);
      }
    } else if (!turnstileResult.hostname || !allowedHostnames.includes(turnstileResult.hostname)) {
      console.warn("[api/contacto] Hostname de Turnstile no permitido:", turnstileResult.hostname);
      return jsonResponse({ error: "turnstile_verification_failed" }, 403);
    }

    // 4. Validación de campos del formulario
    const contacto = parseContacto(input);
    if (!contacto) return jsonResponse({ error: "invalid_request" }, 400);

    // 5. Inserción en MySQL (cotización + auditoría en una transacción). Cualquier fallo
    // de la base responde 503 con un mensaje genérico, sin exponer detalles internos.
    try {
      await insertCotizacion(contacto);
    } catch (error) {
      logDbError(error);
      return jsonResponse({ error: "contacto_unavailable" }, 503);
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
