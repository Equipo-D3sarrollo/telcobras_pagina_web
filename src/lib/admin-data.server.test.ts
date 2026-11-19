import { beforeEach, describe, expect, it, vi } from "vitest";

type Sesion = {
  id: number;
  nombre: string;
  correo: string;
  rol: "administrador" | "comercial";
  debe_cambiar_password: number;
};

const mocks = vi.hoisted(() => ({
  user: null as null | Sesion,
  listarUsuarios: vi.fn(async () => [] as unknown[]),
}));

vi.mock("@tanstack/react-start", () => {
  const builder = {
    method: () => builder,
    validator: () => builder,
    handler: (fn: unknown) => fn,
  };
  return { createServerFn: () => builder };
});

vi.mock("@tanstack/react-start/server", () => ({
  getRequest: () =>
    new Request("https://telcobras.com/admin/usuarios", {
      headers: { cookie: "__Host-telcobras_admin=token" },
    }),
  getRequestHeader: () => "__Host-telcobras_admin=token",
  setResponseStatus: vi.fn(),
}));

vi.mock("./auth.server", () => ({
  getSessionUser: async (token: string | null) => (token ? mocks.user : null),
  readSessionToken: (cookie: string | null) => (cookie ? "token-de-prueba" : null),
}));

vi.mock("./usuarios-admin.server", () => ({ listarUsuarios: mocks.listarUsuarios }));

const { listarUsuariosFn } = await import("./admin-data.server");

beforeEach(() => {
  mocks.user = {
    id: 1,
    nombre: "Ada Admin",
    correo: "ada@example.invalid",
    rol: "administrador",
    debe_cambiar_password: 0,
  };
  mocks.listarUsuarios.mockClear();
});

describe("listarUsuariosFn: la página /admin/usuarios exige administrador", () => {
  it("un comercial recibe forbidden y no se consultan las cuentas", async () => {
    mocks.user!.rol = "comercial";
    await expect(listarUsuariosFn()).resolves.toEqual({ ok: false, error: "forbidden" });
    expect(mocks.listarUsuarios).not.toHaveBeenCalled();
  });

  it("un administrador sí obtiene la lista", async () => {
    await expect(listarUsuariosFn()).resolves.toEqual({ ok: true, usuarios: [] });
    expect(mocks.listarUsuarios).toHaveBeenCalledOnce();
  });

  it("sin sesión no se consulta nada", async () => {
    mocks.user = null;
    await expect(listarUsuariosFn()).resolves.toEqual({ ok: false, error: "unauthorized" });
    expect(mocks.listarUsuarios).not.toHaveBeenCalled();
  });
});
