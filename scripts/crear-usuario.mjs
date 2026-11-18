// Crea una cuenta del panel (/admin) en la tabla `usuarios`.
//
// Uso:  npm run usuario:crear
// (equivale a: node --env-file=.env.local scripts/crear-usuario.mjs)
//
// Pide por consola nombre, correo, rol y contraseña (oculta al escribir, dos veces, mínimo
// 12 caracteres). Usa el mismo hash (scrypt) y la misma conexión que la aplicación; las
// credenciales DB_* salen de .env.local. Ejecuta los .ts de src/lib directamente: requiere
// Node 22.18 o superior. La contraseña nunca se imprime ni se guarda en texto plano.
import { exit, stdin, stdout } from "node:process";

const MIN_PASSWORD = 12;
const ROLES = ["administrador", "comercial"];
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!stdin.isTTY) {
  console.error(
    "Ejecuta este script en una terminal interactiva (hay que escribir la contraseña).",
  );
  exit(1);
}

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

/** Lee una línea; con `hidden` no muestra lo que se escribe. */
function ask(prompt, { hidden = false } = {}) {
  return new Promise((resolve) => {
    stdout.write(prompt);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          finish();
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          finish();
          exit(130); // Ctrl+C
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            if (!hidden) stdout.write("\b \b");
          }
          continue;
        }
        if (char >= " ") {
          value += char;
          if (!hidden) stdout.write(char);
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function askValid(prompt, validate, options) {
  for (;;) {
    const value = (await ask(prompt, options)).trim();
    const problem = validate(value);
    if (!problem) return value;
    console.log(`  ✗ ${problem}`);
  }
}

console.log("Crear cuenta del panel de cotizaciones de TELCOBRAS\n");

const nombre = await askValid("Nombre completo: ", (v) =>
  v.length === 0 || v.length > 100 ? "El nombre es obligatorio (máximo 100 caracteres)." : null,
);
const correo = (
  await askValid("Correo: ", (v) =>
    !CORREO_REGEX.test(v) || v.length > 200
      ? "Escribe un correo válido (máximo 200 caracteres)."
      : null,
  )
).toLowerCase();
const rol = await askValid(`Rol (${ROLES.join("/")}): `, (v) =>
  ROLES.includes(v) ? null : `Escribe exactamente «${ROLES[0]}» o «${ROLES[1]}».`,
);

let password;
for (;;) {
  // La contraseña no se recorta: los espacios al inicio o al final también cuentan.
  password = await ask(`Contraseña (mínimo ${MIN_PASSWORD} caracteres, no se muestra): `, {
    hidden: true,
  });
  if (password.length < MIN_PASSWORD) {
    console.log(`  ✗ Debe tener al menos ${MIN_PASSWORD} caracteres.`);
    continue;
  }
  if (password.length > 1024) {
    console.log("  ✗ Es demasiado larga (máximo 1024 caracteres).");
    continue;
  }
  const confirmation = await ask("Repite la contraseña: ", { hidden: true });
  if (confirmation === password) break;
  console.log("  ✗ Las contraseñas no coinciden. Inténtalo de nuevo.");
}

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
    "INSERT INTO usuarios (nombre, correo, password_hash, rol) VALUES (?, ?, ?, ?)",
    [nombre, correo, passwordHash, rol],
  );
  console.log(`\n✓ Cuenta creada: ${nombre} <${correo}> (${rol}), id ${result.insertId}.`);
  console.log("  Ya puede iniciar sesión en /admin/login.");
  await pool.end();
} catch (error) {
  // Solo el tipo de fallo (nunca la contraseña ni las credenciales de la base).
  console.error(
    `\nNo se pudo crear la cuenta: ${error?.name === "DbConfigError" ? error.message : (error?.code ?? "error desconocido")}`,
  );
  exit(1);
}
