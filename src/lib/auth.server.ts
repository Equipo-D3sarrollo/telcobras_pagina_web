import { createHash, randomBytes } from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db.server";
import { verifyAgainstDummy, verifyPassword } from "./password.server";
import { isProxyTrusted } from "./rate-limit";

/*
 * Autenticación del panel /admin. Solo servidor. Todas las consultas son preparadas.
 * Nunca se guardan ni se registran contraseñas ni tokens: en `sesiones` solo está el SHA-256
 * del token, y en `auditoria` solo la acción, el usuario, la IP y un texto genérico.
 */

export const SESSION_COOKIE = "__Host-telcobras_admin";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_MINUTES = 15;
export const GENERIC_LOGIN_ERROR = "Correo o contraseña incorrectos";

export type AdminUser = {
  id: number;
  nombre: string;
  correo: string;
  rol: "administrador" | "comercial";
};

// ---------------------------------------------------------------------------
// Utilidades puras (sin base de datos)
// ---------------------------------------------------------------------------

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Estado tras un intento fallido: al llegar a 5 seguidos se bloquea 15 min y se reinicia el contador. */
export function nextFailureState(
  currentAttempts: number,
  now: Date,
): { attempts: number; lockedUntil: Date | null } {
  const attempts = currentAttempts + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return { attempts: 0, lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000) };
  }
  return { attempts, lockedUntil: null };
}

export function serializeSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`;
}

export function readSessionToken(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === SESSION_COOKIE) {
      const value = part.slice(separator + 1).trim();
      return value.length > 0 && value.length <= 128 ? value : null;
    }
  }
  return null;
}

/**
 * Defensa CSRF (además de SameSite=Strict): el encabezado Origin de un POST debe tener el
 * mismo host que el sitio. Sin Origin, con «null» o con otro host, se rechaza.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const hosts: (string | null | undefined)[] = [
    request.headers.get("host"),
    new URL(request.url).host,
  ];
  if (isProxyTrusted())
    hosts.push(request.headers.get("x-forwarded-host")?.split(",").at(-1)?.trim());
  return hosts.some((host) => host?.toLowerCase() === originHost);
}

// ---------------------------------------------------------------------------
// Base de datos
// ---------------------------------------------------------------------------

type UserRow = RowDataPacket & {
  id: number;
  nombre: string;
  correo: string;
  password_hash: string;
  rol: "administrador" | "comercial";
  activo: number;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
};

async function audit(
  usuarioId: number | null,
  accion: "login" | "login_fallido" | "logout",
  ip: string | null,
  detalle: string,
) {
  await getPool().execute(
    "INSERT INTO auditoria (usuario_id, accion, detalle, ip) VALUES (?, ?, ?, ?)",
    [usuarioId, accion, detalle, ip],
  );
}

/** Borra las sesiones vencidas (limpieza oportunista: se llama al iniciar sesión). */
export async function cleanExpiredSessions(now = new Date()): Promise<void> {
  await getPool().execute("DELETE FROM sesiones WHERE expira_en < ?", [now]);
}

export type LoginResult = { ok: true; token: string; user: AdminUser } | { ok: false };

export async function login(input: {
  correo: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}): Promise<LoginResult> {
  const pool = getPool();
  const now = new Date();
  const correo = input.correo.trim().toLowerCase();

  const [rows] = await pool.execute<UserRow[]>(
    `SELECT id, nombre, correo, password_hash, rol, activo, intentos_fallidos, bloqueado_hasta
       FROM usuarios WHERE correo = ? LIMIT 1`,
    [correo],
  );
  const user = rows[0];

  // Correo inexistente: se hace igual un hash para que el tiempo de respuesta sea parecido.
  if (!user) {
    await verifyAgainstDummy(input.password);
    await audit(null, "login_fallido", input.ip, "Intento de acceso fallido");
    return { ok: false };
  }

  const isLocked = user.bloqueado_hasta !== null && user.bloqueado_hasta.getTime() > now.getTime();
  const passwordOk = await verifyPassword(input.password, user.password_hash);

  // Cuenta inactiva o bloqueada: no entra ni con la contraseña correcta (y no suma intentos).
  if (user.activo !== 1 || isLocked) {
    await audit(
      user.id,
      "login_fallido",
      input.ip,
      isLocked ? "Cuenta bloqueada" : "Cuenta inactiva",
    );
    return { ok: false };
  }

  if (!passwordOk) {
    const state = nextFailureState(user.intentos_fallidos, now);
    await pool.execute(
      "UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?",
      [state.attempts, state.lockedUntil, user.id],
    );
    await audit(
      user.id,
      "login_fallido",
      input.ip,
      state.lockedUntil
        ? "Contraseña incorrecta; cuenta bloqueada 15 minutos"
        : "Contraseña incorrecta",
    );
    return { ok: false };
  }

  // Éxito: reinicia el contador, registra el acceso y abre una sesión con un token nuevo.
  await pool.execute(
    "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = ? WHERE id = ?",
    [now, user.id],
  );
  const token = newSessionToken();
  await pool.execute(
    "INSERT INTO sesiones (id, usuario_id, expira_en, ip, user_agent) VALUES (?, ?, ?, ?, ?)",
    [
      hashSessionToken(token),
      user.id,
      new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000),
      input.ip,
      input.userAgent ? input.userAgent.slice(0, 255) : null,
    ],
  );
  await audit(user.id, "login", input.ip, "Inicio de sesión");
  await cleanExpiredSessions(now).catch(() => {});

  return {
    ok: true,
    token,
    user: { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol },
  };
}

/** Usuario de una sesión vigente (no vencida y de una cuenta activa), o `null`. */
export async function getSessionUser(
  token: string | null,
  now = new Date(),
): Promise<AdminUser | null> {
  if (!token) return null;
  const [rows] = await getPool().execute<(RowDataPacket & AdminUser)[]>(
    `SELECT u.id, u.nombre, u.correo, u.rol
       FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
      WHERE s.id = ? AND s.expira_en > ? AND u.activo = 1 LIMIT 1`,
    [hashSessionToken(token), now],
  );
  const row = rows[0];
  return row ? { id: row.id, nombre: row.nombre, correo: row.correo, rol: row.rol } : null;
}

/** Borra la fila de una sesión (sin auditoría): al iniciar sesión se descarta la anterior. */
export async function destroySession(token: string): Promise<void> {
  await getPool().execute("DELETE FROM sesiones WHERE id = ?", [hashSessionToken(token)]);
}

/** Cierra la sesión: borra la fila y registra el logout (si la sesión era válida). */
export async function logout(token: string | null, ip: string | null): Promise<void> {
  if (!token) return;
  const user = await getSessionUser(token);
  await getPool().execute<ResultSetHeader>("DELETE FROM sesiones WHERE id = ?", [
    hashSessionToken(token),
  ]);
  if (user) await audit(user.id, "logout", ip, "Cierre de sesión");
}
