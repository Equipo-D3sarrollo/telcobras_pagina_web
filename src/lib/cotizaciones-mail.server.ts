import type { RowDataPacket } from "mysql2/promise";
import * as nodemailer from "nodemailer";
import { formatFechaCo } from "./cotizaciones-admin-shared";
import { getPool } from "./db.server";

/**
 * Aviso por correo de cotizaciones nuevas. Solo servidor. El envío se programa después de
 * guardar en MySQL y nunca retrasa la respuesta al formulario.
 */

export const MAIL_TIMEOUT_MS = 15_000;

export type DatosAviso = {
  id: number;
  creado_en: string;
  servicio: string;
  empresa: string;
  nombre: string;
  origen?: string;
};

export type MensajeAviso = { subject: string; text: string; html: string };

export type TransporteCorreo = {
  sendMail(mail: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<unknown>;
};

type ConfigSmtp = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
  siteUrl: string;
};

export type ResultadoAviso = { ok: boolean; enviado: boolean; code?: string };

let configFaltanteAvisada = false;

function valorEnv(nombre: string): string {
  return process.env[nombre]?.trim() ?? "";
}

/** Configuración completa, o `null` si falta algo (entonces no se envía nada). */
export function leerConfigSmtp(): ConfigSmtp | null {
  const host = valorEnv("SMTP_HOST");
  const user = valorEnv("SMTP_USER");
  const pass = process.env["SMTP_PASSWORD"] ?? "";
  const from = valorEnv("MAIL_FROM");
  const to = valorEnv("MAIL_TO_COTIZACIONES");
  const siteUrl = valorEnv("PUBLIC_SITE_URL");
  const puerto = Number(valorEnv("SMTP_PORT") || "465");
  const banderaSecure = valorEnv("SMTP_SECURE") || "true";

  if (!host || !user || !pass || !from || !to || !siteUrl) return null;
  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) return null;

  let url: URL;
  try {
    url = new URL(siteUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  return {
    host,
    port: puerto,
    secure: banderaSecure === "true" || banderaSecure === "1",
    user,
    pass,
    from,
    to,
    siteUrl: url.origin,
  };
}

/** Un solo aviso por proceso, sin datos personales ni credenciales. */
function avisarConfigFaltante(): void {
  if (configFaltanteAvisada) return;
  configFaltanteAvisada = true;
  console.warn(
    "[cotizaciones/mail] SMTP sin configurar: los avisos por correo quedan desactivados.",
  );
}

/** Utilidad para reiniciar el estado del aviso único en pruebas. */
export function reiniciarAvisoConfigFaltante(): void {
  configFaltanteAvisada = false;
}

/** Quita saltos de línea y otros caracteres de control: evita inyección de cabeceras. */
export function sanitizarCabecera(valor: string): string {
  return Array.from(valor)
    .map((caracter) => {
      const codigo = caracter.codePointAt(0) ?? 0;
      return codigo < 0x20 || codigo === 0x7f ? " " : caracter;
    })
    .join("")
    .replace(/ +/g, " ")
    .trim();
}

function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (caracter) => {
    switch (caracter) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

/**
 * Cuerpo del correo. Solo id, fecha (hora Colombia), servicio, empresa, nombre y enlace
 * al panel: nunca teléfono, correo del contacto, mensaje ni notas.
 */
export function construirMensaje(datos: DatosAviso, config: ConfigSmtp): MensajeAviso {
  const id = String(datos.id);
  const fecha = formatFechaCo(datos.creado_en);
  const servicio = datos.servicio || "—";
  const empresa = datos.empresa || "—";
  const nombre = datos.nombre || "—";
  const enlace = `${config.siteUrl}/admin/cotizaciones/${encodeURIComponent(id)}`;

  const subject = sanitizarCabecera(`Nueva solicitud de cotización #${id}`);
  const text = [
    "TELCOBRAS S.A.S.",
    `Nueva solicitud de cotización #${id}`,
    `Fecha: ${fecha}`,
    `Servicio: ${servicio}`,
    `Empresa: ${empresa}`,
    `Contacto: ${nombre}`,
    `Ver solicitud: ${enlace}`,
  ].join("\n");
  const html = [
    '<div style="font-family:Arial,sans-serif;color:#10284a;max-width:600px">',
    '<h1 style="color:#0087C3;font-size:20px">TELCOBRAS S.A.S.</h1>',
    `<h2 style="font-size:17px">Nueva solicitud de cotización #${escaparHtml(id)}</h2>`,
    `<p><strong>Fecha:</strong> ${escaparHtml(fecha)}</p>`,
    `<p><strong>Servicio:</strong> ${escaparHtml(servicio)}</p>`,
    `<p><strong>Empresa:</strong> ${escaparHtml(empresa)}</p>`,
    `<p><strong>Contacto:</strong> ${escaparHtml(nombre)}</p>`,
    `<p><a href="${escaparHtml(enlace)}" style="color:#0087C3">Ver solicitud en el panel</a></p>`,
    "</div>",
  ].join("");

  return { subject, text, html };
}

function codigoError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === "string" && code.length > 0) return code;
  }
  return "unknown";
}

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    temporizador = setTimeout(
      () => reject(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })),
      ms,
    );
  });
  return Promise.race([promesa, timeout]).finally(() => {
    if (temporizador !== undefined) clearTimeout(temporizador);
  });
}

function crearTransporte(config: ConfigSmtp): TransporteCorreo {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: MAIL_TIMEOUT_MS,
    greetingTimeout: MAIL_TIMEOUT_MS,
    socketTimeout: MAIL_TIMEOUT_MS,
  });
}

async function marcarEnviado(id: number): Promise<void> {
  await getPool().execute("UPDATE cotizaciones SET aviso_correo_enviado = 1 WHERE id = ?", [id]);
}

/**
 * Envía el aviso y marca la columna solo si SMTP respondió bien. Nunca lanza: el formulario
 * y el panel siguen funcionando aunque falle el correo o la base.
 */
export async function enviarAvisoCotizacion(
  datos: DatosAviso,
  transporte?: TransporteCorreo,
): Promise<ResultadoAviso> {
  const config = leerConfigSmtp();
  if (!config) {
    avisarConfigFaltante();
    return { ok: false, enviado: false };
  }

  const mensaje = construirMensaje(datos, config);
  try {
    await conTimeout(
      (transporte ?? crearTransporte(config)).sendMail({
        from: sanitizarCabecera(config.from),
        to: sanitizarCabecera(config.to),
        subject: mensaje.subject,
        text: mensaje.text,
        html: mensaje.html,
      }),
      MAIL_TIMEOUT_MS,
    );
  } catch (error) {
    const code = codigoError(error);
    console.error("[cotizaciones/mail] Error de SMTP.", { code });
    return { ok: false, enviado: false, code };
  }

  try {
    await marcarEnviado(datos.id);
  } catch (error) {
    const code = codigoError(error);
    console.error("[cotizaciones/mail] Error al marcar el aviso.", { code });
    return { ok: false, enviado: true, code };
  }

  return { ok: true, enviado: true };
}

/**
 * Se llama justo después de guardar en MySQL. No awaits: la respuesta del formulario no espera
 * al SMTP. Las creaciones manuales del panel no llegan aquí.
 */
export function programarAvisoCotizacion(
  id: number,
  datos: Omit<DatosAviso, "id">,
  transporte?: TransporteCorreo,
): void {
  if (datos.origen !== undefined && datos.origen !== "formulario_web") return;
  if (!leerConfigSmtp()) {
    avisarConfigFaltante();
    return;
  }
  void enviarAvisoCotizacion({ ...datos, id }, transporte);
}

/** Datos mínimos para reenviar el aviso desde el panel (sin campos personales extra). */
export async function datosAvisoPorId(id: number): Promise<DatosAviso | null> {
  const [rows] = await getPool().execute<RowDataPacket[]>(
    `SELECT id, creado_en, servicio, empresa, nombre, origen
       FROM cotizaciones WHERE id = ? AND eliminado_en IS NULL LIMIT 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const fecha = new Date(row["creado_en"] as string | Date);
  return {
    id: row["id"] as number,
    creado_en: Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString(),
    servicio: (row["servicio"] as string) ?? "",
    empresa: (row["empresa"] as string) ?? "",
    nombre: (row["nombre"] as string) ?? "",
    origen: (row["origen"] as string) ?? "",
  };
}
