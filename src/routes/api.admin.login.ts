import { createFileRoute } from "@tanstack/react-router";
import { createRateLimiter, getClientIp, NO_CLIENT_IP_KEY } from "@/lib/rate-limit";
import {
  GENERIC_LOGIN_ERROR,
  destroySession,
  isSameOrigin,
  login,
  readSessionToken,
  serializeSessionCookie,
} from "@/lib/auth.server";
import { DbConfigError } from "@/lib/db.server";

const MAX_BODY_CHARS = 4096;
const MAX_CORREO_LENGTH = 200;
const MAX_PASSWORD_LENGTH = 1024;

// Límite por IP: 10 intentos cada 15 minutos (además del bloqueo de 15 min por cuenta).
const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  maxEntries: 10000,
});

function json(body: Record<string, unknown>, status = 200, extra?: [string, string][]) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  for (const [name, value] of extra ?? []) headers.append(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

async function handlePost(request: Request): Promise<Response> {
  try {
    if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);

    const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
    if (contentType !== "application/json") return json({ error: "unsupported_media_type" }, 415);

    const ip = getClientIp(request);
    const rateLimit = loginRateLimiter.check(ip ?? NO_CLIENT_IP_KEY);
    if (!rateLimit.allowed) {
      return json({ error: "rate_limit_exceeded" }, 429, [
        ["retry-after", String(rateLimit.retryAfterSeconds)],
      ]);
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BODY_CHARS) return json({ error: "payload_too_large" }, 413);
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) return json({ error: "payload_too_large" }, 413);

    let input: unknown;
    try {
      input = JSON.parse(text);
    } catch {
      return json({ error: "invalid_request" }, 400);
    }
    const { correo, password } = (
      typeof input === "object" && input !== null ? input : {}
    ) as Record<string, unknown>;
    if (
      typeof correo !== "string" ||
      typeof password !== "string" ||
      correo.length === 0 ||
      password.length === 0 ||
      correo.length > MAX_CORREO_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      return json({ error: "invalid_request" }, 400);
    }

    const result = await login({
      correo,
      password,
      ip,
      userAgent: request.headers.get("user-agent"),
    });
    if (!result.ok) {
      // Siempre el mismo mensaje y código: no revela si el correo existe, si la cuenta está
      // inactiva o bloqueada, ni si falló la contraseña.
      return json({ error: "invalid_credentials", message: GENERIC_LOGIN_ERROR }, 401);
    }

    // La sesión anterior (si la había) se cierra: el token siempre es nuevo.
    const previousToken = readSessionToken(request.headers.get("cookie"));
    if (previousToken) await destroySession(previousToken).catch(() => {});

    return json(
      { status: "ok", debeCambiarPassword: result.user.debe_cambiar_password === 1 },
      200,
      [["set-cookie", serializeSessionCookie(result.token)]],
    );
  } catch (error) {
    // Solo el tipo de fallo: nunca el correo, la contraseña ni mensajes crudos de la base.
    if (error instanceof DbConfigError) {
      console.error("[api/admin/login] Configuración de MySQL incompleta:", error.message);
    } else {
      const { code, errno } = (typeof error === "object" && error !== null ? error : {}) as Record<
        string,
        unknown
      >;
      console.error("[api/admin/login] Error al iniciar sesión.", { code, errno });
    }
    return json({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => json({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
