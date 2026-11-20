// Preguntas de terminal compartidas por crear-usuario.mjs y crear-usuario-sql.mjs.
// Node 22.18 o superior (ejecuta los .ts de src/lib quitando los tipos).
import { exit, stdin, stdout } from "node:process";
import {
  ROLES,
  validarCorreo,
  validarNombre,
  validarPassword,
  validarRol,
} from "../src/lib/usuario-validacion.ts";

/** Lee una línea; con `hidden` no muestra lo que se escribe. */
export function ask(prompt, { hidden = false } = {}) {
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

export async function askValid(prompt, validate, options) {
  for (;;) {
    const value = (await ask(prompt, options)).trim();
    const problem = validate(value);
    if (!problem) return value;
    console.log(`  ✗ ${problem}`);
  }
}

/** Pide nombre, correo, rol y contraseña (oculta, dos veces) con las validaciones del panel. */
export async function leerDatosCuenta(titulo) {
  if (!stdin.isTTY) {
    console.error(
      "Ejecuta este script en una terminal interactiva (hay que escribir la contraseña).",
    );
    exit(1);
  }

  console.log(`${titulo}\n`);

  const nombre = await askValid("Nombre completo: ", validarNombre);
  const correo = (await askValid("Correo: ", validarCorreo)).toLowerCase();
  const rol = await askValid(`Rol (${ROLES.join("/")}): `, validarRol);

  let password;
  for (;;) {
    // La contraseña no se recorta: los espacios al inicio o al final también cuentan.
    password = await ask(`Contraseña (mínimo 12 caracteres, no se muestra): `, { hidden: true });
    const problema = validarPassword(password);
    if (problema) {
      console.log(`  ✗ ${problema}`);
      continue;
    }
    const confirmation = await ask("Repite la contraseña: ", { hidden: true });
    if (confirmation === password) break;
    console.log("  ✗ Las contraseñas no coinciden. Inténtalo de nuevo.");
  }

  return { nombre, correo, rol, password };
}
