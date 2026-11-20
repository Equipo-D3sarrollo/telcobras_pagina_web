import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  parseAccion,
  parseCambiarPassword,
  parseCrearUsuario,
  parseEditarUsuario,
  puedeCambiarRol,
  puedeDesactivar,
} from "./usuarios-admin-shared";

const PASSWORD = "Clave-Temporal-De-Prueba-1";

describe("usuarios-admin-shared: validación de entradas", () => {
  it("crear usuario normaliza el correo y exige todos los campos", () => {
    expect(
      parseCrearUsuario({
        nombre: "  Ana Prueba  ",
        correo: "  ANA@Example.INVALID ",
        rol: "comercial",
        password: PASSWORD,
      }),
    ).toEqual({
      nombre: "Ana Prueba",
      correo: "ana@example.invalid",
      rol: "comercial",
      password: PASSWORD,
    });
    expect(
      parseCrearUsuario({
        nombre: "",
        correo: "ana@example.invalid",
        rol: "comercial",
        password: PASSWORD,
      }),
    ).toBeNull();
    expect(
      parseCrearUsuario({
        nombre: "Ana",
        correo: "no-es-correo",
        rol: "comercial",
        password: PASSWORD,
      }),
    ).toBeNull();
    expect(
      parseCrearUsuario({
        nombre: "Ana",
        correo: "ana@example.invalid",
        rol: "otro",
        password: PASSWORD,
      }),
    ).toBeNull();
    expect(
      parseCrearUsuario({
        nombre: "Ana",
        correo: "ana@example.invalid",
        rol: "comercial",
        password: "corta",
      }),
    ).toBeNull();
  });

  it("editar usuario no acepta contraseña", () => {
    const base = { nombre: "Ana", correo: "ana@example.invalid", rol: "administrador" };
    expect(parseEditarUsuario(base)).toEqual(base);
    expect(parseEditarUsuario({ ...base, password: PASSWORD })).toEqual(base);
    expect(parseEditarUsuario({ ...base, rol: "root" })).toBeNull();
  });

  it("cambiar contraseña exige la actual y una nueva válida", () => {
    expect(parseCambiarPassword({ actual: "vieja", nueva: PASSWORD })).toEqual({
      actual: "vieja",
      nueva: PASSWORD,
    });
    expect(parseCambiarPassword({ actual: "", nueva: PASSWORD })).toBeNull();
    expect(parseCambiarPassword({ actual: "vieja", nueva: "corta" })).toBeNull();
    expect(MIN_PASSWORD_LENGTH).toBe(12);
  });

  it("solo acepta acciones permitidas", () => {
    expect(parseAccion("reiniciar_password")).toBe("reiniciar_password");
    expect(parseAccion("desactivar")).toBe("desactivar");
    expect(parseAccion("borrar")).toBeNull();
  });
});

describe("usuarios-admin-shared: reglas de seguridad del rol", () => {
  it("nadie se quita el rol de administrador a sí mismo", () => {
    expect(puedeCambiarRol(1, 1, "administrador")).toBe(true);
    expect(puedeCambiarRol(1, 1, "comercial")).toBe(false);
    expect(puedeCambiarRol(1, 2, "comercial")).toBe(true);
  });

  it("nadie se desactiva a sí mismo", () => {
    expect(puedeDesactivar(1, 1)).toBe(false);
    expect(puedeDesactivar(1, 2)).toBe(true);
  });
});
