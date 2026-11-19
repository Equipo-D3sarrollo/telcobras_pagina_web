import { getSessionUser, isSameOrigin, readSessionToken, type AdminUser } from "./auth.server";
import { createRateLimiter, getClientIp, NO_CLIENT_IP_KEY } from "./rate-limit";

/* Comprobaciones comunes de las rutas API del panel. Solo servidor. */

// Límite por IP de las escrituras del panel: 120 cada 5 minutos (uso normal de personas).
const mutationLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 120,
  maxEntries: 10000,
});

export function adminJson(body: Record<string, unknown>, status = 200, extra?: [string, string][]) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  for (const [name, value] of extra ?? []) headers.append(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

/** Registra solo el tipo de fallo (nunca datos del formulario ni mensajes crudos de la base). */
export function logAdminError(where: string, error: unknown) {
  const { code, errno } = (typeof error === "object" && error !== null ? error : {}) as Record<
    string,
    unknown
  >;
  console.error(`[${where}] Error.`, { code, errno });
}

/**
 * Exige sesión válida y, en las escrituras (POST), un Origin del mismo sitio y respeto del
 * límite por IP. Devuelve el usuario o la respuesta de error lista para enviar:
 * 403 (Origin), 429 (límite), 401 (sin sesión) o 503 (la base no responde).
 */
export async function requireAdminApi(
  request: Request,
  options: { mutation: boolean },
): Promise<{ user: AdminUser; ip: string | null } | Response> {
  const ip = getClientIp(request);
  if (options.mutation) {
    if (!isSameOrigin(request)) return adminJson({ error: "forbidden" }, 403);
    const limit = mutationLimiter.check(ip ?? NO_CLIENT_IP_KEY);
    if (!limit.allowed) {
      return adminJson({ error: "rate_limit_exceeded" }, 429, [
        ["retry-after", String(limit.retryAfterSeconds)],
      ]);
    }
  }
  try {
    const user = await getSessionUser(readSessionToken(request.headers.get("cookie")));
    if (!user) return adminJson({ error: "unauthorized" }, 401);
    return { user, ip };
  } catch (error) {
    logAdminError("admin/api", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

/** Cuerpo JSON de tamaño acotado; `null` si es demasiado grande o no es JSON. */
export async function readJsonBody(request: Request, maxChars: number): Promise<unknown | null> {
  if (Number(request.headers.get("content-length") ?? 0) > maxChars) return null;
  const text = await request.text();
  if (text.length > maxChars) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
