import { hashPassword } from "./password.server";
import type { Rol } from "./usuario-validacion";

/** Solo servidor / scripts de terminal. Genera SQL para la cuenta inicial del panel. */

export type DatosCuenta = {
  nombre: string;
  correo: string;
  rol: Rol;
  /** Nunca se imprime ni se guarda; solo se usa para derivar el hash. */
  password: string;
};

/**
 * Escapa un valor para MySQL en modo estándar (el de phpMyAdmin/cPanel:
 * NO_BACKSLASH_ESCAPES desactivado). Se escapan la barra invertida y la comilla simple
 * antes que los saltos, para que ningún carácter pueda cerrar el literal.
 */
export function escaparSql(valor: string): string {
  let salida = "";
  for (const caracter of valor) {
    switch (caracter) {
      case "\\":
        salida += "\\\\";
        break;
      case "'":
        salida += "''";
        break;
      case "\n":
        salida += "\\n";
        break;
      case "\r":
        salida += "\\r";
        break;
      case "\0":
        salida += "\\0";
        break;
      case "\u001a":
        salida += "\\Z";
        break;
      default:
        salida += caracter;
    }
  }
  return salida;
}

/**
 * Devuelve un INSERT listo para pegar en la pestaña SQL de phpMyAdmin. Todas las columnas
 * con datos se escriben como literales escapados; `debe_cambiar_password = 1` obliga a
 * cambiar la contraseña temporal la primera vez que se entre en el panel.
 */
export async function generarInsertUsuario(datos: DatosCuenta): Promise<string> {
  // Mismo hash scrypt que usa el login (src/lib/password.server.ts).
  const passwordHash = await hashPassword(datos.password);
  return [
    "INSERT INTO usuarios (nombre, correo, password_hash, rol, debe_cambiar_password)",
    `VALUES ('${escaparSql(datos.nombre)}', '${escaparSql(datos.correo)}', ` +
      `'${escaparSql(passwordHash)}', '${escaparSql(datos.rol)}', 1);`,
  ].join("\n");
}
