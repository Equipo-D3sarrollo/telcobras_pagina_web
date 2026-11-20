import type { ResultSetHeader } from "mysql2/promise";
import { getPool } from "./db.server";
import { programarAvisoCotizacion, type TransporteCorreo } from "./cotizaciones-mail.server";

/** Solo servidor. Todas las consultas usan marcadores `?` (consultas preparadas). */

export type NuevaCotizacion = {
  nombre: string;
  empresa: string;
  cargo: string;
  correo: string;
  telefono: string;
  servicio: string;
  mensaje: string;
  idioma: "es" | "en";
};

const INSERT_COTIZACION = `INSERT INTO cotizaciones
  (nombre, empresa, cargo, correo, telefono, servicio, mensaje,
   consentimiento, consentimiento_fecha, origen, idioma, estado)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const INSERT_AUDITORIA = `INSERT INTO auditoria (usuario_id, accion, cotizacion_id, detalle)
  VALUES (?, ?, ?, ?)`;

/**
 * Guarda una solicitud del formulario web y su registro de auditoría en la misma
 * transacción: si falla cualquiera de los dos, no queda ninguno. Devuelve el id nuevo.
 * El formulario exige consentimiento antes de llegar aquí, por eso se guarda en 1.
 */
export type OpcionesInsercion = {
  /** Por defecto «formulario_web». */
  origen?: "formulario_web" | "manual";
  /** Quién la crea (panel); por defecto NULL = el sistema (formulario web). */
  usuarioId?: number | null;
  /** Texto de la auditoría (sin datos personales). */
  detalle?: string;
};

export async function insertCotizacion(
  datos: NuevaCotizacion,
  opciones: OpcionesInsercion = {},
): Promise<number> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();

    const [resultado] = await connection.execute<ResultSetHeader>(INSERT_COTIZACION, [
      datos.nombre,
      datos.empresa,
      datos.cargo,
      datos.correo,
      datos.telefono,
      datos.servicio,
      datos.mensaje === "" ? null : datos.mensaje,
      1,
      new Date(),
      opciones.origen ?? "formulario_web",
      datos.idioma,
      "nueva",
    ]);
    const cotizacionId = resultado.insertId;

    await connection.execute(INSERT_AUDITORIA, [
      opciones.usuarioId ?? null,
      "crear",
      cotizacionId,
      opciones.detalle ?? "Solicitud recibida desde el formulario web",
    ]);

    await connection.commit();
    return cotizacionId;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Flujo del formulario web: guardar primero y solo después programar el aviso a contabilidad.
 * El envío es asíncrono, así que no retrasa la respuesta al cliente.
 */
export async function guardarCotizacionConAviso(
  datos: NuevaCotizacion,
  transporte?: TransporteCorreo,
): Promise<number> {
  const id = await insertCotizacion(datos, { origen: "formulario_web" });
  programarAvisoCotizacion(
    id,
    {
      creado_en: new Date().toISOString(),
      servicio: datos.servicio,
      empresa: datos.empresa,
      nombre: datos.nombre,
      origen: "formulario_web",
    },
    transporte,
  );
  return id;
}
