import type { RowDataPacket } from "mysql2/promise";
import type { AdminUser } from "./auth.server";
import { parseContacto } from "./contacto-validation";
import { insertCotizacion } from "./cotizaciones.server";
import {
  ESTADOS,
  ESTADO_LABEL,
  MAX_EXPORTAR,
  ORIGEN_LABEL,
  PAGE_SIZE,
  PAGE_SIZE_HISTORIAL,
  celdaCsv,
  describirFiltrosCsv,
  escapeLike,
  fechaArchivoCsv,
  formatFechaCsv,
  responsablePermitido,
  solicitudEliminada,
  type DetalleCotizacion,
  type EntradaHistorial,
  type Estado,
  type FilaCotizacion,
  type FilaPapelera,
  type FilaHistorial,
  type HistorialQuery,
  type ListaCotizaciones,
  type ListaHistorial,
  type ListaPapelera,
  type ListQuery,
  type Orden,
  type PapeleraInput,
  type PapeleraQuery,
  type UpdateInput,
} from "./cotizaciones-admin-shared";
import { getPool } from "./db.server";

/*
 * Consultas y reglas del panel de cotizaciones. Solo servidor. Todas las consultas son
 * preparadas (marcadores «?»): lo único que se escribe en el texto SQL son fragmentos fijos del
 * código y columnas tomadas de listas permitidas. Se ignoran las filas con eliminado_en
 * (la papelera es otra fase). La auditoría nunca copia datos personales ni el texto de las notas.
 */

const ORDER_COLUMN: Record<Orden, string> = {
  fecha: "c.creado_en",
  id: "c.id",
  nombre: "c.nombre",
  estado: "c.estado",
};

const COLOMBIA_UTC_OFFSET = "-05:00";

/**
 * Fragmento WHERE y parámetros de los filtros (con o sin el de estado). El filtro por
 * responsable se aplica tanto al listado como a los contadores, y «mios» usa siempre el id
 * de la sesión, nunca un id que viniera del navegador.
 */
export function buildFilters(
  query: ListQuery,
  options: { includeEstado: boolean },
  user: { id: number; rol: "administrador" | "comercial" },
) {
  const conditions = ["c.eliminado_en IS NULL"];
  const params: (string | Date | number)[] = [];

  const responsable = responsablePermitido(query.responsable, user.rol)
    ? query.responsable
    : "todos";
  if (responsable === "mios") {
    conditions.push("c.responsable_id = ?");
    params.push(user.id);
  } else if (responsable === "sin_asignar") {
    conditions.push("c.responsable_id IS NULL");
  } else if (typeof responsable === "number") {
    conditions.push("c.responsable_id = ?");
    params.push(responsable);
  }

  if (query.q) {
    const like = `%${escapeLike(query.q)}%`;
    conditions.push(
      "(c.nombre LIKE ? ESCAPE '!' OR c.empresa LIKE ? ESCAPE '!' OR c.correo LIKE ? ESCAPE '!')",
    );
    params.push(like, like, like);
  }
  if (query.servicio) {
    conditions.push("c.servicio = ?");
    params.push(query.servicio);
  }
  if (query.desde) {
    conditions.push("c.creado_en >= ?");
    params.push(new Date(`${query.desde}T00:00:00${COLOMBIA_UTC_OFFSET}`));
  }
  if (query.hasta) {
    // «hasta» incluye todo ese día: se compara con el inicio del día siguiente.
    const next = new Date(`${query.hasta}T00:00:00${COLOMBIA_UTC_OFFSET}`);
    next.setUTCDate(next.getUTCDate() + 1);
    conditions.push("c.creado_en < ?");
    params.push(next);
  }
  if (options.includeEstado && query.estado) {
    conditions.push("c.estado = ?");
    params.push(query.estado);
  }
  return { where: conditions.join(" AND "), params };
}

/** Un id de responsable solo vale si es administrador y el usuario existe; lo demás se ignora. */
async function resolverFiltro(
  query: ListQuery,
  user: { id: number; rol: "administrador" | "comercial" },
): Promise<ListQuery> {
  if (typeof query.responsable !== "number") return query;
  if (!responsablePermitido(query.responsable, user.rol)) {
    return { ...query, responsable: "todos" };
  }
  const [existe] = await getPool().execute<RowDataPacket[]>(
    "SELECT id FROM usuarios WHERE id = ? LIMIT 1",
    [query.responsable],
  );
  return existe.length === 0 ? { ...query, responsable: "todos" } : query;
}

export async function listarCotizaciones(
  query: ListQuery,
  user: { id: number; rol: "administrador" | "comercial" },
): Promise<ListaCotizaciones> {
  const pool = getPool();
  const filtro = await resolverFiltro(query, user);
  const filtered = buildFilters(filtro, { includeEstado: true }, user);
  const forCounts = buildFilters(filtro, { includeEstado: false }, user);
  const offset = (query.page - 1) * PAGE_SIZE;
  const direction = query.dir === "asc" ? "ASC" : "DESC";

  const [filas, total, conteos, servicios, responsables] = await Promise.all([
    // LIMIT/OFFSET van como texto: MySQL 8.0.22+ rechaza los números JS (DOUBLE) en
    // sentencias preparadas y acepta el texto.
    pool.execute<RowDataPacket[]>(
      `SELECT c.id, c.creado_en, c.nombre, c.empresa, c.servicio, c.estado, u.nombre AS responsable
         FROM cotizaciones c LEFT JOIN usuarios u ON u.id = c.responsable_id
        WHERE ${filtered.where}
        ORDER BY ${ORDER_COLUMN[query.orden]} ${direction}, c.id DESC
        LIMIT ? OFFSET ?`,
      [...filtered.params, String(PAGE_SIZE), String(offset)],
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM cotizaciones c WHERE ${filtered.where}`,
      filtered.params,
    ),
    pool.execute<RowDataPacket[]>(
      `SELECT c.estado, COUNT(*) AS n FROM cotizaciones c WHERE ${forCounts.where} GROUP BY c.estado`,
      forCounts.params,
    ),
    pool.execute<RowDataPacket[]>(
      "SELECT DISTINCT servicio FROM cotizaciones WHERE eliminado_en IS NULL AND servicio <> '' ORDER BY servicio LIMIT 100",
    ),
    user.rol === "administrador"
      ? pool.execute<RowDataPacket[]>(
          "SELECT id, nombre FROM usuarios WHERE activo = 1 ORDER BY nombre",
        )
      : Promise.resolve([[] as RowDataPacket[]]),
  ]);

  const counts = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<Estado, number>;
  for (const row of conteos[0]) counts[row["estado"] as Estado] = Number(row["n"]);

  return {
    filas: filas[0].map((row): FilaCotizacion => ({
      id: row["id"],
      creado_en: new Date(row["creado_en"]).toISOString(),
      nombre: row["nombre"],
      empresa: row["empresa"],
      servicio: row["servicio"],
      estado: row["estado"],
      responsable: row["responsable"] ?? null,
    })),
    total: Number(total[0][0]?.["n"] ?? 0),
    conteos: counts,
    servicios: servicios[0].map((row) => row["servicio"] as string),
    responsables: responsables[0].map((row) => ({
      id: row["id"] as number,
      nombre: row["nombre"] as string,
    })),
  };
}

type Ejecutar = (sql: string, values: (string | number | null)[]) => Promise<unknown>;

async function auditar(
  ejecutar: Ejecutar,
  usuarioId: number,
  accion: "ver" | "cambiar_estado" | "asignar" | "editar" | "eliminar" | "restaurar" | "exportar",
  cotizacionId: number | null,
  detalle: string | null,
  ip: string | null,
) {
  await ejecutar(
    "INSERT INTO auditoria (usuario_id, accion, cotizacion_id, detalle, ip) VALUES (?, ?, ?, ?, ?)",
    [usuarioId, accion, cotizacionId, detalle, ip],
  );
}

async function leerHistorial(id: number): Promise<EntradaHistorial[]> {
  const [rows] = await getPool().execute<RowDataPacket[]>(
    `SELECT a.creado_en, a.accion, a.detalle, u.nombre AS usuario
       FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.cotizacion_id = ? ORDER BY a.id DESC LIMIT 200`,
    [id],
  );
  return rows.map((row) => ({
    creado_en: new Date(row["creado_en"]).toISOString(),
    accion: row["accion"],
    detalle: row["detalle"] ?? null,
    usuario: row["usuario"] ?? null,
  }));
}

/** Detalle de una cotización (y registra «ver»). `null` si no existe o está eliminada. */
export async function obtenerDetalle(
  user: AdminUser,
  id: number,
  ip: string | null,
): Promise<DetalleCotizacion | null> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT c.id, c.nombre, c.empresa, c.cargo, c.correo, c.telefono, c.servicio, c.mensaje,
            c.consentimiento_fecha, c.origen, c.idioma, c.estado, c.responsable_id, c.notas,
            c.creado_en, c.actualizado_en, u.nombre AS responsable
       FROM cotizaciones c LEFT JOIN usuarios u ON u.id = c.responsable_id
      WHERE c.id = ? AND c.eliminado_en IS NULL LIMIT 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;

  // «ver» se registra como máximo una vez por usuario y cotización cada 30 minutos: abrir el
  // detalle varias veces seguidas no llena el historial de ruido.
  const [vistos] = await pool.execute<RowDataPacket[]>(
    `SELECT id FROM auditoria
       WHERE accion = 'ver' AND usuario_id = ? AND cotizacion_id = ?
         AND creado_en >= NOW() - INTERVAL 30 MINUTE
       LIMIT 1`,
    [user.id, id],
  );
  if (vistos.length === 0) {
    await auditar((sql, values) => pool.execute(sql, values), user.id, "ver", id, null, ip);
  }
  const historial = await leerHistorial(id);
  const usuarios =
    user.rol === "administrador"
      ? (
          await pool.execute<RowDataPacket[]>(
            "SELECT id, nombre FROM usuarios WHERE activo = 1 ORDER BY nombre",
          )
        )[0].map((u) => ({ id: u["id"] as number, nombre: u["nombre"] as string }))
      : [];

  return {
    id: row["id"],
    nombre: row["nombre"],
    empresa: row["empresa"],
    cargo: row["cargo"],
    correo: row["correo"],
    telefono: row["telefono"],
    servicio: row["servicio"],
    mensaje: row["mensaje"] ?? "",
    consentimiento_fecha: new Date(row["consentimiento_fecha"]).toISOString(),
    origen: row["origen"],
    idioma: row["idioma"],
    estado: row["estado"],
    responsable_id: row["responsable_id"] ?? null,
    responsable: row["responsable"] ?? null,
    notas: row["notas"] ?? "",
    creado_en: new Date(row["creado_en"]).toISOString(),
    actualizado_en: new Date(row["actualizado_en"]).toISOString(),
    historial,
    usuarios,
  };
}

/**
 * Quién puede asignar: el administrador, a cualquier usuario activo (o a nadie); el comercial,
 * solo a sí mismo («Tomar») y solo si la solicitud no tiene responsable o ya es suya.
 */
export function puedeAsignar(
  user: { id: number; rol: "administrador" | "comercial" },
  objetivo: number | null,
  actual: number | null,
): boolean {
  if (user.rol === "administrador") return true;
  return objetivo === user.id && (actual === null || actual === user.id);
}

export type ResultadoActualizacion =
  | {
      ok: true;
      estado: Estado;
      responsable_id: number | null;
      responsable: string | null;
      notas: string;
      actualizado_en: string;
      historial: EntradaHistorial[];
    }
  | { ok: false; error: "not_found" | "conflict" | "forbidden" | "invalid" };

/**
 * Cambia estado, responsable y/o notas en una transacción con su auditoría. Control de
 * concurrencia: `actualizado_en` debe ser el que el cliente cargó; si en la base cambió, no se
 * sobrescribe nada («conflict»). Los permisos se verifican aquí, en el servidor.
 */
export async function actualizarCotizacion(
  user: AdminUser,
  id: number,
  input: UpdateInput,
  ip: string | null,
): Promise<ResultadoActualizacion> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const fail = async (error: "not_found" | "conflict" | "forbidden" | "invalid") => {
      await connection.rollback();
      return { ok: false, error } as const;
    };

    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id, estado, responsable_id, notas, actualizado_en FROM cotizaciones WHERE id = ? AND eliminado_en IS NULL FOR UPDATE",
      [id],
    );
    const row = rows[0];
    if (!row) return await fail("not_found");
    if (new Date(input.actualizado_en).getTime() !== new Date(row["actualizado_en"]).getTime()) {
      return await fail("conflict");
    }

    const sets: string[] = [];
    const params: (string | number | Date | null)[] = [];
    const audits: ["cambiar_estado" | "asignar" | "editar", string][] = [];

    if (input.estado !== undefined && input.estado !== row["estado"]) {
      sets.push("estado = ?");
      params.push(input.estado);
      audits.push(["cambiar_estado", `estado: ${row["estado"]} -> ${input.estado}`]);
    }

    if (
      input.responsable_id !== undefined &&
      input.responsable_id !== (row["responsable_id"] ?? null)
    ) {
      const actual = row["responsable_id"] ?? null;
      if (!puedeAsignar(user, input.responsable_id, actual)) return await fail("forbidden");
      let nombre = "sin asignar";
      if (input.responsable_id !== null) {
        if (input.responsable_id === user.id) {
          nombre = user.nombre;
        } else {
          const [target] = await connection.execute<RowDataPacket[]>(
            "SELECT nombre FROM usuarios WHERE id = ? AND activo = 1",
            [input.responsable_id],
          );
          if (!target[0]) return await fail("invalid");
          nombre = target[0]["nombre"];
        }
      }
      sets.push("responsable_id = ?");
      params.push(input.responsable_id);
      audits.push(["asignar", `Responsable: ${nombre}`]);
    }

    if (input.notas !== undefined) {
      const nuevas = input.notas.trim();
      if (nuevas !== String(row["notas"] ?? "").trim()) {
        sets.push("notas = ?");
        params.push(nuevas === "" ? null : nuevas);
        // El texto de la nota no se copia a la auditoría.
        audits.push(["editar", "Notas internas actualizadas"]);
      }
    }

    // Cada escritura AVANZA actualizado_en al menos 1 s sobre el valor anterior. Sin esto,
    // dos guardados dentro del mismo segundo dejarían el mismo valor (la columna no guarda
    // fracciones) y un guardado con datos viejos pasaría el control de concurrencia.
    const previous = new Date(row["actualizado_en"]).getTime();
    const nextToken = new Date(Math.max(Math.floor(Date.now() / 1000) * 1000, previous + 1000));

    if (sets.length > 0) {
      sets.push("actualizado_en = ?");
      params.push(nextToken);
      await connection.execute(`UPDATE cotizaciones SET ${sets.join(", ")} WHERE id = ?`, [
        ...params,
        id,
      ]);
      for (const [accion, detalle] of audits) {
        await auditar(
          (sql, values) => connection.execute(sql, values),
          user.id,
          accion,
          id,
          detalle,
          ip,
        );
      }
    }

    const [fresh] = await connection.execute<RowDataPacket[]>(
      `SELECT c.estado, c.responsable_id, c.notas, c.actualizado_en, u.nombre AS responsable
         FROM cotizaciones c LEFT JOIN usuarios u ON u.id = c.responsable_id WHERE c.id = ?`,
      [id],
    );
    await connection.commit();

    const current = fresh[0]!;
    return {
      ok: true,
      estado: current["estado"],
      responsable_id: current["responsable_id"] ?? null,
      responsable: current["responsable"] ?? null,
      notas: current["notas"] ?? "",
      actualizado_en: new Date(current["actualizado_en"]).toISOString(),
      historial: await leerHistorial(id),
    };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

/** Crea una solicitud a mano: mismas validaciones que el formulario público (sin Turnstile). */
export async function crearCotizacionManual(
  user: AdminUser,
  input: unknown,
): Promise<{ ok: true; id: number } | { ok: false; error: "invalid" }> {
  const datos = parseContacto(input);
  if (!datos) return { ok: false, error: "invalid" };
  const id = await insertCotizacion(datos, {
    origen: "manual",
    usuarioId: user.id,
    detalle: "Solicitud creada manualmente desde el panel",
  });
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Fase 6: papelera, exportación e historial. Las tres operaciones son solo para
// administradores; el rol se comprueba aquí, en servidor, además de en las rutas.
// ---------------------------------------------------------------------------

function esAdmin(user: { rol: "administrador" | "comercial" }): boolean {
  return user.rol === "administrador";
}

/** Token de concurrencia: siempre avanza al menos un segundo sobre el valor anterior. */
function siguienteToken(anterior: Date): Date {
  return new Date(Math.max(Math.floor(Date.now() / 1000) * 1000, anterior.getTime() + 1000));
}

export type ResultadoPapelera =
  | { ok: true; actualizado_en: string }
  | { ok: false; error: "not_found" | "conflict" | "forbidden" | "invalid" };

/** Envía una solicitud a la papelera (borrado lógico) con concurrencia y auditoría. */
export async function moverAPapelera(
  user: AdminUser,
  id: number,
  input: PapeleraInput,
  ip: string | null,
): Promise<ResultadoPapelera> {
  if (!esAdmin(user)) return { ok: false, error: "forbidden" };
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const fail = async (error: "not_found" | "conflict") => {
      await connection.rollback();
      return { ok: false, error } as const;
    };

    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT eliminado_en, actualizado_en FROM cotizaciones WHERE id = ? FOR UPDATE",
      [id],
    );
    const row = rows[0];
    if (!row || row["eliminado_en"] !== null) return await fail("not_found");
    if (new Date(input.actualizado_en).getTime() !== new Date(row["actualizado_en"]).getTime()) {
      return await fail("conflict");
    }

    const token = siguienteToken(new Date(row["actualizado_en"]));
    await connection.execute(
      "UPDATE cotizaciones SET eliminado_en = NOW(), eliminado_por = ?, actualizado_en = ? WHERE id = ?",
      [user.id, token, id],
    );
    await auditar(
      (sql, values) => connection.execute(sql, values),
      user.id,
      "eliminar",
      id,
      "enviada a la papelera",
      ip,
    );
    await connection.commit();
    return { ok: true, actualizado_en: token.toISOString() };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

/** Restaura una solicitud desde la papelera, con concurrencia y auditoría. */
export async function restaurarCotizacion(
  user: AdminUser,
  id: number,
  input: PapeleraInput,
  ip: string | null,
): Promise<ResultadoPapelera> {
  if (!esAdmin(user)) return { ok: false, error: "forbidden" };
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const fail = async (error: "not_found" | "conflict") => {
      await connection.rollback();
      return { ok: false, error } as const;
    };

    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT actualizado_en FROM cotizaciones WHERE id = ? AND eliminado_en IS NOT NULL FOR UPDATE",
      [id],
    );
    const row = rows[0];
    if (!row) return await fail("not_found");
    if (new Date(input.actualizado_en).getTime() !== new Date(row["actualizado_en"]).getTime()) {
      return await fail("conflict");
    }

    const token = siguienteToken(new Date(row["actualizado_en"]));
    await connection.execute(
      "UPDATE cotizaciones SET eliminado_en = NULL, eliminado_por = NULL, actualizado_en = ? WHERE id = ?",
      [token, id],
    );
    await auditar(
      (sql, values) => connection.execute(sql, values),
      user.id,
      "restaurar",
      id,
      "restaurada desde la papelera",
      ip,
    );
    await connection.commit();
    return { ok: true, actualizado_en: token.toISOString() };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

/** Borra definitivamente una solicitud. La auditoría se escribe ANTES del DELETE: la FK
 * deja su cotizacion_id a NULL y el detalle conserva el número para el historial. */
export async function eliminarDefinitivamente(
  user: AdminUser,
  id: number,
  input: PapeleraInput,
  ip: string | null,
): Promise<
  { ok: true } | { ok: false; error: "not_found" | "conflict" | "forbidden" | "invalid" }
> {
  if (!esAdmin(user)) return { ok: false, error: "forbidden" };
  // Doble confirmación: el número escrito por el usuario debe ser exactamente el de la fila.
  if (input.confirmacion !== id) return { ok: false, error: "invalid" };

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const fail = async (error: "not_found" | "conflict") => {
      await connection.rollback();
      return { ok: false, error } as const;
    };

    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT actualizado_en FROM cotizaciones WHERE id = ? AND eliminado_en IS NOT NULL FOR UPDATE",
      [id],
    );
    const row = rows[0];
    if (!row) return await fail("not_found");
    if (new Date(input.actualizado_en).getTime() !== new Date(row["actualizado_en"]).getTime()) {
      return await fail("conflict");
    }

    await auditar(
      (sql, values) => connection.execute(sql, values),
      user.id,
      "eliminar",
      id,
      `eliminación definitiva de la solicitud #${id}`,
      ip,
    );
    await connection.execute("DELETE FROM cotizaciones WHERE id = ?", [id]);
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

/** Lista paginada de la papelera, con búsqueda por número, nombre, empresa o servicio. */
export async function listarPapelera(
  query: PapeleraQuery,
  user: AdminUser,
): Promise<ListaPapelera> {
  if (!esAdmin(user)) return { filas: [], total: 0 };
  const conditions = ["c.eliminado_en IS NOT NULL"];
  const params: (string | number)[] = [];
  if (query.q) {
    const like = `%${escapeLike(query.q)}%`;
    conditions.push(
      "(c.nombre LIKE ? ESCAPE '!' OR c.empresa LIKE ? ESCAPE '!' OR c.servicio LIKE ? ESCAPE '!' OR CAST(c.id AS CHAR) LIKE ? ESCAPE '!')",
    );
    params.push(like, like, like, like);
  }
  const where = conditions.join(" AND ");
  const offset = (query.page - 1) * PAGE_SIZE;

  const [filas, total] = await Promise.all([
    getPool().execute<RowDataPacket[]>(
      `SELECT c.id, c.creado_en, c.nombre, c.empresa, c.servicio, c.eliminado_en,
              c.actualizado_en, u.nombre AS eliminado_por
         FROM cotizaciones c LEFT JOIN usuarios u ON u.id = c.eliminado_por
        WHERE ${where}
        ORDER BY c.eliminado_en DESC, c.id DESC
        LIMIT ? OFFSET ?`,
      [...params, String(PAGE_SIZE), String(offset)],
    ),
    getPool().execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS n FROM cotizaciones c WHERE ${where}`,
      params,
    ),
  ]);

  return {
    filas: filas[0].map((row): FilaPapelera => ({
      id: row["id"],
      creado_en: new Date(row["creado_en"]).toISOString(),
      nombre: row["nombre"],
      empresa: row["empresa"],
      servicio: row["servicio"],
      eliminado_en: new Date(row["eliminado_en"]).toISOString(),
      eliminado_por: row["eliminado_por"] ?? null,
      actualizado_en: new Date(row["actualizado_en"]).toISOString(),
    })),
    total: Number(total[0][0]?.["n"] ?? 0),
  };
}

export type ResultadoExportacion =
  | { ok: true; csv: string; nombreArchivo: string; filas: number }
  | { ok: false; error: "forbidden" | "too_many"; total?: number };

/** Exporta a CSV todas las no eliminadas que cumplen los filtros de la lista (sin paginar). */
export async function exportarCotizaciones(
  query: ListQuery,
  user: AdminUser,
  ip: string | null,
): Promise<ResultadoExportacion> {
  if (!esAdmin(user)) return { ok: false, error: "forbidden" };
  const filtro = await resolverFiltro(query, user);
  const { where, params } = buildFilters(filtro, { includeEstado: true }, user);

  // Primero comprobamos el tope para no construir un CSV gigante en memoria.
  const [conteo] = await getPool().execute<RowDataPacket[]>(
    `SELECT COUNT(*) AS n FROM cotizaciones c WHERE ${where}`,
    params,
  );
  const total = Number(conteo[0]?.["n"] ?? 0);
  if (total > MAX_EXPORTAR) return { ok: false, error: "too_many", total };

  const [filas] = await getPool().execute<RowDataPacket[]>(
    `SELECT c.id, c.creado_en, c.nombre, c.empresa, c.cargo, c.correo, c.telefono, c.servicio,
            c.mensaje, c.estado, c.consentimiento, c.consentimiento_fecha, c.origen, c.idioma,
            c.notas, u.nombre AS responsable
       FROM cotizaciones c LEFT JOIN usuarios u ON u.id = c.responsable_id
      WHERE ${where}
      ORDER BY c.creado_en DESC, c.id DESC
      LIMIT ?`,
    [...params, String(MAX_EXPORTAR)],
  );

  const encabezados = [
    "Número",
    "Fecha",
    "Nombre",
    "Empresa",
    "Cargo",
    "Correo",
    "Teléfono",
    "Servicio",
    "Mensaje",
    "Estado",
    "Responsable",
    "Origen",
    "Idioma",
    "Autorización de datos",
    "Notas internas",
  ];
  const lineas = [encabezados.map(celdaCsv).join(";")];
  for (const row of filas) {
    const origen = row["origen"] as keyof typeof ORIGEN_LABEL;
    const autorizacion =
      Number(row["consentimiento"]) === 1
        ? `Sí (${formatFechaCsv(row["consentimiento_fecha"])})`
        : "No";
    const valores = [
      row["id"],
      formatFechaCsv(row["creado_en"]),
      row["nombre"],
      row["empresa"],
      row["cargo"],
      row["correo"],
      row["telefono"],
      row["servicio"],
      row["mensaje"] ?? "",
      ESTADO_LABEL[row["estado"] as Estado] ?? String(row["estado"]),
      row["responsable"] ?? "",
      ORIGEN_LABEL[origen] ?? String(row["origen"]),
      row["idioma"],
      autorizacion,
      row["notas"] ?? "",
    ];
    lineas.push(valores.map(celdaCsv).join(";"));
  }
  // BOM para que Excel en español reconozca UTF-8 (tildes, ñ y emojis).
  const csv = `\uFEFF${lineas.join("\r\n")}\r\n`;

  await auditar(
    (sql, values) => getPool().execute(sql, values),
    user.id,
    "exportar",
    null,
    `${filas.length} filas; filtros: ${describirFiltrosCsv(filtro)}`,
    ip,
  );

  return {
    ok: true,
    csv,
    nombreArchivo: `cotizaciones_telcobras_${fechaArchivoCsv()}.csv`,
    filas: filas.length,
  };
}

/** Historial completo. NUNCA escribe en auditoría: ver el historial no deja rastro. */
export async function listarAuditoria(
  query: HistorialQuery,
  user: AdminUser,
): Promise<ListaHistorial> {
  if (!esAdmin(user)) return { filas: [], total: 0 };
  const conditions: string[] = [];
  const params: (string | number | Date)[] = [];

  if (query.usuario !== "todos") {
    conditions.push("a.usuario_id = ?");
    params.push(query.usuario);
  }
  if (query.accion !== "todas") {
    conditions.push("a.accion = ?");
    params.push(query.accion);
  }
  if (query.desde) {
    conditions.push("a.creado_en >= ?");
    params.push(new Date(`${query.desde}T00:00:00${COLOMBIA_UTC_OFFSET}`));
  }
  if (query.hasta) {
    const next = new Date(`${query.hasta}T00:00:00${COLOMBIA_UTC_OFFSET}`);
    next.setUTCDate(next.getUTCDate() + 1);
    conditions.push("a.creado_en < ?");
    params.push(next);
  }
  if (query.solicitud !== undefined) {
    // Incluye las filas cuyo cotizacion_id quedó a NULL tras una eliminación definitiva:
    // el número original sigue en el detalle de la auditoría.
    conditions.push("(a.cotizacion_id = ? OR a.detalle LIKE ?)");
    params.push(query.solicitud, `%eliminación definitiva de la solicitud #${query.solicitud}%`);
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const offset = (query.page - 1) * PAGE_SIZE_HISTORIAL;

  const [filas, total] = await Promise.all([
    getPool().execute<RowDataPacket[]>(
      `SELECT a.id, a.creado_en, a.accion, a.cotizacion_id, a.detalle, a.ip,
              COALESCE(u.nombre, 'Sistema / formulario web') AS usuario
         FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
         ${where}
        ORDER BY a.id DESC
        LIMIT ? OFFSET ?`,
      [...params, String(PAGE_SIZE_HISTORIAL), String(offset)],
    ),
    getPool().execute<RowDataPacket[]>(`SELECT COUNT(*) AS n FROM auditoria a ${where}`, params),
  ]);

  return {
    filas: filas[0].map((row): FilaHistorial => {
      const cotizacionId = row["cotizacion_id"] as number | null;
      const eliminada = cotizacionId === null ? solicitudEliminada(row["detalle"] ?? null) : null;
      return {
        id: row["id"],
        creado_en: new Date(row["creado_en"]).toISOString(),
        usuario: row["usuario"],
        accion: row["accion"],
        cotizacion_id: cotizacionId,
        solicitud:
          cotizacionId !== null
            ? `#${cotizacionId}`
            : eliminada !== null
              ? `eliminada #${eliminada}`
              : "—",
        con_enlace: cotizacionId !== null,
        detalle: row["detalle"] ?? null,
        ip: row["ip"] ?? null,
      };
    }),
    total: Number(total[0][0]?.["n"] ?? 0),
  };
}
