import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: string[] = [];
const executed: { sql: string; params: unknown[] }[] = [];
let failOn: "cotizacion" | "auditoria" | null = null;

const connection = {
  beginTransaction: vi.fn(async () => void calls.push("begin")),
  commit: vi.fn(async () => void calls.push("commit")),
  rollback: vi.fn(async () => void calls.push("rollback")),
  release: vi.fn(() => void calls.push("release")),
  execute: vi.fn(async (sql: string, params: unknown[]) => {
    executed.push({ sql, params });
    const esCotizacion = sql.includes("INTO cotizaciones");
    if ((esCotizacion && failOn === "cotizacion") || (!esCotizacion && failOn === "auditoria")) {
      throw Object.assign(new Error("fallo simulado"), { code: "ER_SIMULADO" });
    }
    return [{ insertId: 42 }];
  }),
};

vi.mock("./db.server", () => ({ getPool: () => ({ getConnection: async () => connection }) }));

const { insertCotizacion } = await import("./cotizaciones.server");

const datos = {
  nombre: "Ana Pérez",
  empresa: "ACME",
  cargo: "Gerente",
  correo: "ana@example.com",
  telefono: "3001234567",
  servicio: "Conectividad",
  mensaje: "Hola'; DROP TABLE cotizaciones; --",
  idioma: "es" as const,
};

beforeEach(() => {
  calls.length = 0;
  executed.length = 0;
  failOn = null;
  vi.clearAllMocks();
});

describe("insertCotizacion", () => {
  it("guarda la cotización y la auditoría en una transacción y devuelve el id", async () => {
    await expect(insertCotizacion(datos)).resolves.toBe(42);
    expect(calls).toEqual(["begin", "commit", "release"]);
    expect(executed).toHaveLength(2);

    const [cotizacion, auditoria] = executed;
    expect(cotizacion!.params.slice(0, 7)).toEqual([
      "Ana Pérez",
      "ACME",
      "Gerente",
      "ana@example.com",
      "3001234567",
      "Conectividad",
      datos.mensaje,
    ]);
    // consentimiento, fecha, origen, idioma y estado
    expect(cotizacion!.params[7]).toBe(1);
    expect(cotizacion!.params[8]).toBeInstanceOf(Date);
    expect(cotizacion!.params.slice(9)).toEqual(["formulario_web", "es", "nueva"]);
    // auditoría: usuario NULL, acción 'crear', id de la cotización y detalle sin datos personales
    expect(auditoria!.params).toEqual([
      null,
      "crear",
      42,
      "Solicitud recibida desde el formulario web",
    ]);
  });

  it("solo usa marcadores ?: ningún dato del usuario llega al texto SQL", async () => {
    await insertCotizacion(datos);
    for (const { sql, params } of executed) {
      expect(sql.match(/\?/g)).toHaveLength(params.length);
      expect(sql).not.toContain("DROP TABLE");
      expect(sql).not.toContain("ana@example.com");
    }
  });

  it("guarda el mensaje vacío como NULL", async () => {
    await insertCotizacion({ ...datos, mensaje: "" });
    expect(executed[0]!.params[6]).toBeNull();
  });

  it("si falla la auditoría deshace la cotización y libera la conexión", async () => {
    failOn = "auditoria";
    await expect(insertCotizacion(datos)).rejects.toMatchObject({ code: "ER_SIMULADO" });
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });

  it("si falla la cotización no escribe la auditoría", async () => {
    failOn = "cotizacion";
    await expect(insertCotizacion(datos)).rejects.toMatchObject({ code: "ER_SIMULADO" });
    expect(executed).toHaveLength(1);
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });
});
