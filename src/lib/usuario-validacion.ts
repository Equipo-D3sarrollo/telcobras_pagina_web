/**
 * Validaciones compartidas por los dos scripts que crean cuentas del panel:
 * `crear-usuario.mjs` (escribe en MySQL) y `crear-usuario-sql.mjs` (imprime un INSERT).
 * Así los datos se comprueban exactamente igual en ambos.
 */

export const MIN_PASSWORD = 12;
export const MAX_PASSWORD = 1024;
export const MAX_NOMBRE = 100;
export const MAX_CORREO = 200;
export const ROLES = ["administrador", "comercial"] as const;
export type Rol = (typeof ROLES)[number];
export const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Devuelve `null` si el valor es válido, o el mensaje para mostrar al usuario. */
export function validarNombre(valor: string): string | null {
  return valor.length === 0 || valor.length > MAX_NOMBRE
    ? `El nombre es obligatorio (máximo ${MAX_NOMBRE} caracteres).`
    : null;
}

export function validarCorreo(valor: string): string | null {
  return !CORREO_REGEX.test(valor) || valor.length > MAX_CORREO
    ? `Escribe un correo válido (máximo ${MAX_CORREO} caracteres).`
    : null;
}

export function validarRol(valor: string): string | null {
  return ROLES.includes(valor as Rol) ? null : `Escribe exactamente «${ROLES[0]}» o «${ROLES[1]}».`;
}

export function validarPassword(valor: string): string | null {
  if (valor.length < MIN_PASSWORD) return `Debe tener al menos ${MIN_PASSWORD} caracteres.`;
  if (valor.length > MAX_PASSWORD) return `Es demasiado larga (máximo ${MAX_PASSWORD} caracteres).`;
  return null;
}
