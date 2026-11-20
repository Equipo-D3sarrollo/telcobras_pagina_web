import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password.server";

describe("hashPassword / verifyPassword", () => {
  it("guarda algoritmo, parámetros, sal y hash en un solo texto", async () => {
    const hash = await hashPassword("una-contraseña-larga-1");
    expect(hash).toMatch(/^scrypt\$N=32768,r=8,p=3\$[A-Za-z0-9+/]+=*\$[A-Za-z0-9+/]+=*$/);
    const [, , salt, key] = hash.split("$");
    expect(Buffer.from(salt!, "base64")).toHaveLength(16);
    expect(Buffer.from(key!, "base64")).toHaveLength(64);
    expect(hash.length).toBeLessThanOrEqual(255); // cabe en usuarios.password_hash
    expect(hash).not.toContain("una-contraseña-larga-1");
  });

  it("usa una sal distinta cada vez", async () => {
    const [a, b] = await Promise.all([
      hashPassword("misma-clave-123"),
      hashPassword("misma-clave-123"),
    ]);
    expect(a).not.toBe(b);
  });

  it("verifica la contraseña correcta y rechaza las demás", async () => {
    const hash = await hashPassword("Correcta-Horse-Battery-9");
    expect(await verifyPassword("Correcta-Horse-Battery-9", hash)).toBe(true);
    expect(await verifyPassword("Correcta-Horse-Battery-8", hash)).toBe(false);
    expect(await verifyPassword("", hash)).toBe(false);
    expect(await verifyPassword("correcta-horse-battery-9", hash)).toBe(false);
  });

  it("trata igual las formas Unicode equivalentes (NFKC)", async () => {
    const hash = await hashPassword("contraseña-segura-1"); // ñ precompuesta
    expect(await verifyPassword("contraseña-segura-1", hash)).toBe(true); // n + tilde
  });

  it("un hash alterado o mal formado nunca coincide (y no lanza)", async () => {
    const hash = await hashPassword("clave-de-prueba-12");
    const parts = hash.split("$");
    const tampered = `${parts[0]}$${parts[1]}$${parts[2]}$${Buffer.alloc(64, 1).toString("base64")}`;
    expect(await verifyPassword("clave-de-prueba-12", tampered)).toBe(false);
    for (const bad of [
      "",
      "texto-plano",
      "bcrypt$N=1,r=1,p=1$AAAA$BBBB",
      "scrypt$$$",
      "scrypt$N=x,r=8,p=3$AAAAAAAAAAAA$BBBBBBBBBBBBBBBBBBBBBBBB",
    ]) {
      expect(await verifyPassword("clave-de-prueba-12", bad)).toBe(false);
    }
  });

  it("rechaza al instante parámetros fuera de rango (no pide memoria absurda)", async () => {
    const salt = Buffer.alloc(16, 7).toString("base64");
    const key = Buffer.alloc(64, 9).toString("base64");
    const started = Date.now();
    expect(await verifyPassword("x", `scrypt$N=1073741824,r=8,p=3$${salt}$${key}`)).toBe(false);
    expect(await verifyPassword("x", `scrypt$N=32768,r=999,p=3$${salt}$${key}`)).toBe(false);
    expect(await verifyPassword("x", `scrypt$N=32767,r=8,p=3$${salt}$${key}`)).toBe(false); // no es potencia de 2
    expect(Date.now() - started).toBeLessThan(500);
  });
});
