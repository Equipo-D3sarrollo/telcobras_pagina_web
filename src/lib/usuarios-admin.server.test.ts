import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = Record<string, unknown>;
type Usuario = {
  nombre: string;
  correo: string;
  rol: "administrador" | "comercial";
  activo: number;
  password_hash: string;
  debe_cambiar_password: number;
};

const executed: { sql: string; params: unknown[] }[] = [];
const calls: string[] = [];
let snapshot: { usuarios: Map<number, Usuario>; sesiones: Set<number>; auditoria: Row[] } | null =
  null;

// Base simulada: captura transacciones y aplica rollback real sobre su propio estado.
const state = vi.hoisted(() => ({
  usuarios: new Map<number, Usuario>(),
  sesiones: new Set<number>(),
  auditoria: [] as Row[],
  falloEn: null as null | "auditoria" | "password",
  nextId: 10,
  hashPassword: vi.fn(async (password: string) => {
    if (state.falloEn === "password")
      throw Object.assign(new Error(`no se pudo hashear ${password}`), { code: "ER_HASH" });
    return `hash:${password}`;
  }),
  verifyPassword: vi.fn(async (_password: string, _hash: string) => true),
}));

function copiarEstado() {
  snapshot = {
    usuarios: new Map([...state.usuarios.entries()].map(([id, u]) => [id, { ...u }])),
    sesiones: new Set(state.sesiones),
    auditoria: state.auditoria.map((fila) => ({ ...fila })),
  };
}

function restaurarEstado() {
  if (!snapshot) return;
  state.usuarios = snapshot.usuarios;
  state.sesiones = snapshot.sesiones;
  state.auditoria = snapshot.auditoria;
  snapshot = null;
}

function actualizar(id: number, cambios: Partial<Usuario>) {
  const usuario = state.usuarios.get(id);
  if (!usuario) return 0;
  Object.assign(usuario, cambios);
  return 1;
}

function run(rawSql: string, params: unknown[]): [Row[]] | [Row] {
  const sql = rawSql.replace(/\s+/g, " ").trim();
  executed.push({ sql, params });

  if (sql.startsWith("SELECT id FROM usuarios WHERE rol = 'administrador' AND activo = 1")) {
    return [
      [...state.usuarios.entries()]
        .filter(([, u]) => u.rol === "administrador" && u.activo === 1)
        .map(([id]) => ({ id })),
    ];
  }
  if (sql.startsWith("SELECT id, nombre, correo, rol, activo")) {
    return [
      [...state.usuarios.entries()].map(([id, u]) => ({
        id,
        nombre: u.nombre,
        correo: u.correo,
        rol: u.rol,
        activo: u.activo,
        debe_cambiar_password: u.debe_cambiar_password,
        bloqueado_hasta: null,
        ultimo_acceso: null,
      })),
    ];
  }
  if (sql.startsWith("INSERT INTO usuarios")) {
    const id = state.nextId++;
    state.usuarios.set(id, {
      nombre: params[0] as string,
      correo: params[1] as string,
      rol: params[3] as Usuario["rol"],
      activo: 1,
      password_hash: params[2] as string,
      debe_cambiar_password: 1,
    });
    return [{ affectedRows: 1, insertId: id }];
  }
  if (sql.startsWith("UPDATE usuarios SET nombre = ?, correo = ?, rol = ?")) {
    return [
      {
        affectedRows: actualizar(params[3] as number, {
          nombre: params[0] as string,
          correo: params[1] as string,
          rol: params[2] as Usuario["rol"],
        }),
      },
    ];
  }
  if (sql.startsWith("UPDATE usuarios SET activo = ?")) {
    return [{ affectedRows: actualizar(params[1] as number, { activo: params[0] as number }) }];
  }
  if (sql.startsWith("UPDATE usuarios SET intentos_fallidos = 0")) {
    return [{ affectedRows: actualizar(params[1] as number, { activo: 1 }) }];
  }
  if (sql.startsWith("UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 1")) {
    return [
      {
        affectedRows: actualizar(params[1] as number, {
          password_hash: params[0] as string,
          debe_cambiar_password: 1,
        }),
      },
    ];
  }
  if (sql.startsWith("SELECT password_hash FROM usuarios WHERE id = ?")) {
    const usuario = state.usuarios.get(params[0] as number);
    return [usuario ? [{ password_hash: usuario.password_hash }] : []];
  }
  if (sql.startsWith("UPDATE usuarios SET password_hash = ?, debe_cambiar_password = 0")) {
    return [
      {
        affectedRows: actualizar(params[1] as number, {
          password_hash: params[0] as string,
          debe_cambiar_password: 0,
        }),
      },
    ];
  }
  if (sql.startsWith("DELETE FROM sesiones WHERE usuario_id = ?")) {
    state.sesiones.delete(params[0] as number);
    return [{ affectedRows: 1 }];
  }
  if (sql.startsWith("INSERT INTO auditoria")) {
    if (state.falloEn === "auditoria")
      throw Object.assign(new Error("fallo de base al auditar"), { code: "ER_LOCK_DEADLOCK" });
    state.auditoria.push({
      usuario_id: params[0] as number,
      accion: params[1] as string,
      detalle: params[2] as string,
    });
    return [{ affectedRows: 1 }];
  }
  throw new Error("Consulta no prevista en la prueba: " + sql);
}

const connection = {
  beginTransaction: vi.fn(async () => {
    calls.push("begin");
    copiarEstado();
  }),
  commit: vi.fn(async () => {
    calls.push("commit");
    snapshot = null;
  }),
  rollback: vi.fn(async () => {
    calls.push("rollback");
    restaurarEstado();
  }),
  release: vi.fn(() => void calls.push("release")),
  execute: async (sql: string, params: unknown[] = []) => run(sql, params),
};

vi.mock("./db.server", () => ({
  getPool: () => ({
    execute: (sql: string, params: unknown[] = []) => run(sql, params),
    getConnection: async () => connection,
  }),
}));
vi.mock("./password.server", () => ({
  hashPassword: (password: string) => state.hashPassword(password),
  verifyPassword: (password: string, hash: string) => state.verifyPassword(password, hash),
}));

const {
  cambiarEstadoUsuario,
  cambiarPasswordPropio,
  crearUsuario,
  desbloquearUsuario,
  editarUsuario,
  reiniciarPassword,
} = await import("./usuarios-admin.server");

const admin = {
  id: 1,
  nombre: "Ada Admin",
  correo: "ada@example.invalid",
  rol: "administrador" as const,
  debe_cambiar_password: 0,
};
const admin2 = { ...admin, id: 2, nombre: "Bruno Admin" };
const comercial = { ...admin, id: 3, nombre: "Carlos Comercial", rol: "comercial" as const };
const MENSAJE = "Debe quedar al menos un administrador activo";
const edicion = { nombre: "Nombre", correo: "nombre@example.invalid", rol: "comercial" as const };

beforeEach(() => {
  executed.length = 0;
  calls.length = 0;
  snapshot = null;
  state.falloEn = null;
  state.nextId = 10;
  state.hashPassword.mockClear();
  state.verifyPassword.mockClear();
  state.usuarios = new Map<number, Usuario>([
    [
      1,
      {
        nombre: "Ada Admin",
        correo: "ada@example.invalid",
        rol: "administrador",
        activo: 1,
        password_hash: "hash:clave-original",
        debe_cambiar_password: 0,
      },
    ],
    [
      2,
      {
        nombre: "Bruno Admin",
        correo: "bruno@example.invalid",
        rol: "administrador",
        activo: 1,
        password_hash: "hash:clave-original",
        debe_cambiar_password: 0,
      },
    ],
    [
      3,
      {
        nombre: "Carlos Comercial",
        correo: "carlos@example.invalid",
        rol: "comercial",
        activo: 1,
        password_hash: "hash:clave-original",
        debe_cambiar_password: 0,
      },
    ],
  ]);
  state.sesiones = new Set([1, 2, 3]);
  state.auditoria = [];
});

describe("desactivar y reiniciar: sesiones borradas en la misma transacción", () => {
  it("desactivar elimina las sesiones del usuario y audita dentro de la transacción", async () => {
    expect(await cambiarEstadoUsuario(admin, 3, false, "1.1.1.1")).toEqual({ ok: true });
    expect(state.usuarios.get(3)!.activo).toBe(0);
    expect(state.sesiones.has(3)).toBe(false);
    expect(state.sesiones.has(1)).toBe(true);
    expect(state.auditoria).toEqual([
      { usuario_id: 1, accion: "desactivar", detalle: "Cuenta desactivada" },
    ]);
    expect(calls).toEqual(["begin", "commit", "release"]);
  });

  it("reiniciar elimina sesiones, devuelve la temporal una sola vez y no la guarda en claro", async () => {
    const resultado = await reiniciarPassword(admin, 3, "1.1.1.1");
    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.passwordTemporal).toMatch(/\S{20,}/);
    expect(state.usuarios.get(3)!.password_hash).toBe(`hash:${resultado.passwordTemporal}`);
    expect(state.usuarios.get(3)!.debe_cambiar_password).toBe(1);
    expect(state.sesiones.has(3)).toBe(false);
    expect(state.auditoria).toEqual([
      {
        usuario_id: 1,
        accion: "reiniciar_password",
        detalle: "Contraseña reiniciada; pendiente de cambio",
      },
    ]);
    expect(JSON.stringify(state.auditoria)).not.toContain(resultado.passwordTemporal);
    expect(calls).toEqual(["begin", "commit", "release"]);
  });

  it("si falla la auditoría al desactivar, rollback conserva la sesión y el estado", async () => {
    state.falloEn = "auditoria";
    await expect(cambiarEstadoUsuario(admin, 3, false, null)).rejects.toThrow();
    expect(state.usuarios.get(3)!.activo).toBe(1);
    expect(state.sesiones.has(3)).toBe(true);
    expect(state.auditoria).toEqual([]);
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });

  it("si falla la auditoría al reiniciar, rollback conserva la sesión y el hash anterior", async () => {
    state.falloEn = "auditoria";
    await expect(reiniciarPassword(admin, 3, null)).rejects.toThrow();
    expect(state.usuarios.get(3)!.password_hash).toBe("hash:clave-original");
    expect(state.usuarios.get(3)!.debe_cambiar_password).toBe(0);
    expect(state.sesiones.has(3)).toBe(true);
    expect(state.auditoria).toEqual([]);
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });
});

describe("contraseña temporal: nunca en auditoría ni en logs", () => {
  it("la contraseña temporal no se registra aunque falle el hash", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      state.falloEn = "password";
      await expect(reiniciarPassword(admin, 3, null)).rejects.toThrow();
      const temporal = state.hashPassword.mock.calls.at(-1)![0]!;
      expect(temporal).toMatch(/\S{20,}/);
      expect(JSON.stringify(state.auditoria)).not.toContain(temporal);
      expect(spy.mock.calls.flat().join(" ")).not.toContain(temporal);
    } finally {
      spy.mockRestore();
    }
  });

  it("cambiar la propia contraseña limpia el aviso y no copia la nueva a la auditoría", async () => {
    expect(
      await cambiarPasswordPropio(
        comercial,
        { actual: "Clave-Actual-1", nueva: "Clave-Nueva-De-Prueba-1" },
        "1.1.1.1",
      ),
    ).toEqual({ ok: true });
    expect(state.usuarios.get(3)!.password_hash).toBe("hash:Clave-Nueva-De-Prueba-1");
    expect(state.usuarios.get(3)!.debe_cambiar_password).toBe(0);
    expect(state.auditoria).toEqual([
      {
        usuario_id: 3,
        accion: "cambiar_password",
        detalle: "Contraseña actualizada desde Mi cuenta",
      },
    ]);
    expect(JSON.stringify(state.auditoria)).not.toContain("Clave-Nueva-De-Prueba-1");
  });
});

describe("último administrador activo: bloqueo transaccional", () => {
  it("no se puede desactivar al único administrador activo: 409, rollback y mensaje claro", async () => {
    // Sesión residual de un administrador ya desactivado fuera de la aplicación.
    state.usuarios.get(2)!.activo = 0;
    expect(await cambiarEstadoUsuario(admin2, 1, false, null)).toEqual({
      ok: false,
      error: "conflict",
      mensaje: MENSAJE,
    });
    expect(state.usuarios.get(1)!.activo).toBe(1);
    expect(state.auditoria).toEqual([]);
    expect(executed.some((e) => e.sql.includes("FOR UPDATE"))).toBe(true);
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });

  it("no se puede quitar el rol al único administrador activo", async () => {
    state.usuarios.get(2)!.activo = 0;
    expect(await editarUsuario(admin2, 1, edicion, null)).toEqual({
      ok: false,
      error: "conflict",
      mensaje: MENSAJE,
    });
    expect(state.usuarios.get(1)!.rol).toBe("administrador");
    expect(calls).toEqual(["begin", "rollback", "release"]);
  });

  it("con dos administradores se puede desactivar uno, pero el que queda no puede ser degradado", async () => {
    expect(await cambiarEstadoUsuario(admin, 2, false, null)).toEqual({ ok: true });
    expect(state.usuarios.get(1)!.activo).toBe(1);
    expect(state.usuarios.get(2)!.activo).toBe(0);
    // Petición en vuelo con la sesión que acaba de invalidarse.
    expect(await editarUsuario(admin2, 1, edicion, null)).toEqual({
      ok: false,
      error: "conflict",
      mensaje: MENSAJE,
    });
    expect(state.usuarios.get(1)!.rol).toBe("administrador");
  });

  it("puedeDesactivar y puedeCambiarRol siguen impidiendo hacérselo a sí mismo", async () => {
    expect(await cambiarEstadoUsuario(admin, 1, false, null)).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(await editarUsuario(admin, 1, edicion, null)).toEqual({
      ok: false,
      error: "forbidden",
    });
    expect(calls).toEqual([]);
  });
});

describe("un comercial recibe forbidden en la gestión de usuarios sin tocar la base", () => {
  it("todas las acciones de /admin/usuarios y sus APIs se rechazan en servidor", async () => {
    const esperado = { ok: false, error: "forbidden" };
    expect(
      await crearUsuario(comercial, { ...edicion, password: "Clave-Temporal-De-Prueba-1" }, null),
    ).toEqual(esperado);
    expect(await editarUsuario(comercial, 1, edicion, null)).toEqual(esperado);
    expect(await cambiarEstadoUsuario(comercial, 1, false, null)).toEqual(esperado);
    expect(await desbloquearUsuario(comercial, 1, null)).toEqual(esperado);
    expect(await reiniciarPassword(comercial, 1, null)).toEqual(esperado);
    expect(calls).toEqual([]);
    expect(executed).toEqual([]);
  });
});
