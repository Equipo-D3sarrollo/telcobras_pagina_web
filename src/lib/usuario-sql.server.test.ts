import { describe, expect, it } from "vitest";
import { verifyPassword } from "./password.server";
import { generarInsertUsuario } from "./usuario-sql.server";
import {
  MAX_PASSWORD,
  validarCorreo,
  validarNombre,
  validarPassword,
  validarRol,
} from "./usuario-validacion";

/** Lee los cuatro literales del VALUES para comprobar el escape de ida y vuelta. */
function leerLiterales(sql: string): string[] {
  const valores: string[] = [];
  let i = sql.indexOf("VALUES (") + "VALUES (".length;
  const escapados: Record<string, string> = {
    "\\": "\\",
    "'": "'",
    n: "\n",
    r: "\r",
    "0": "\0",
    Z: "\u001a",
  };
  while (i < sql.length) {
    if (sql[i] !== "'") break;
    i++;
    let valor = "";
    while (i < sql.length) {
      const caracter = sql[i]!;
      if (caracter === "'" && sql[i + 1] === "'") {
        valor += "'";
        i += 2;
        continue;
      }
      if (caracter === "'") {
        i++;
        break;
      }
      if (caracter === "\\") {
        valor += escapados[sql[i + 1]!] ?? sql[i + 1]!;
        i += 2;
        continue;
      }
      valor += caracter;
      i++;
    }
    valores.push(valor);
    while (i < sql.length && /[\s,]/.test(sql[i]!)) i++;
  }
  return valores;
}

const cuenta = {
  nombre: "Ana Pérez",
  correo: "ana@telcobras.com",
  rol: "administrador" as const,
  password: "Clave-Temporal-De-Prueba-9",
};

describe("INSERT de la cuenta inicial para phpMyAdmin", () => {
  it("genera un INSERT válido y el hash se verifica con la contraseña", async () => {
    const sql = await generarInsertUsuario(cuenta);

    expect(sql).toMatch(
      /^INSERT INTO usuarios \(nombre, correo, password_hash, rol, debe_cambiar_password\)\nVALUES \(/,
    );
    expect(sql).toMatch(/, 1\);$/);
    const [nombre, correo, hash, rol] = leerLiterales(sql);
    expect(nombre).toBe(cuenta.nombre);
    expect(correo).toBe(cuenta.correo);
    expect(rol).toBe(cuenta.rol);
    expect(hash).toMatch(/^scrypt\$N=32768,r=8,p=3\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(await verifyPassword(cuenta.password, hash!)).toBe(true);
    expect(await verifyPassword("Clave-Temporal-De-Prueba-10", hash!)).toBe(false);
    expect(sql).not.toContain(cuenta.password);
  });

  it("escapa comillas, barras y saltos sin romper el literal", async () => {
    const nombre = 'O\'Brien \\ "Navarro"\nSegunda línea';
    const sql = await generarInsertUsuario({ ...cuenta, nombre, rol: "comercial" });
    const [leido] = leerLiterales(sql);
    expect(leido).toBe(nombre);
    expect(leerLiterales(sql)[3]).toBe("comercial");
  });

  it("usa las mismas validaciones que crear-usuario.mjs", () => {
    expect(validarNombre("")).toContain("obligatorio");
    expect(validarNombre("a".repeat(101))).toContain("100");
    expect(validarNombre("Ana Pérez")).toBeNull();
    expect(validarCorreo("sin-arroba")).toContain("válido");
    expect(validarCorreo("ana@telcobras.com")).toBeNull();
    expect(validarRol("admin")).toContain("administrador");
    expect(validarRol("comercial")).toBeNull();
    expect(validarPassword("corta")).toContain("12");
    expect(validarPassword("x".repeat(MAX_PASSWORD + 1))).toContain("1024");
    expect(validarPassword(cuenta.password)).toBeNull();
  });
});
