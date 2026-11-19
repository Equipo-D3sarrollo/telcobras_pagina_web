import { beforeEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({
  user: null as null | {
    id: number;
    nombre: string;
    correo: string;
    rol: "administrador" | "comercial";
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

const { requireAdminApi } = await import("./admin-api.server");

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
  session.user = { id: 1, nombre: "Ada", correo: "ada@example.invalid", rol: "administrador" };
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
