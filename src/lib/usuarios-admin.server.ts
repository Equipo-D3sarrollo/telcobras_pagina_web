import { randomBytes } from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getPool } from "./db.server";
import { hashPassword, verifyPassword } from "./password.server";
import type { AdminUser } from "./auth.server";
import {
  puedeCambiarRol,
  puedeDesactivar,
  type AccionUsuario,
  type CambiarPasswordInput,
  type CrearUsuarioInput,
  type EditarUsuarioInput,
  type UsuarioLista,
} from "./usuarios-admin-shared";

/*
 * Gestión de cuentas del panel (/admin/usuarios y /admin/mi-cuenta). Solo servidor.
 * Consultas siempre preparadas; el rol se comprueba aquí, en cada acción, no solo en la UI.
 * La auditoría registra solo la acción, el usuario, la IP y un texto genérico: nunca contraseñas.
 */

type AccionAuditada =
  Exclude<AccionUsuario, "editar"> | "crear_usuario" | "editar_usuario" | "cambiar_password";

type UsuarioRow = RowDataPacket & {
  id: number;
  nombre: string;
  correo: string;
  rol: "administrador" | "comercial";
  activo: number;
  debe_cambiar_password: number;
  bloqueado_hasta: Date | null;
  ultimo_acceso: Date | null;
};

function logError(where: string, error: unknown) {
  const { code, errno } = (typeof error === "object" && error !== null ? error : {}) as Record<
    string,
    unknown
  >;
  console.error(`[${where}] Error.`, { code, errno });
}

function iso(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function soloAdmin(admin: AdminUser): boolean {
  return admin.rol === "administrador";
}

/** Texto fijo por acción; no incluye correos, nombres ni contraseñas. */
function detalle(accion: AccionAuditada): string {
  switch (accion) {
    case "crear_usuario":
      return "Cuenta creada con contraseña temporal";
    case "editar_usuario":
      return "Datos de la cuenta actualizados";
    case "activar":
      return "Cuenta activada";
    case "desactivar":
      return "Cuenta desactivada";
    case "desbloquear":
      return "Bloqueo y contador de intentos reiniciados";
    case "reiniciar_password":
      return "Contraseña reiniciada; pendiente de cambio";
    case "cambiar_password":
      return "Contraseña actualizada desde Mi cuenta";
  }
}

async function audit(
  usuarioId: number | null,
  accion: AccionAuditada,
  ip: string | null,
  connection?: PoolConnection,
) {
  const sql = "INSERT INTO auditoria (usuario_id, accion, detalle, ip) VALUES (?, ?, ?, ?)";
  const values = [usuarioId, accion, detalle(accion), ip];
  if (connection) await connection.execute(sql, values);
  else await getPool().execute(sql, values);
}

export async function listarUsuarios(): Promise<UsuarioLista[]> {
  const [rows] = await getPool().execute<UsuarioRow[]>(
    `SELECT id, nombre, correo, rol, activo, debe_cambiar_password, bloqueado_hasta, ultimo_acceso
       FROM usuarios ORDER BY id ASC`,
  );
  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    rol: row.rol,
    activo: row.activo === 1,
    debeCambiarPassword: row.debe_cambiar_password === 1,
    bloqueadoHasta: iso(row.bloqueado_hasta),
    ultimoAcceso: iso(row.ultimo_acceso),
  }));
}

export type ResultadoCrear =
  { ok: true; id: number } | { ok: false; error: "forbidden" | "conflict" };

export async function crearUsuario(
  admin: AdminUser,
  input: CrearUsuarioInput,
  ip: string | null,
): Promise<ResultadoCrear> {
  if (!soloAdmin(admin)) return { ok: false, error: "forbidden" };
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const passwordHash = await hashPassword(input.password);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol, debe_cambiar_password)
       VALUES (?, ?, ?, ?, 1)`,
      [input.nombre, input.correo, passwordHash, input.rol],
    );
    await audit(admin.id, "crear_usuario", ip, connection);
    await connection.commit();
    return { ok: true, id: result.insertId };
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      return { ok: false, error: "conflict" };
    logError("usuarios/crear", error);
    throw error;
  } finally {
    connection.release();
  }
}

export type ResultadoAccion =
  | { ok: true; passwordTemporal?: string }
  | { ok: false; error: "forbidden" | "not_found" | "conflict"; mensaje?: string };

const ULTIMO_ADMIN_MENSAJE = "Debe quedar al menos un administrador activo";

/**
 * Dentro de la transacción bloquea los administradores activos (FOR UPDATE) y comprueba que la
 * acción no deje cero. El bloqueo evita que dos administradores se desactiven cruzadamente.
 */
async function quedariaSinAdministradores(
  connection: PoolConnection,
  targetId: number,
  quitaRolAdmin: boolean,
): Promise<boolean> {
  const [rows] = await connection.execute<RowDataPacket[]>(
    "SELECT id FROM usuarios WHERE rol = 'administrador' AND activo = 1 FOR UPDATE",
  );
  const admins = rows.map((row) => row["id"] as number);
  return quitaRolAdmin && admins.length === 1 && admins[0] === targetId;
}

export async function editarUsuario(
  admin: AdminUser,
  id: number,
  input: EditarUsuarioInput,
  ip: string | null,
): Promise<ResultadoAccion> {
  if (!soloAdmin(admin) || !puedeCambiarRol(admin.id, id, input.rol)) {
    return { ok: false, error: "forbidden" };
  }
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    if (await quedariaSinAdministradores(connection, id, input.rol === "comercial")) {
      await connection.rollback();
      return { ok: false, error: "conflict", mensaje: ULTIMO_ADMIN_MENSAJE };
    }
    const [result] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET nombre = ?, correo = ?, rol = ? WHERE id = ?",
      [input.nombre, input.correo, input.rol, id],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return { ok: false, error: "not_found" };
    }
    await audit(admin.id, "editar_usuario", ip, connection);
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    if ((error as { code?: string }).code === "ER_DUP_ENTRY")
      return { ok: false, error: "conflict" };
    logError("usuarios/editar", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function cambiarEstadoUsuario(
  admin: AdminUser,
  id: number,
  activo: boolean,
  ip: string | null,
): Promise<ResultadoAccion> {
  if (!soloAdmin(admin) || (!activo && !puedeDesactivar(admin.id, id))) {
    return { ok: false, error: "forbidden" };
  }
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    if (!activo && (await quedariaSinAdministradores(connection, id, true))) {
      await connection.rollback();
      return { ok: false, error: "conflict", mensaje: ULTIMO_ADMIN_MENSAJE };
    }
    const [result] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET activo = ? WHERE id = ?",
      [activo ? 1 : 0, id],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return { ok: false, error: "not_found" };
    }
    if (!activo) await connection.execute("DELETE FROM sesiones WHERE usuario_id = ?", [id]);
    await audit(admin.id, activo ? "activar" : "desactivar", ip, connection);
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    logError("usuarios/estado", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function desbloquearUsuario(
  admin: AdminUser,
  id: number,
  ip: string | null,
): Promise<ResultadoAccion> {
  if (!soloAdmin(admin)) return { ok: false, error: "forbidden" };
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
      [id],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return { ok: false, error: "not_found" };
    }
    await audit(admin.id, "desbloquear", ip, connection);
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    logError("usuarios/desbloquear", error);
    throw error;
  } finally {
    connection.release();
  }
}

/** Contraseña temporal nueva, generada en el servidor y devuelta una sola vez a quien administra. */
function nuevaPasswordTemporal(): string {
  return randomBytes(18).toString("base64url");
}

export async function reiniciarPassword(
  admin: AdminUser,
  id: number,
  ip: string | null,
): Promise<ResultadoAccion> {
  if (!soloAdmin(admin)) return { ok: false, error: "forbidden" };
  const passwordTemporal = nuevaPasswordTemporal();
  const passwordHash = await hashPassword(passwordTemporal);
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE usuarios
          SET password_hash = ?, debe_cambiar_password = 1,
              intentos_fallidos = 0, bloqueado_hasta = NULL
        WHERE id = ?`,
      [passwordHash, id],
    );
    if (result.affectedRows === 0) {
      await connection.rollback();
      return { ok: false, error: "not_found" };
    }
    await connection.execute("DELETE FROM sesiones WHERE usuario_id = ?", [id]);
    await audit(admin.id, "reiniciar_password", ip, connection);
    await connection.commit();
    return { ok: true, passwordTemporal };
  } catch (error) {
    await connection.rollback();
    logError("usuarios/reiniciar", error);
    throw error;
  } finally {
    connection.release();
  }
}

export type ResultadoCambioPassword = { ok: true } | { ok: false; error: "invalid" };

/** Cambio de la propia contraseña (/admin/mi-cuenta); exige la contraseña actual. */
export async function cambiarPasswordPropio(
  admin: AdminUser,
  input: CambiarPasswordInput,
  ip: string | null,
): Promise<ResultadoCambioPassword> {
  const [rows] = await getPool().execute<RowDataPacket[]>(
    "SELECT password_hash FROM usuarios WHERE id = ? LIMIT 1",
    [admin.id],
  );
  const row = rows[0];
  if (!row || !(await verifyPassword(input.actual, row["password_hash"] as string))) {
    return { ok: false, error: "invalid" };
  }
  const passwordHash = await hashPassword(input.nueva);
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 0 WHERE id = ?",
      [passwordHash, admin.id],
    );
    await audit(admin.id, "cambiar_password", ip, connection);
    await connection.commit();
    return { ok: true };
  } catch (error) {
    await connection.rollback();
    logError("usuarios/mi-cuenta", error);
    throw error;
  } finally {
    connection.release();
  }
}
