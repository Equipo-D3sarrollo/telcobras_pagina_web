// Crea una cuenta del panel (/admin) en la tabla `usuarios`.
//
// Uso:  npm run usuario:crear
// (equivale a: node --env-file=.env.local scripts/crear-usuario.mjs)
//
// Pide por consola nombre, correo, rol y contraseña (oculta al escribir, dos veces, mínimo
// 12 caracteres). Usa el mismo hash (scrypt) y la misma conexión que la aplicación; las
// credenciales DB_* salen de .env.local. Ejecuta los .ts de src/lib directamente: requiere
// Node 22.18 o superior. La contraseña nunca se imprime ni se guarda en texto plano.
import { exit } from "node:process";
import { leerDatosCuenta } from "./usuario-input.mjs";

let hashPassword;
let getPool;
try {
  ({ hashPassword } = await import("../src/lib/password.server.ts"));
  ({ getPool } = await import("../src/lib/db.server.ts"));
} catch (error) {
  if (error?.code === "ERR_UNKNOWN_FILE_EXTENSION") {
    console.error(
      `Este script necesita Node 22.18 o superior (versión actual: ${process.version}).`,
    );
    exit(1);
  }
  throw error;
}

const { nombre, correo, rol, password } = await leerDatosCuenta(
  "Crear cuenta del panel de cotizaciones de TELCOBRAS",
);

try {
  const pool = getPool();
  const [existing] = await pool.execute("SELECT id FROM usuarios WHERE correo = ? LIMIT 1", [
    correo,
  ]);
  if (existing.length > 0) {
    console.error(`\nYa existe una cuenta con el correo ${correo}. No se creó nada.`);
    await pool.end();
    exit(1);
  }

  const passwordHash = await hashPassword(password);
  const [result] = await pool.execute(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol, debe_cambiar_password)
     VALUES (?, ?, ?, ?, 1)`,
    [nombre, correo, passwordHash, rol],
  );
  console.log(`\n✓ Cuenta creada: ${nombre} <${correo}> (${rol}), id ${result.insertId}.`);
  console.log("  Al entrar al panel deberá cambiar la contraseña desde «Mi cuenta».");
  await pool.end();
} catch (error) {
  // Solo el tipo de fallo (nunca la contraseña ni las credenciales de la base).
  console.error(
    `\nNo se pudo crear la cuenta: ${error?.name === "DbConfigError" ? error.message : (error?.code ?? "error desconocido")}`,
  );
  exit(1);
}
