import { getSessionUser, isSameOrigin, readSessionToken, type AdminUser } from "./auth.server";
import { createRateLimiter, getClientIp, NO_CLIENT_IP_KEY } from "./rate-limit";

/* Comprobaciones comunes de las rutas API del panel. Solo servidor. */

// Límite por IP de las escrituras del panel: 120 cada 5 minutos (uso normal de personas).
const mutationLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 120,
  maxEntries: 10000,
});

/** Operaciones sensibles con límite propio, además del genérico de escrituras. */
export type AdminAccionLimitada =
  "crear_usuario" | "reiniciar_password" | "cambiar_password" | "exportar";

const LIMITE_ACCION_MS = 15 * 60 * 1000;
const MENSAJE_LIMITE = "Demasiadas solicitudes. Intenta de nuevo en unos minutos.";

const accionLimiters: Record<AdminAccionLimitada, ReturnType<typeof createRateLimiter>> = {
  // Crear cuentas y reiniciar contraseñas: 10 cada 15 min, por IP y por usuario de la sesión.
  crear_usuario: createRateLimiter({
    windowMs: LIMITE_ACCION_MS,
    maxRequests: 10,
    maxEntries: 10000,
  }),
  reiniciar_password: createRateLimiter({
    windowMs: LIMITE_ACCION_MS,
    maxRequests: 10,
    maxEntries: 10000,
  }),
  // Cambiar la propia contraseña: 5 cada 15 min (incluye el cambio obligatorio).
  cambiar_password: createRateLimiter({
    windowMs: LIMITE_ACCION_MS,
    maxRequests: 5,
    maxEntries: 10000,
  }),
  // Exportar CSV: 10 cada 15 min, por IP y por usuario (además del límite genérico).
  exportar: createRateLimiter({
    windowMs: LIMITE_ACCION_MS,
    maxRequests: 10,
    maxEntries: 10000,
  }),
};

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
 * límite por IP. Con `adminOnly` exige además rol de administrador. Devuelve el usuario o la
 * respuesta de error: 403 (Origin o rol), 429 (límite), 401 (sin sesión) o 503 (base caída).
 */
export async function requireAdminApi(
  request: Request,
  options: { mutation: boolean; adminOnly?: boolean },
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
    if (options.adminOnly && user.rol !== "administrador")
      return adminJson({ error: "forbidden" }, 403);
    return { user, ip };
  } catch (error) {
    logAdminError("admin/api", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

/**
 * Límite dedicado de una operación sensible: se comprueban la IP y el usuario de la sesión.
 * Devuelve un 429 con mensaje genérico, o `null` si puede continuar. Se usa además del
 * limitador genérico de escrituras, nunca en su lugar.
 */
export function checkAdminActionLimit(
  request: Request,
  user: AdminUser,
  accion: AdminAccionLimitada,
): Response | null {
  const ip = getClientIp(request);
  const limiter = accionLimiters[accion];
  const claves = [`${accion}:ip:${ip ?? NO_CLIENT_IP_KEY}`, `${accion}:usuario:${user.id}`];
  for (const clave of claves) {
    const limite = limiter.check(clave);
    if (!limite.allowed) {
      return adminJson({ error: "rate_limit_exceeded", mensaje: MENSAJE_LIMITE }, 429, [
        ["retry-after", String(limite.retryAfterSeconds)],
      ]);
    }
  }
  return null;
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
