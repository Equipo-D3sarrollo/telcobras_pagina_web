/*
 * Tipos, listas permitidas y validación de la gestión de usuarios del panel. Sin código de
 * servidor: lo importan las páginas y la capa de servidor, que vuelve a validar todo lo que
 * recibe (nunca se confía en lo que manda el navegador).
 */

export const ROLES = ["administrador", "comercial"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABEL: Record<Rol, string> = {
  administrador: "Administrador",
  comercial: "Comercial",
};

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 1024;
export const MAX_NOMBRE = 100;
export const MAX_CORREO = 200;

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type UsuarioLista = {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
  debeCambiarPassword: boolean;
  bloqueadoHasta: string | null;
  ultimoAcceso: string | null;
};

export type CrearUsuarioInput = { nombre: string; correo: string; rol: Rol; password: string };
export type EditarUsuarioInput = { nombre: string; correo: string; rol: Rol };
export type CambiarPasswordInput = { actual: string; nueva: string };
export type AccionUsuario =
  "editar" | "activar" | "desactivar" | "desbloquear" | "reiniciar_password";

const ACCIONES: readonly AccionUsuario[] = [
  "editar",
  "activar",
  "desactivar",
  "desbloquear",
  "reiniciar_password",
];

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= max ? trimmed : null;
}

function correo(value: unknown): string | null {
  const value2 = text(value, MAX_CORREO);
  return value2 && CORREO_REGEX.test(value2) ? value2.toLowerCase() : null;
}

function rol(value: unknown): Rol | null {
  return ROLES.find((item) => item === value) ?? null;
}

/** La contraseña no se recorta: los espacios al inicio o al final también cuentan. */
function password(value: unknown): string | null {
  return typeof value === "string" &&
    value.length >= MIN_PASSWORD_LENGTH &&
    value.length <= MAX_PASSWORD_LENGTH
    ? value
    : null;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export function parseCrearUsuario(value: unknown): CrearUsuarioInput | null {
  const raw = record(value);
  const nombre = text(raw["nombre"], MAX_NOMBRE);
  const correoValue = correo(raw["correo"]);
  const rolValue = rol(raw["rol"]);
  const passwordValue = password(raw["password"]);
  return nombre && correoValue && rolValue && passwordValue
    ? { nombre, correo: correoValue, rol: rolValue, password: passwordValue }
    : null;
}

export function parseEditarUsuario(value: unknown): EditarUsuarioInput | null {
  const raw = record(value);
  const nombre = text(raw["nombre"], MAX_NOMBRE);
  const correoValue = correo(raw["correo"]);
  const rolValue = rol(raw["rol"]);
  return nombre && correoValue && rolValue ? { nombre, correo: correoValue, rol: rolValue } : null;
}

export function parseCambiarPassword(value: unknown): CambiarPasswordInput | null {
  const raw = record(value);
  const actual = raw["actual"];
  const nueva = password(raw["nueva"]);
  return typeof actual === "string" &&
    actual.length > 0 &&
    actual.length <= MAX_PASSWORD_LENGTH &&
    nueva
    ? { actual, nueva }
    : null;
}

export function parseAccion(value: unknown): AccionUsuario | null {
  return ACCIONES.find((item) => item === value) ?? null;
}

/** Nadie puede quitarse el rol de administrador a sí mismo desde la gestión de usuarios. */
export function puedeCambiarRol(adminId: number, targetId: number, nuevoRol: Rol): boolean {
  return adminId !== targetId || nuevoRol === "administrador";
}

/** Nadie puede desactivarse a sí mismo (evita dejar el panel sin administradores activos). */
export function puedeDesactivar(adminId: number, targetId: number): boolean {
  return adminId !== targetId;
}
