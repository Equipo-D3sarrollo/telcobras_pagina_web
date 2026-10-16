import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const MAX_REQUEST_BYTES = 16 * 1024;
const SUPABASE_TABLE = "solicitudes_contacto";

const LIMITS = {
  nombre: 120,
  empresa: 160,
  cargo: 120,
  correo: 254,
  telefono: 40,
  servicio: 120,
  mensaje: 4000,
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
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse({ error: "unsupported_media_type" }, 415);
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

  const contacto = parseContacto(input);
  if (!contacto) return jsonResponse({ error: "invalid_request" }, 400);

  const config = getSupabaseConfig();
  if (!config) return jsonResponse({ error: "contacto_unavailable" }, 503);

  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { error } = await supabase.from(SUPABASE_TABLE).insert(contacto);
    if (error) {
      console.error("Error al persistir la solicitud de contacto.", error.code);
      return jsonResponse({ error: "insert_failed", detail: error.message }, 500);
    }
  } catch {
    return jsonResponse({ error: "insert_failed" }, 500);
  }

  return jsonResponse({ status: "success" });
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
