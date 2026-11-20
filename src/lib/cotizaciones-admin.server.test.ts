import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ESTADOS,
  PAGE_SIZE,
  escapeLike,
  parseId,
  parseListQuery,
  parseUpdateInput,
} from "./cotizaciones-admin-shared";

type Row = Record<string, unknown>;
const executed: { sql: string; params: unknown[] }[] = [];
const calls: string[] = [];

// Estado de la «base» y respuestas por consulta (todo en memoria).
const state = vi.hoisted(() => ({
  cotizacion: null as null | {
    estado: string;
    responsable_id: number | null;
    notas: string | null;
    actualizado_en: Date;
  },
  usuarios: new Map<number, { nombre: string; activo: number }>(),
  auditoria: [] as { usuario_id: number; accion: string; detalle: string | null }[],
  vistoUserId: null as number | null,
  insertCotizacion: vi.fn(async (..._args: unknown[]) => 77),
}));

const connection = {
  beginTransaction: vi.fn(async () => void calls.push("begin")),
  commit: vi.fn(async () => void calls.push("commit")),
  rollback: vi.fn(async () => void calls.push("rollback")),
  release: vi.fn(() => void calls.push("release")),
  execute: async (sql: string, rawParams: unknown[] = []) => run(sql, rawParams),
};

function run(rawSql: string, params: unknown[]): [Row[]] {
  const sql = rawSql.replace(/\s+/g, " ").trim();
  executed.push({ sql, params });
  const c = state.cotizacion;
  if (
    sql.startsWith("SELECT id, estado, responsable_id, notas, actualizado_en FROM cotizaciones")
  ) {
    return [c ? [{ id: 5, ...c }] : []];
  }
  if (sql.startsWith("SELECT nombre FROM usuarios WHERE id = ? AND activo = 1")) {
    const u = state.usuarios.get(params[0] as number);
    return [u && u.activo === 1 ? [{ nombre: u.nombre }] : []];
  }
  if (sql.startsWith("UPDATE cotizaciones SET")) {
    const fields = [...sql.matchAll(/(\w+) = \?/g)].map((m) => m[1]!);
    fields.slice(0, -1).forEach((field, i) => {
      (c as unknown as Row)[field] = params[i];
    });
    // La base NO avanza sola actualizado_en (fracciones de segundo no guardadas): el código debe hacerlo.
    return [[]];
  }
  if (sql.startsWith("INSERT INTO auditoria")) {
    state.auditoria.push({
      usuario_id: params[0] as number,
      accion: params[1] as string,
      detalle: params[3] as string | null,
    });
    return [[]];
  }
  if (
    sql.startsWith(
      "SELECT c.estado, c.responsable_id, c.notas, c.actualizado_en, u.nombre AS responsable",
    )
  ) {
    const nombre = c!.responsable_id
      ? (state.usuarios.get(c!.responsable_id)?.nombre ?? null)
      : null;
    return [[{ ...c, responsable: nombre }]];
  }
  if (sql.startsWith("SELECT a.creado_en, a.accion")) return [[]];
  if (sql.startsWith("SELECT id FROM auditoria WHERE accion = 'ver'")) {
    return [state.vistoUserId === params[0] ? [{ id: 99 }] : []];
  }
  if (sql.startsWith("SELECT id FROM usuarios WHERE id = ? LIMIT 1")) {
    return [state.usuarios.has(params[0] as number) ? [{ id: params[0] }] : []];
  }
  if (sql.startsWith("SELECT id, nombre FROM usuarios WHERE activo = 1")) {
    return [
      [...state.usuarios.entries()]
        .filter(([, u]) => u.activo === 1)
        .map(([id, u]) => ({ id, nombre: u.nombre })),
    ];
  }
  if (sql.startsWith("SELECT c.id, c.nombre, c.empresa, c.cargo")) {
    return [
      [
        {
          id: 5,
          nombre: "Cliente Detalle",
          empresa: "ACME",
          cargo: "",
          correo: "cliente@example.invalid",
          telefono: "3001112233",
          servicio: "Nube",
          mensaje: "Hola",
          consentimiento_fecha: new Date("2026-11-01T10:00:00Z"),
          origen: "formulario_web",
          idioma: "es",
          estado: c!.estado,
          responsable_id: c!.responsable_id,
          responsable: c!.responsable_id
            ? (state.usuarios.get(c!.responsable_id)?.nombre ?? null)
            : null,
          notas: c!.notas,
          creado_en: new Date("2026-11-01T10:00:00Z"),
          actualizado_en: c!.actualizado_en,
        },
      ],
    ];
  }
  // Lista
  if (sql.startsWith("SELECT c.id, c.creado_en, c.nombre")) return [[]];
  if (sql.startsWith("SELECT COUNT(*) AS n")) return [[{ n: 0 }]];
  if (sql.startsWith("SELECT c.estado, COUNT(*)")) return [[{ estado: "nueva", n: 3 }]];
  if (sql.startsWith("SELECT DISTINCT servicio")) return [[{ servicio: "Conectividad" }]];
  throw new Error("Consulta no prevista en la prueba: " + sql);
}

vi.mock("./db.server", () => ({
  getPool: () => ({ execute: connection.execute, getConnection: async () => connection }),
}));
vi.mock("./cotizaciones.server", () => ({ insertCotizacion: state.insertCotizacion }));

const {
  actualizarCotizacion,
  buildFilters,
  crearCotizacionManual,
  listarCotizaciones,
  obtenerDetalle,
  puedeAsignar,
} = await import("./cotizaciones-admin.server");

const admin = {
  id: 1,
  nombre: "Ada Admin",
  correo: "ada@example.invalid",
  rol: "administrador" as const,
  debe_cambiar_password: 0,
};
const comercial = {
  id: 2,
  nombre: "Carlos Comercial",
  correo: "carlos@example.invalid",
  rol: "comercial" as const,
  debe_cambiar_password: 0,
};
const otro = {
  id: 3,
  nombre: "Olga Otra",
  correo: "olga@example.invalid",
  rol: "comercial" as const,
  debe_cambiar_password: 0,
};
const CARGADO = new Date("2026-11-18T10:00:00-05:00");

beforeEach(() => {
  executed.length = 0;
  calls.length = 0;
  state.auditoria.length = 0;
  state.vistoUserId = null;
  state.insertCotizacion.mockClear();
  state.cotizacion = {
    estado: "nueva",
    responsable_id: null,
    notas: null,
    actualizado_en: new Date(CARGADO),
  };
  state.usuarios = new Map([
    [1, { nombre: "Ada Admin", activo: 1 }],
    [2, { nombre: "Carlos Comercial", activo: 1 }],
    [3, { nombre: "Olga Otra", activo: 1 }],
    [4, { nombre: "Inactivo", activo: 0 }],
  ]);
});

const input = (extra: Record<string, unknown>) => ({
  actualizado_en: CARGADO.toISOString(),
  ...extra,
});
const updates = () => executed.filter((e) => e.sql.startsWith("UPDATE cotizaciones"));

describe("parseListQuery: filtros, orden y paginación contra listas permitidas", () => {
  it("valores por defecto", () => {
    expect(parseListQuery({})).toEqual({
      q: undefined,
      estado: undefined,
      servicio: undefined,
      responsable: "todos",
      desde: undefined,
      hasta: undefined,
      orden: "fecha",
      dir: "desc",
      page: 1,
    });
    expect(parseListQuery(null).page).toBe(1);
    expect(parseListQuery("texto").orden).toBe("fecha");
  });

  it("solo acepta los estados del esquema", () => {
    for (const estado of ESTADOS) expect(parseListQuery({ estado }).estado).toBe(estado);
    expect(parseListQuery({ estado: "nueva' OR '1'='1" }).estado).toBeUndefined();
    expect(parseListQuery({ estado: "inventado" }).estado).toBeUndefined();
  });

  it("el orden solo puede ser uno de la lista y la dirección asc/desc", () => {
    expect(parseListQuery({ orden: "nombre" }).orden).toBe("nombre");
    expect(parseListQuery({ orden: "creado_en; DROP TABLE cotizaciones" }).orden).toBe("fecha");
    expect(parseListQuery({ orden: "c.password" }).orden).toBe("fecha");
    expect(parseListQuery({ dir: "asc" }).dir).toBe("asc");
    expect(parseListQuery({ dir: "ASC; --" }).dir).toBe("desc");
  });

  it("la página es un entero positivo acotado", () => {
    expect(parseListQuery({ page: "3" }).page).toBe(3);
    for (const page of ["0", "-4", "abc", "2.5", "", null, {}, "1e3"]) {
      expect(parseListQuery({ page }).page).toBe(1);
    }
    expect(parseListQuery({ page: "999999999" }).page).toBe(100_000);
  });

  it("recorta la búsqueda y descarta fechas inválidas", () => {
    expect(parseListQuery({ q: "  ana  " }).q).toBe("ana");
    expect(parseListQuery({ q: "x".repeat(500) }).q).toHaveLength(100);
    expect(parseListQuery({ q: "   " }).q).toBeUndefined();
    expect(parseListQuery({ desde: "2026-11-18", hasta: "2026-11-30" })).toMatchObject({
      desde: "2026-11-18",
      hasta: "2026-11-30",
    });
    for (const bad of [
      "2026-13-01",
      "2026-02-30",
      "18/11/2026",
      "2026-11-18T00:00",
      "'; --",
      20261118,
    ]) {
      expect(parseListQuery({ desde: bad }).desde).toBeUndefined();
    }
  });

  it("responsable: solo todos/mios/sin_asignar o un id entero positivo", () => {
    expect(parseListQuery({ responsable: "mios" }).responsable).toBe("mios");
    expect(parseListQuery({ responsable: "sin_asignar" }).responsable).toBe("sin_asignar");
    expect(parseListQuery({ responsable: "7" }).responsable).toBe(7);
    for (const malo of ["otro", "7; DROP", "0", "-1", "1.5", "", {}, null, 0, 7.5]) {
      expect(parseListQuery({ responsable: malo }).responsable).toBe("todos");
    }
  });

  it("escapeLike neutraliza % _ y el carácter de escape", () => {
    expect(escapeLike("100%_ok!")).toBe("100!%!_ok!!");
  });
});

describe("buildFilters / listarCotizaciones: nada del usuario entra al texto SQL", () => {
  const hostile = parseListQuery({
    q: "'; DROP TABLE cotizaciones; -- 100%",
    servicio: "x' OR 1=1 --",
    estado: "nueva",
    desde: "2026-11-01",
    hasta: "2026-11-30",
    orden: "nombre",
    dir: "asc",
    page: "2",
  });

  it("usa solo marcadores: tantos «?» como parámetros", () => {
    const { where, params } = buildFilters(hostile, { includeEstado: true }, admin);
    expect(where.match(/\?/g)).toHaveLength(params.length);
    expect(where).not.toContain("DROP");
    expect(where).not.toContain("OR 1=1");
    expect(params).toContain("%'; DROP TABLE cotizaciones; -- 100!%%");
  });

  it("siempre ignora las eliminadas; «hasta» incluye todo ese día (hora de Colombia)", () => {
    const { where, params } = buildFilters(
      parseListQuery({ hasta: "2026-11-30" }),
      { includeEstado: true },
      admin,
    );
    expect(where).toContain("c.eliminado_en IS NULL");
    expect((params[0] as Date).toISOString()).toBe("2026-12-01T05:00:00.000Z");
  });

  it("los contadores no aplican el filtro de estado, pero sí el de responsable", () => {
    expect(buildFilters(hostile, { includeEstado: false }, admin).where).not.toContain(
      "c.estado = ?",
    );
    expect(buildFilters(hostile, { includeEstado: true }, admin).where).toContain("c.estado = ?");
    const mios = parseListQuery({ responsable: "mios" });
    const contadores = buildFilters(mios, { includeEstado: false }, comercial);
    expect(contadores.where).toContain("c.responsable_id = ?");
    expect(contadores.params).toContain(2); // el id de la sesión, nunca uno del navegador
    expect(
      buildFilters(parseListQuery({ responsable: "sin_asignar" }), { includeEstado: true }, admin)
        .where,
    ).toContain("c.responsable_id IS NULL");
    expect(
      buildFilters(parseListQuery({ responsable: "3" }), { includeEstado: true }, admin).params,
    ).toContain(3);
  });

  it("la consulta de la lista: ORDER BY de la lista permitida y paginación por parámetros", async () => {
    const result = await listarCotizaciones(hostile, admin);
    const list = executed.find((e) => e.sql.startsWith("SELECT c.id, c.creado_en"))!;
    expect(list.sql).toContain("ORDER BY c.nombre ASC, c.id DESC");
    expect(list.sql).toContain("LIMIT ? OFFSET ?");
    expect(list.sql).not.toContain("DROP");
    expect(list.params.slice(-2)).toEqual([String(PAGE_SIZE), String(PAGE_SIZE)]); // página 2 → offset 20
    for (const e of executed) expect(e.sql).not.toContain("DROP TABLE");
    expect(result.conteos).toEqual({
      nueva: 3,
      en_revision: 0,
      cotizada: 0,
      ganada: 0,
      perdida: 0,
    });
    expect(result.servicios).toEqual(["Conectividad"]);
  });

  it("un comercial no puede filtrar por el id de otro usuario", async () => {
    await listarCotizaciones(parseListQuery({ responsable: "3" }), comercial);
    expect(executed.some((e) => e.sql.startsWith("SELECT id FROM usuarios WHERE id = ?"))).toBe(
      false,
    );
    const list = executed.find((e) => e.sql.startsWith("SELECT c.id, c.creado_en"))!;
    const counts = executed.find((e) => e.sql.startsWith("SELECT c.estado, COUNT(*)"))!;
    expect(list.sql).not.toContain("c.responsable_id = ?");
    expect(counts.sql).not.toContain("c.responsable_id = ?");
  });

  it("un id de responsable inexistente se ignora en la lista y en los contadores", async () => {
    await listarCotizaciones(parseListQuery({ responsable: "999" }), admin);
    for (const sql of ["SELECT c.id, c.creado_en", "SELECT c.estado, COUNT(*)"]) {
      const query = executed.find((e) => e.sql.startsWith(sql))!;
      expect(query.sql).not.toContain("c.responsable_id = ?");
    }
  });

  it("la lista devuelve responsables activos solo a los administradores", async () => {
    const result = await listarCotizaciones(parseListQuery({}), admin);
    expect(result.responsables).toEqual([
      { id: 1, nombre: "Ada Admin" },
      { id: 2, nombre: "Carlos Comercial" },
      { id: 3, nombre: "Olga Otra" },
    ]);
    const delComercial = await listarCotizaciones(parseListQuery({}), comercial);
    expect(delComercial.responsables).toEqual([]);
  });
});

describe("obtenerDetalle: «ver» deduplicado por usuario y cotización", () => {
  it("registra «ver» la primera vez y con consulta preparada de 30 minutos", async () => {
    await obtenerDetalle(admin, 5, "1.1.1.1");
    const vista = executed.find((e) => e.sql.startsWith("SELECT id FROM auditoria WHERE accion"))!;
    expect(vista.sql).toContain("creado_en >= NOW() - INTERVAL 30 MINUTE");
    expect(vista.sql).toContain("usuario_id = ? AND cotizacion_id = ?");
    expect(vista.params).toEqual([1, 5]);
    expect(state.auditoria).toEqual([{ usuario_id: 1, accion: "ver", detalle: null }]);
  });

  it("no vuelve a registrar «ver» dentro de los 30 minutos", async () => {
    state.vistoUserId = 1;
    await obtenerDetalle(admin, 5, null);
    expect(executed.some((e) => e.sql.startsWith("INSERT INTO auditoria"))).toBe(false);
    expect(state.auditoria).toEqual([]);
  });

  it("otro usuario sí genera su propio «ver» aunque el primero esté en la ventana", async () => {
    state.vistoUserId = 1;
    await obtenerDetalle(comercial, 5, null);
    expect(state.auditoria).toEqual([{ usuario_id: 2, accion: "ver", detalle: null }]);
  });
});

describe("parseId y parseUpdateInput", () => {
  it("id: entero positivo", () => {
    expect(parseId("12")).toBe(12);
    expect(parseId(12)).toBe(12);
    for (const bad of [
      "0",
      "-1",
      "1.5",
      "abc",
      "1; DROP",
      "",
      null,
      undefined,
      {},
      "99999999999",
      0,
    ]) {
      expect(parseId(bad)).toBeNull();
    }
  });

  it("valida estado, responsable y largo de las notas", () => {
    const base = { actualizado_en: CARGADO.toISOString() };
    expect(
      parseUpdateInput({ ...base, estado: "ganada", responsable_id: null, notas: "ok" }),
    ).toMatchObject({ estado: "ganada", responsable_id: null, notas: "ok" });
    expect(parseUpdateInput({ ...base, estado: "inventado" })).toBeNull();
    expect(parseUpdateInput({ ...base, responsable_id: "3" })).toBeNull();
    expect(parseUpdateInput({ ...base, responsable_id: -1 })).toBeNull();
    expect(parseUpdateInput({ ...base, notas: "x".repeat(5001) })).toBeNull();
    expect(parseUpdateInput({ ...base, notas: "x".repeat(5000) })).not.toBeNull();
    expect(parseUpdateInput({ estado: "nueva" })).toBeNull(); // sin actualizado_en
    expect(parseUpdateInput({ actualizado_en: "no-es-fecha" })).toBeNull();
    expect(parseUpdateInput(null)).toBeNull();
  });
});

describe("permisos por rol (se verifican en el servidor)", () => {
  it("puedeAsignar", () => {
    // administrador: cualquiera, o nadie
    expect(puedeAsignar(admin, 3, null)).toBe(true);
    expect(puedeAsignar(admin, null, 3)).toBe(true);
    // comercial: solo «Tomar» (a sí mismo) y solo si está libre o ya es suya
    expect(puedeAsignar(comercial, 2, null)).toBe(true);
    expect(puedeAsignar(comercial, 2, 2)).toBe(true);
    expect(puedeAsignar(comercial, 3, null)).toBe(false); // asignar a otro
    expect(puedeAsignar(comercial, 2, 3)).toBe(false); // robársela a otro
    expect(puedeAsignar(comercial, null, 2)).toBe(false); // soltarla
  });

  it("un comercial no puede asignar a otra persona: 403 y nada se escribe", async () => {
    const result = (await actualizarCotizacion(
      comercial,
      5,
      input({ responsable_id: 3 }),
      "1.1.1.1",
    )) as { ok: boolean; error?: string };
    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(updates()).toHaveLength(0);
    expect(state.auditoria).toHaveLength(0);
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });

  it("un comercial no puede quitarle a otro una solicitud ya asignada", async () => {
    state.cotizacion!.responsable_id = 3;
    const result = await actualizarCotizacion(comercial, 5, input({ responsable_id: 2 }), null);
    expect(result).toEqual({ ok: false, error: "forbidden" });
    expect(updates()).toHaveLength(0);
  });

  it("un comercial puede «Tomar» una solicitud sin responsable", async () => {
    const result = await actualizarCotizacion(
      comercial,
      5,
      input({ responsable_id: 2 }),
      "1.1.1.1",
    );
    expect(result).toMatchObject({ ok: true, responsable_id: 2, responsable: "Carlos Comercial" });
    expect(state.auditoria).toEqual([
      { usuario_id: 2, accion: "asignar", detalle: "Responsable: Carlos Comercial" },
    ]);
  });

  it("un comercial sí puede cambiar el estado y las notas aunque no asigne", async () => {
    const result = await actualizarCotizacion(
      comercial,
      5,
      input({ estado: "en_revision", notas: "Llamar el lunes" }),
      null,
    );
    expect(result).toMatchObject({ ok: true, estado: "en_revision", notas: "Llamar el lunes" });
  });

  it("un administrador asigna a cualquier usuario ACTIVO y puede quitar al responsable", async () => {
    const asignada = await actualizarCotizacion(admin, 5, input({ responsable_id: 3 }), null);
    expect(asignada).toMatchObject({ ok: true, responsable_id: 3, responsable: "Olga Otra" });
    expect(state.auditoria.at(-1)).toEqual({
      usuario_id: 1,
      accion: "asignar",
      detalle: "Responsable: Olga Otra",
    });

    const actual = state.cotizacion!.actualizado_en.toISOString();
    const liberada = await actualizarCotizacion(
      admin,
      5,
      { actualizado_en: actual, responsable_id: null },
      null,
    );
    expect(liberada).toMatchObject({ ok: true, responsable_id: null });
    expect(state.auditoria.at(-1)?.detalle).toBe("Responsable: sin asignar");
  });

  it("no se puede asignar a un usuario inactivo o inexistente", async () => {
    expect(await actualizarCotizacion(admin, 5, input({ responsable_id: 4 }), null)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await actualizarCotizacion(admin, 5, input({ responsable_id: 999 }), null)).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(updates()).toHaveLength(0);
  });
});

describe("control de concurrencia", () => {
  it("si en la base cambió, NO sobrescribe y responde conflicto", async () => {
    state.cotizacion!.actualizado_en = new Date(CARGADO.getTime() + 5000); // otra persona guardó
    const result = await actualizarCotizacion(
      admin,
      5,
      input({ estado: "perdida", notas: "pisar" }),
      null,
    );
    expect(result).toEqual({ ok: false, error: "conflict" });
    expect(updates()).toHaveLength(0);
    expect(state.auditoria).toHaveLength(0);
    expect(state.cotizacion!.estado).toBe("nueva");
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });

  it("con el actualizado_en correcto guarda, y el nuevo valor sirve para el siguiente guardado", async () => {
    const primero = await actualizarCotizacion(admin, 5, input({ estado: "en_revision" }), null);
    expect(primero.ok).toBe(true);
    if (!primero.ok) return;
    expect(primero.actualizado_en).not.toBe(CARGADO.toISOString());
    // El mismo token viejo ya no vale (otra pestaña con datos antiguos).
    expect(await actualizarCotizacion(admin, 5, input({ estado: "ganada" }), null)).toEqual({
      ok: false,
      error: "conflict",
    });
    // El token nuevo sí.
    const segundo = await actualizarCotizacion(
      admin,
      5,
      { actualizado_en: primero.actualizado_en, estado: "ganada" },
      null,
    );
    expect(segundo).toMatchObject({ ok: true, estado: "ganada" });
  });

  it("dos guardados dentro del MISMO segundo: el de datos viejos sigue dando conflicto", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(CARGADO.getTime() + 500)); // mismo segundo que el actualizado_en cargado
    try {
      const primero = await actualizarCotizacion(admin, 5, input({ estado: "en_revision" }), null);
      expect(primero.ok).toBe(true);
      if (!primero.ok) return;
      // El valor avanzó al menos 1 s, aunque la hora real no cambió de segundo.
      expect(new Date(primero.actualizado_en).getTime()).toBeGreaterThanOrEqual(
        CARGADO.getTime() + 1000,
      );
      expect(await actualizarCotizacion(admin, 5, input({ estado: "perdida" }), null)).toEqual({
        ok: false,
        error: "conflict",
      });
      expect(state.cotizacion!.estado).toBe("en_revision");
    } finally {
      vi.useRealTimers();
    }
  });

  it("solicitud inexistente o eliminada → not_found", async () => {
    state.cotizacion = null;
    expect(await actualizarCotizacion(admin, 5, input({ estado: "ganada" }), null)).toEqual({
      ok: false,
      error: "not_found",
    });
  });
});

describe("auditoría del cambio", () => {
  it("estado: «estado: X -> Y»; las notas no copian su texto; sin cambios no escribe", async () => {
    const result = await actualizarCotizacion(
      admin,
      5,
      input({ estado: "cotizada", notas: "Cliente VIP: 3105551234, pidió 10% de descuento" }),
      "9.9.9.9",
    );
    expect(result.ok).toBe(true);
    expect(state.auditoria).toEqual([
      { usuario_id: 1, accion: "cambiar_estado", detalle: "estado: nueva -> cotizada" },
      { usuario_id: 1, accion: "editar", detalle: "Notas internas actualizadas" },
    ]);
    expect(JSON.stringify(state.auditoria)).not.toContain("3105551234");
    expect(calls).toEqual(["begin", "commit", "release"]);

    executed.length = 0;
    state.auditoria.length = 0;
    const actual = state.cotizacion!.actualizado_en.toISOString();
    const igual = await actualizarCotizacion(
      admin,
      5,
      { actualizado_en: actual, estado: "cotizada" },
      null,
    );
    expect(igual.ok).toBe(true);
    expect(updates()).toHaveLength(0);
    expect(state.auditoria).toHaveLength(0);
  });

  it("la consulta de actualización solo nombra columnas fijas del código", async () => {
    await actualizarCotizacion(
      admin,
      5,
      input({ estado: "ganada", notas: "x'; DROP TABLE cotizaciones; --" }),
      null,
    );
    const update = updates()[0]!;
    expect(update.sql).toBe(
      "UPDATE cotizaciones SET estado = ?, notas = ?, actualizado_en = ? WHERE id = ?",
    );
    expect(update.params).toEqual([
      "ganada",
      "x'; DROP TABLE cotizaciones; --",
      expect.any(Date),
      5,
    ]);
  });
});

describe("crearCotizacionManual", () => {
  const datos = {
    nombre: "Cliente Manual",
    empresa: "ACME",
    cargo: "",
    correo: "c@example.invalid",
    telefono: "3001112233",
    servicio: "Nube",
    mensaje: "Llamó por teléfono",
    consentimiento: true,
  };

  it("sin la autorización del cliente no se crea", async () => {
    expect(await crearCotizacionManual(admin, { ...datos, consentimiento: false })).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(await crearCotizacionManual(admin, { ...datos, consentimiento: undefined })).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(state.insertCotizacion).not.toHaveBeenCalled();
  });

  it("aplica las mismas validaciones que el formulario público", async () => {
    for (const malo of [
      { ...datos, nombre: " " },
      { ...datos, correo: "no-es-correo" },
      { ...datos, telefono: "" },
      { ...datos, mensaje: "x".repeat(2001) },
      null,
      "texto",
    ]) {
      expect(await crearCotizacionManual(admin, malo)).toEqual({ ok: false, error: "invalid" });
    }
    expect(state.insertCotizacion).not.toHaveBeenCalled();
  });

  it("crea con origen «manual» a nombre del usuario", async () => {
    expect(await crearCotizacionManual(comercial, datos)).toEqual({ ok: true, id: 77 });
    const [guardado, opciones] = state.insertCotizacion.mock.calls[0] as [Row, Row];
    expect(guardado).toMatchObject({ nombre: "Cliente Manual", idioma: "es" });
    expect(opciones).toMatchObject({ origen: "manual", usuarioId: 2 });
  });
});
