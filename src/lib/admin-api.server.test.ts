import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  user: null as null | {
    id: number;
    nombre: string;
    correo: string;
    rol: "administrador" | "comercial";
    debe_cambiar_password: number;
  },
  fail: false,
}));

vi.mock("./auth.server", async (original) => ({
  ...(await original<typeof import("./auth.server")>()),
  getSessionUser: async () => {
    if (session.fail) throw Object.assign(new Error("db caída"), { code: "ECONNREFUSED" });
    return session.user;
  },
}));

const { checkAdminActionLimit, requireAdminApi } = await import("./admin-api.server");

const post = (headers: Record<string, string> = {}) =>
  new Request("https://telcobras.com/api/admin/cotizaciones/5", {
    method: "POST",
    headers: {
      origin: "https://telcobras.com",
      host: "telcobras.com",
      cookie: "__Host-telcobras_admin=token",
      ...headers,
    },
  });
const get = () =>
  new Request("https://telcobras.com/api/admin/cotizaciones/5", {
    headers: { cookie: "__Host-telcobras_admin=token" },
  });
const status = (r: unknown) => (r instanceof Response ? r.status : "ok");

beforeEach(() => {
  session.user = {
    id: 1,
    nombre: "Ada",
    correo: "ada@example.invalid",
    rol: "administrador",
    debe_cambiar_password: 0,
  };
  session.fail = false;
  delete process.env["TRUST_PROXY"];
});

describe("requireAdminApi: sin sesión todo responde 401", () => {
  it("sin sesión válida → 401 en lecturas y en escrituras", async () => {
    session.user = null;
    expect(status(await requireAdminApi(post(), { mutation: true }))).toBe(401);
    expect(status(await requireAdminApi(get(), { mutation: false }))).toBe(401);
    expect(await ((await requireAdminApi(post(), { mutation: true })) as Response).json()).toEqual({
      error: "unauthorized",
    });
  });

  it("sin cookie tampoco hay sesión", async () => {
    session.user = null;
    const sinCookie = new Request("https://telcobras.com/x", {
      method: "POST",
      headers: { origin: "https://telcobras.com" },
    });
    expect(status(await requireAdminApi(sinCookie, { mutation: true }))).toBe(401);
  });

  it("con sesión válida devuelve el usuario y la IP", async () => {
    const result = await requireAdminApi(post({ "cf-connecting-ip": "203.0.113.5" }), {
      mutation: true,
    });
    expect(result).toMatchObject({ user: { id: 1 }, ip: "203.0.113.5" });
  });

  it("si la base falla responde 503 (no deja pasar)", async () => {
    session.fail = true;
    expect(status(await requireAdminApi(post(), { mutation: true }))).toBe(503);
  });
});

describe("requireAdminApi: Origin en los POST", () => {
  it("Origin ajeno, ausente o «null» → 403 (aunque haya sesión)", async () => {
    expect(
      status(await requireAdminApi(post({ origin: "https://evil.example" }), { mutation: true })),
    ).toBe(403);
    expect(status(await requireAdminApi(post({ origin: "null" }), { mutation: true }))).toBe(403);
    const sinOrigin = new Request("https://telcobras.com/x", {
      method: "POST",
      headers: { host: "telcobras.com", cookie: "__Host-telcobras_admin=token" },
    });
    expect(status(await requireAdminApi(sinOrigin, { mutation: true }))).toBe(403);
  });

  it("las lecturas no exigen Origin", async () => {
    expect(status(await requireAdminApi(get(), { mutation: false }))).toBe("ok");
  });

  it("adminOnly: un comercial recibe 403 en las APIs de gestión", async () => {
    session.user!.rol = "comercial";
    expect(status(await requireAdminApi(post(), { mutation: true, adminOnly: true }))).toBe(403);
    expect(status(await requireAdminApi(post(), { mutation: true }))).toBe("ok");
    session.user!.rol = "administrador";
    expect(status(await requireAdminApi(post(), { mutation: true, adminOnly: true }))).toBe("ok");
  });
});

const usuario = (id: number) => ({
  id,
  nombre: "Usuario de prueba",
  correo: "usuario@example.invalid",
  rol: "administrador" as const,
  debe_cambiar_password: 0,
});

describe("checkAdminActionLimit: límites dedicados además del genérico", () => {
  const desde = (ip: string, id: number, accion: Parameters<typeof checkAdminActionLimit>[2]) =>
    checkAdminActionLimit(post({ "cf-connecting-ip": ip }), usuario(id), accion);

  it("crear usuario: 10 permitidas y la 11ª desde la misma IP responde 429", () => {
    for (let i = 0; i < 10; i++) expect(desde("192.0.2.10", 700, "crear_usuario")).toBeNull();
    const limitada = desde("192.0.2.10", 700, "crear_usuario")!;
    expect(limitada.status).toBe(429);
    expect(limitada.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(limitada).toBeInstanceOf(Response);
  });

  it("reiniciar contraseña: el límite por usuario se aplica aunque cambie la IP", () => {
    for (let i = 0; i < 10; i++)
      expect(desde(`192.0.2.${20 + i}`, 701, "reiniciar_password")).toBeNull();
    expect(desde("192.0.2.99", 701, "reiniciar_password")!.status).toBe(429);
    expect(desde("192.0.2.99", 702, "reiniciar_password")).toBeNull();
  });

  it("cambiar contraseña: 5 permitidas, la 6ª responde 429 con mensaje genérico", async () => {
    for (let i = 0; i < 5; i++) expect(desde("192.0.2.40", 703, "cambiar_password")).toBeNull();
    const limitada = desde("192.0.2.40", 703, "cambiar_password")!;
    expect(limitada.status).toBe(429);
    await expect(limitada.json()).resolves.toEqual({
      error: "rate_limit_exceeded",
      mensaje: expect.any(String),
    });
    // Cada acción tiene su propio contador: crear usuario sigue permitido.
    expect(desde("192.0.2.40", 703, "crear_usuario")).toBeNull();
  });
});

describe("requireAdminApi: límite por IP", () => {
  it("la petición 121 desde la misma IP recibe 429; otra IP no", async () => {
    const from = (ip: string) => post({ "cf-connecting-ip": ip });
    for (let i = 0; i < 120; i++)
      expect(status(await requireAdminApi(from("198.51.100.77"), { mutation: true }))).toBe("ok");
    const limited = (await requireAdminApi(from("198.51.100.77"), { mutation: true })) as Response;
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toMatch(/^\d+$/);
    expect(status(await requireAdminApi(from("198.51.100.78"), { mutation: true }))).toBe("ok");
  });
});
