import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_EXPORTAR,
  PAGE_SIZE_HISTORIAL,
  celdaCsv,
  describirFiltrosCsv,
  fechaArchivoCsv,
  formatFechaCsv,
  parseHistorialQuery,
  parseListQuery,
  parsePapeleraInput,
  parsePapeleraQuery,
  solicitudEliminada,
} from "./cotizaciones-admin-shared";

/** Fila simulada: todos los campos de cotizaciones y auditoría que usa la capa real. */
type Row = {
  id?: number | undefined;
  creado_en?: Date | undefined;
  actualizado_en?: Date | undefined;
  eliminado_en?: Date | null | undefined;
  eliminado_por?: number | string | null | undefined;
  nombre?: string | undefined;
  empresa?: string | undefined;
  cargo?: string | undefined;
  correo?: string | undefined;
  telefono?: string | undefined;
  servicio?: string | undefined;
  mensaje?: string | undefined;
  consentimiento?: number | undefined;
  consentimiento_fecha?: Date | undefined;
  origen?: string | undefined;
  idioma?: string | undefined;
  estado?: string | undefined;
  responsable_id?: number | null | undefined;
  notas?: string | null | undefined;
  usuario_id?: number | null | undefined;
  accion?: string | undefined;
  cotizacion_id?: number | null | undefined;
  detalle?: string | null | undefined;
  ip?: string | null | undefined;
  usuario?: string | undefined;
  n?: number | undefined;
};
const executed: { sql: string; params: unknown[] }[] = [];
const calls: string[] = [];

const state = vi.hoisted(() => ({
  cotizaciones: new Map<number, Row>(),
  auditoria: [] as Row[],
  usuarios: new Map<number, { nombre: string; activo: number }>(),
  forzarTotal: null as number | null,
  proximoAudit: 100,
}));

function run(rawSql: string, params: unknown[] = []): [Row[]] {
  const sql = rawSql.replace(/\s+/g, " ").trim();
  executed.push({ sql, params });

  if (
    sql.startsWith("SELECT eliminado_en, actualizado_en FROM cotizaciones WHERE id = ? FOR UPDATE")
  ) {
    const c = state.cotizaciones.get(params[0] as number);
    return [c ? [{ eliminado_en: c.eliminado_en, actualizado_en: c.actualizado_en }] : []];
  }
  if (
    sql.startsWith(
      "SELECT actualizado_en FROM cotizaciones WHERE id = ? AND eliminado_en IS NOT NULL FOR UPDATE",
    )
  ) {
    const c = state.cotizaciones.get(params[0] as number);
    return [c && c.eliminado_en !== null ? [{ actualizado_en: c.actualizado_en }] : []];
  }
  if (sql.startsWith("UPDATE cotizaciones SET eliminado_en = NOW()")) {
    const c = state.cotizaciones.get(params[2] as number)!;
    c.eliminado_en = new Date("2026-11-19T15:00:00Z");
    c.eliminado_por = params[0] as number;
    c.actualizado_en = params[1] as Date;
    return [[]];
  }
  if (sql.startsWith("UPDATE cotizaciones SET eliminado_en = NULL")) {
    const c = state.cotizaciones.get(params[1] as number)!;
    c.eliminado_en = null;
    c.eliminado_por = null;
    c.actualizado_en = params[0] as Date;
    return [[]];
  }
  if (sql.startsWith("INSERT INTO auditoria")) {
    state.auditoria.push({
      id: state.proximoAudit++,
      usuario_id: params[0] as number | null,
      accion: params[1] as string,
      cotizacion_id: params[2] as number | null,
      detalle: params[3] as string | null,
      ip: params[4] as string | null,
      creado_en: new Date("2026-11-19T15:00:00Z"),
    });
    return [[]];
  }
  if (sql.startsWith("DELETE FROM cotizaciones WHERE id = ?")) {
    const id = params[0] as number;
    state.cotizaciones.delete(id);
    // La FK ON DELETE SET NULL deja los cotizacion_id de la auditoría a NULL.
    for (const a of state.auditoria) if (a.cotizacion_id === id) a.cotizacion_id = null;
    return [[]];
  }
  if (sql.startsWith("SELECT c.id, c.creado_en, c.nombre, c.empresa, c.servicio, c.eliminado_en")) {
    const filas = [...state.cotizaciones.values()].filter((c) => c.eliminado_en !== null);
    return [
      filas.map((c) => ({
        ...c,
        eliminado_por: state.usuarios.get(Number(c.eliminado_por))?.nombre ?? null,
      })),
    ];
  }
  if (
    sql.startsWith("SELECT COUNT(*) AS n FROM cotizaciones c WHERE") &&
    sql.includes("eliminado_en IS NOT NULL")
  ) {
    return [
      [{ n: [...state.cotizaciones.values()].filter((c) => c.eliminado_en !== null).length }],
    ];
  }
  if (sql.startsWith("SELECT COUNT(*) AS n FROM cotizaciones c WHERE")) {
    const n =
      state.forzarTotal ??
      [...state.cotizaciones.values()].filter((c) => c.eliminado_en === null).length;
    return [[{ n }]];
  }
  if (sql.startsWith("SELECT c.id, c.creado_en, c.nombre, c.empresa, c.cargo, c.correo")) {
    return [[...state.cotizaciones.values()].filter((c) => c.eliminado_en === null)];
  }
  if (sql.startsWith("SELECT a.id, a.creado_en, a.accion, a.cotizacion_id, a.detalle, a.ip")) {
    return [
      state.auditoria.map((a) => ({
        ...a,
        usuario: state.usuarios.get(a.usuario_id ?? -1)?.nombre ?? "Sistema / formulario web",
      })),
    ];
  }
  if (sql.startsWith("SELECT COUNT(*) AS n FROM auditoria a"))
    return [[{ n: state.auditoria.length }]];
  if (sql.startsWith("SELECT id FROM usuarios WHERE id = ? LIMIT 1")) {
    return [state.usuarios.has(params[0] as number) ? [{ id: params[0] as number }] : []];
  }
  throw new Error("Consulta no prevista en la prueba: " + sql);
}

const connection = {
  beginTransaction: vi.fn(async () => void calls.push("begin")),
  commit: vi.fn(async () => void calls.push("commit")),
  rollback: vi.fn(async () => void calls.push("rollback")),
  release: vi.fn(() => void calls.push("release")),
  execute: async (sql: string, params: unknown[] = []) => run(sql, params),
};

vi.mock("./db.server", () => ({
  getPool: () => ({ execute: connection.execute, getConnection: async () => connection }),
}));

const {
  eliminarDefinitivamente,
  exportarCotizaciones,
  listarAuditoria,
  listarPapelera,
  moverAPapelera,
  restaurarCotizacion,
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
const CARGADO = new Date("2026-11-18T15:00:00Z");

function nuevaFila(id: number): Row {
  return {
    id,
    creado_en: CARGADO,
    actualizado_en: CARGADO,
    eliminado_en: null,
    eliminado_por: null,
    nombre: "José Áñez",
    empresa: "Empresa Ejemplo",
    cargo: "Gerente",
    correo: "jose@example.invalid",
    telefono: "3001112233",
    servicio: "Nube",
    mensaje: "Mensaje de prueba",
    consentimiento: 1,
    consentimiento_fecha: CARGADO,
    origen: "formulario_web",
    idioma: "es",
    estado: "nueva",
    responsable_id: null,
    notas: null,
  };
}

beforeEach(() => {
  executed.length = 0;
  calls.length = 0;
  state.cotizaciones = new Map([[5, nuevaFila(5)]]);
  state.auditoria = [];
  state.forzarTotal = null;
  state.proximoAudit = 100;
  state.usuarios = new Map([
    [1, { nombre: "Ada Admin", activo: 1 }],
    [2, { nombre: "Carlos Comercial", activo: 1 }],
  ]);
});

const token = () => state.cotizaciones.get(5)!.actualizado_en!.toISOString();
const papelera = (extra: Record<string, unknown> = {}) => ({
  actualizado_en: token(),
  ...extra,
});

describe("validadores de la fase 6", () => {
  it("parseHistorialQuery: solo acciones permitidas, fechas ISO y páginas válidas", () => {
    expect(parseHistorialQuery({})).toEqual({
      usuario: "todos",
      accion: "todas",
      desde: undefined,
      hasta: undefined,
      solicitud: undefined,
      page: 1,
    });
    expect(parseHistorialQuery({ accion: "eliminar", usuario: "2", solicitud: "5" })).toMatchObject(
      {
        accion: "eliminar",
        usuario: 2,
        solicitud: 5,
      },
    );
    for (const malo of ["DROP TABLE", "ver; --", 1, null]) {
      expect(parseHistorialQuery({ accion: malo }).accion).toBe("todas");
    }
    expect(parseHistorialQuery({ desde: "19/11/2026" }).desde).toBeUndefined();
    expect(parseHistorialQuery({ page: "999999999" }).page).toBe(100_000);
  });

  it("parsePapeleraQuery y parsePapeleraInput acotan búsqueda, token y confirmación", () => {
    expect(parsePapeleraQuery({ q: "  ana  ", page: "3" })).toEqual({ q: "ana", page: 3 });
    expect(parsePapeleraQuery({ q: "x".repeat(500) }).q).toHaveLength(100);
    expect(parsePapeleraQuery({ page: "0" }).page).toBe(1);
    expect(parsePapeleraInput({ actualizado_en: CARGADO.toISOString() })).toEqual({
      actualizado_en: CARGADO.toISOString(),
    });
    expect(
      parsePapeleraInput({ actualizado_en: CARGADO.toISOString(), confirmacion: "5" }),
    ).toMatchObject({ confirmacion: 5 });
    expect(parsePapeleraInput({ actualizado_en: "no-fecha" })).toBeNull();
    expect(
      parsePapeleraInput({ actualizado_en: CARGADO.toISOString(), confirmacion: 0 }),
    ).toBeNull();
    expect(parsePapeleraInput(null)).toBeNull();
  });

  it("solicitudEliminada lee el número del detalle cuando la FK quedó a NULL", () => {
    expect(solicitudEliminada("eliminación definitiva de la solicitud #42")).toBe(42);
    expect(solicitudEliminada("enviada a la papelera")).toBeNull();
    expect(solicitudEliminada(null)).toBeNull();
  });

  it("el resumen de filtros de la auditoría no copia datos personales", () => {
    const filtros = parseListQuery({ q: "juan.perez@example.com", estado: "nueva" });
    const resumen = describirFiltrosCsv(filtros);
    expect(resumen).toContain("búsqueda aplicada");
    expect(resumen).toContain("estado: nueva");
    expect(resumen).not.toContain("juan.perez");
    expect(describirFiltrosCsv(parseListQuery({}))).toBe("sin filtros");
  });
});

describe("papelera: concurrencia, auditoría y permisos", () => {
  it("eliminar lleva la fila a la papelera con auditoría y avanza el token", async () => {
    const antes = token();
    const result = await moverAPapelera(admin, 5, papelera(), "203.0.113.1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.actualizado_en).not.toBe(antes);
    expect(state.cotizaciones.get(5)!.eliminado_en).not.toBeNull();
    expect(state.cotizaciones.get(5)!.eliminado_por).toBe(1);
    expect(state.auditoria).toEqual([
      expect.objectContaining({
        usuario_id: 1,
        accion: "eliminar",
        cotizacion_id: 5,
        detalle: "enviada a la papelera",
        ip: "203.0.113.1",
      }),
    ]);
    expect(calls).toEqual(["begin", "commit", "release"]);
  });

  it("conflicto real: token desactualizado no toca la fila ni audita", async () => {
    const result = await moverAPapelera(
      admin,
      5,
      papelera({ actualizado_en: new Date(CARGADO.getTime() - 5000).toISOString() }),
      null,
    );
    expect(result).toEqual({ ok: false, error: "conflict" });
    expect(state.cotizaciones.get(5)!.eliminado_en).toBeNull();
    expect(state.auditoria).toHaveLength(0);
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });

  it("restaurar limpia la papelera y audita; el token nuevo vuelve a valer", async () => {
    await moverAPapelera(admin, 5, papelera(), null);
    const result = await restaurarCotizacion(admin, 5, papelera(), null);
    expect(result.ok).toBe(true);
    expect(state.cotizaciones.get(5)!.eliminado_en).toBeNull();
    expect(state.cotizaciones.get(5)!.eliminado_por).toBeNull();
    expect(state.auditoria.map((a) => a.accion)).toEqual(["eliminar", "restaurar"]);
    expect(state.auditoria.at(-1)!.detalle).toBe("restaurada desde la papelera");
  });

  it("definitivo exige escribir el número correcto y borra en transición con auditoría previa", async () => {
    await moverAPapelera(admin, 5, papelera(), null);
    expect(await eliminarDefinitivamente(admin, 5, papelera({ confirmacion: 6 }), null)).toEqual({
      ok: false,
      error: "invalid",
    });

    const result = await eliminarDefinitivamente(admin, 5, papelera({ confirmacion: 5 }), null);
    expect(result).toEqual({ ok: true });
    expect(state.cotizaciones.has(5)).toBe(false);
    const definitiva = state.auditoria.find((a) => a.detalle?.includes("eliminación definitiva"));
    expect(definitiva).toMatchObject({
      accion: "eliminar",
      detalle: "eliminación definitiva de la solicitud #5",
      cotizacion_id: null, // la FK la dejó a NULL, pero el detalle conserva el número
    });
    expect(calls).toEqual([
      "begin",
      "commit",
      "release", // mover a papelera
      "begin",
      "commit",
      "release", // borrado definitivo
    ]);
  });

  it("un comercial recibe forbidden en las tres operaciones y no escribe nada", async () => {
    expect(await moverAPapelera(comercial, 5, papelera(), null)).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(await restaurarCotizacion(comercial, 5, papelera(), null)).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(
      await eliminarDefinitivamente(comercial, 5, papelera({ confirmacion: 5 }), null),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(executed).toHaveLength(0);
    expect(state.auditoria).toHaveLength(0);
  });

  it("la papelera lista paginada y solo devuelve eliminadas al administrador", async () => {
    await moverAPapelera(admin, 5, papelera(), null);
    const resultado = await listarPapelera(parsePapeleraQuery({ q: "José", page: 1 }), admin);
    expect(resultado.filas).toHaveLength(1);
    expect(resultado.filas[0]).toMatchObject({
      id: 5,
      nombre: "José Áñez",
      eliminado_por: "Ada Admin",
    });
    const sql = executed.find((e) => e.sql.startsWith("SELECT c.id, c.creado_en"))!;
    expect(sql.sql).toContain("LIMIT ? OFFSET ?");
    expect(sql.params.slice(-2)).toEqual([String(20), String(0)]);
    expect(await listarPapelera(parsePapeleraQuery({}), comercial)).toEqual({
      filas: [],
      total: 0,
    });
  });
});

describe("exportación CSV", () => {
  it("neutraliza fórmulas, escapa comillas/saltos, lleva BOM y fechas en español", async () => {
    const fila = state.cotizaciones.get(5)!;
    fila.empresa = "=SUM(A1:A2)";
    fila.correo = "@telcobras.com";
    fila.notas = "-cmd|/c calc";
    fila.nombre = 'José Áñez "El Tío"';
    fila.mensaje = 'Línea 1\nLínea 2 "con comillas"';

    const resultado = await exportarCotizaciones(parseListQuery({}), admin, null);
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.csv.startsWith("\uFEFF")).toBe(true);
    expect(resultado.nombreArchivo).toBe(`cotizaciones_telcobras_${fechaArchivoCsv()}.csv`);
    expect(resultado.csv).toContain(
      '"Número";"Fecha";"Nombre";"Empresa";"Cargo";"Correo";"Teléfono";"Servicio";"Mensaje";"Estado";"Responsable";"Origen";"Idioma";"Autorización de datos";"Notas internas"',
    );
    expect(resultado.csv).toContain('"18/11/2026 10:00"');
    expect(resultado.csv).toContain('"José Áñez ""El Tío"""');
    expect(resultado.csv).toContain('"\'=SUM(A1:A2)"');
    expect(resultado.csv).toContain('"\'@telcobras.com"');
    expect(resultado.csv).toContain('"\'-cmd|/c calc"');
    expect(resultado.csv).toContain('Línea 1\nLínea 2 ""con comillas""');
    expect(resultado.csv).toContain('"Sí (18/11/2026 10:00)"');
    expect(resultado.csv).toContain('"Nueva"');
    expect(resultado.csv).toContain('"Formulario web"');
    expect(state.auditoria).toEqual([
      expect.objectContaining({
        accion: "exportar",
        cotizacion_id: null,
        detalle: "1 filas; filtros: sin filtros",
      }),
    ]);
  });

  it("celdaCsv antepone comilla a +, tabulador y retorno de carro, y dobla comillas", () => {
    expect(celdaCsv("+suma")).toBe('"\'+suma"');
    expect(celdaCsv("\tcolumna")).toBe('"\'\tcolumna"');
    expect(celdaCsv("\rfilas")).toBe('"\'\nfilas"');
    expect(celdaCsv('a"b')).toBe('"a""b"');
    expect(celdaCsv(null)).toBe('""');
  });

  it("aplica los mismos filtros validados y nunca exporta eliminadas", async () => {
    const otra = nuevaFila(6);
    otra.empresa = "Otra";
    state.cotizaciones.set(6, otra);
    await moverAPapelera(admin, 6, papelera(), null); // 6 va a la papelera

    const filtros = parseListQuery({ estado: "nueva", q: "jose", desde: "2026-11-01" });
    const resultado = await exportarCotizaciones(filtros, admin, "203.0.113.9");
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    const select = executed.find((e) =>
      e.sql.startsWith("SELECT c.id, c.creado_en, c.nombre, c.empresa, c.cargo"),
    )!;
    expect(select.sql).toContain("c.eliminado_en IS NULL");
    expect(select.sql).toContain("c.estado = ?");
    expect(select.sql).toContain("LIMIT ?");
    expect(select.params).toContain("nueva");
    expect(resultado.csv.match(/^\uFEFF"Número"/)).not.toBeNull();
    expect(resultado.csv).not.toContain('"Otra"');
    expect(state.auditoria.at(-1)?.detalle).toContain(
      "filtros: búsqueda aplicada; estado: nueva; desde: 2026-11-01",
    );
    expect(JSON.stringify(state.auditoria)).not.toContain("jose");
    expect(state.auditoria.at(-1)?.ip).toBe("203.0.113.9");
  });

  it("si se supera el tope avisa y NO audita ni entrega CSV", async () => {
    state.forzarTotal = MAX_EXPORTAR + 1;
    const resultado = await exportarCotizaciones(parseListQuery({}), admin, null);
    expect(resultado).toEqual({ ok: false, error: "too_many", total: MAX_EXPORTAR + 1 });
    expect(state.auditoria).toHaveLength(0);
  });

  it("un comercial no puede exportar", async () => {
    expect(await exportarCotizaciones(parseListQuery({}), comercial, null)).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(executed).toHaveLength(0);
  });
});

describe("historial completo", () => {
  it("muestra la solicitud eliminada desde el detalle de la auditoría, sin enlace", async () => {
    // La cotización 6 sigue viva: sus registros sí deben llevar enlace a #6.
    state.cotizaciones.set(6, nuevaFila(6));
    state.auditoria.push({
      id: 99,
      usuario_id: 1,
      accion: "ver",
      cotizacion_id: 6,
      detalle: null,
      ip: null,
      creado_en: CARGADO,
    });
    await moverAPapelera(admin, 5, papelera(), null);
    await eliminarDefinitivamente(admin, 5, papelera({ confirmacion: 5 }), null);
    executed.length = 0;
    const resultado = await listarAuditoria(parseHistorialQuery({}), admin);
    expect(resultado.total).toBe(3);
    const fila = resultado.filas.find((f) => f.solicitud.includes("eliminada"))!;
    expect(fila.solicitud).toBe("eliminada #5");
    expect(fila.con_enlace).toBe(false);
    expect(fila.cotizacion_id).toBeNull();
    const conEnlace = resultado.filas.find((f) => f.con_enlace)!;
    expect(conEnlace.solicitud).toBe("#6");
    // Ver el historial NO genera auditoría.
    expect(executed.some((e) => e.sql.startsWith("INSERT INTO auditoria"))).toBe(false);
    expect(state.auditoria).toHaveLength(3);
  });

  it("aplica filtros de usuario, acción, fechas y número con marcadores", async () => {
    await moverAPapelera(admin, 5, papelera(), null);
    await eliminarDefinitivamente(admin, 5, papelera({ confirmacion: 5 }), null);
    executed.length = 0;
    const q = parseHistorialQuery({
      usuario: "1",
      accion: "eliminar",
      desde: "2026-11-01",
      hasta: "2026-11-30",
      solicitud: "5",
    });
    const resultado = await listarAuditoria(q, admin);
    const select = executed.find((e) => e.sql.startsWith("SELECT a.id, a.creado_en"))!;
    expect(select.sql).toContain("a.usuario_id = ?");
    expect(select.sql).toContain("a.accion = ?");
    expect(select.sql).toContain("a.creado_en >= ?");
    expect(select.sql).toContain("a.creado_en < ?");
    expect(select.sql).toContain("a.cotizacion_id = ? OR a.detalle LIKE ?");
    expect(select.params).toContain(1);
    expect(select.params).toContain("eliminar");
    expect(select.params).toContain(5);
    expect(select.params).toContain("%eliminación definitiva de la solicitud #5%");
    expect(select.params.slice(-2)).toEqual([String(PAGE_SIZE_HISTORIAL), String(0)]);
    expect(resultado.total).toBe(2);
  });

  it("usuario del sistema y paginación; un comercial no ve nada", async () => {
    state.auditoria.push({
      id: 1,
      usuario_id: null,
      accion: "crear",
      cotizacion_id: 5,
      detalle: "Solicitud creada desde el formulario web",
      ip: null,
      creado_en: CARGADO,
    });
    const resultado = await listarAuditoria(parseHistorialQuery({}), admin);
    expect(resultado.filas[0]!.usuario).toBe("Sistema / formulario web");
    expect(await listarAuditoria(parseHistorialQuery({}), comercial)).toEqual({
      filas: [],
      total: 0,
    });
  });
});
