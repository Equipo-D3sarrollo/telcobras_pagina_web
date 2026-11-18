import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DbConfigError, getPool } from "./db.server";

const VARS = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;
const saved: Record<string, string | undefined> = {};
const globalForDb = globalThis as { __telcobrasDbPool?: unknown };

beforeEach(() => {
  for (const name of VARS) saved[name] = process.env[name];
  delete globalForDb.__telcobrasDbPool;
});

afterEach(() => {
  for (const name of VARS) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  delete globalForDb.__telcobrasDbPool;
});

describe("getPool", () => {
  it("si faltan variables lanza un error que solo nombra las que faltan", () => {
    for (const name of VARS) delete process.env[name];
    process.env["DB_HOST"] = "host-secreto.example";
    process.env["DB_PASSWORD"] = "clave-super-secreta";

    let error: unknown;
    try {
      getPool();
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(DbConfigError);
    const message = (error as Error).message;
    expect(message).toContain("DB_NAME");
    expect(message).toContain("DB_USER");
    expect(message).not.toContain("DB_HOST");
    expect(message).not.toContain("host-secreto.example");
    expect(message).not.toContain("clave-super-secreta");
  });

  it("rechaza un DB_PORT inválido sin mostrar valores", () => {
    process.env["DB_HOST"] = "localhost";
    process.env["DB_NAME"] = "base";
    process.env["DB_USER"] = "usuario";
    process.env["DB_PASSWORD"] = "clave";
    process.env["DB_PORT"] = "no-es-un-puerto";
    expect(() => getPool()).toThrow(DbConfigError);
    expect(() => getPool()).not.toThrow(/clave|usuario|base/);
  });

  it("crea el pool una sola vez", async () => {
    process.env["DB_HOST"] = "localhost";
    process.env["DB_NAME"] = "base";
    process.env["DB_USER"] = "usuario";
    process.env["DB_PASSWORD"] = "clave";
    delete process.env["DB_PORT"];
    const pool = getPool();
    expect(getPool()).toBe(pool);
    await pool.end();
  });
});
