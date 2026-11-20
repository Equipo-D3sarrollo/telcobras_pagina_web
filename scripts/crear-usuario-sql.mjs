// Genera el INSERT de la primera cuenta del panel sin terminal de base de datos.
//
// Uso:  npm run usuario:sql
//
// Pide nombre, correo, rol y contraseña (oculta, dos veces, mínimo 12 caracteres) con las
// MISMAS validaciones que crear-usuario.mjs, calcula el hash scrypt con la MISMA función
// que el login y escribe en pantalla SOLO el INSERT listo para phpMyAdmin > pestaña SQL.
// No se conecta a MySQL, no guarda archivos y la contraseña en claro nunca se imprime.
// Ejecuta los .ts de src/lib directamente: requiere Node 22.18 o superior.
import { exit } from "node:process";
import { leerDatosCuenta } from "./usuario-input.mjs";

let generarInsertUsuario;
try {
  ({ generarInsertUsuario } = await import("../src/lib/usuario-sql.server.ts"));
} catch (error) {
  if (error?.code === "ERR_UNKNOWN_FILE_EXTENSION") {
    console.error(
      `Este script necesita Node 22.18 o superior (versión actual: ${process.version}).`,
    );
    exit(1);
  }
  throw error;
}

const datos = await leerDatosCuenta("Generar el INSERT de la cuenta inicial del panel TELCOBRAS");
const sql = await generarInsertUsuario(datos);

console.log(`\n${sql}`);
console.error(
  "\nNo se conectó a ninguna base ni se guardó nada: pega este INSERT en phpMyAdmin > pestaña SQL.",
);
