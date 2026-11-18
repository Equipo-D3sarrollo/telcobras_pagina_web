import type { ResultSetHeader } from "mysql2/promise";
import { getPool } from "./db.server";

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
export async function insertCotizacion(datos: NuevaCotizacion): Promise<number> {
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
      "formulario_web",
      datos.idioma,
      "nueva",
    ]);
    const cotizacionId = resultado.insertId;

    await connection.execute(INSERT_AUDITORIA, [
      null,
      "crear",
      cotizacionId,
      "Solicitud recibida desde el formulario web",
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
