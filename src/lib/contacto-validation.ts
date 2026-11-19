/*
 * Validación de los datos de una solicitud de cotización. La usan el formulario público
 * (/api/contacto) y la creación manual del panel (/api/admin/cotizaciones/nueva): mismos
 * campos, mismos límites y mismas reglas. Sin dependencias de servidor.
 */

export const LIMITS = {
  nombre: 100,
  empresa: 100,
  cargo: 100,
  correo: 200,
  telefono: 20,
  servicio: 120,
  mensaje: 2000,
} as const;

export type ContactoRequest = {
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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseContacto(value: unknown): ContactoRequest | null {
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
