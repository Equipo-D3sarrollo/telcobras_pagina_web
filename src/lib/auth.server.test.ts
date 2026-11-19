import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type FakeUser = {
  id: number;
  nombre: string;
  correo: string;
  password_hash: string;
  rol: "administrador" | "comercial";
  activo: number;
  debe_cambiar_password: number;
  intentos_fallidos: number;
  bloqueado_hasta: Date | null;
  ultimo_acceso: Date | null;
};
type FakeSession = {
  id: string;
  usuario_id: number;
  expira_en: Date;
  ip: string | null;
  user_agent: string | null;
};
type FakeAudit = { usuario_id: number | null; accion: string; detalle: string; ip: string | null };

// Base de datos simulada en memoria: reconoce solo las consultas que usa auth.server.ts.
const db = vi.hoisted(() => ({
  usuarios: [] as FakeUser[],
  sesiones: [] as FakeSession[],
  auditoria: [] as FakeAudit[],
}));

vi.mock("./db.server", () => ({
  getPool: () => ({
    execute: async (sql: string, rawParams: unknown[]) => {
      // Los parámetros se usan con el tipo de cada columna; `never` evita repetir casts.
      const params = rawParams as [never, never, never, never, never];
      const q = sql.replace(/\s+/g, " ").trim();
      if (q.startsWith("SELECT id, nombre, correo, password_hash")) {
        const user = db.usuarios.find((u) => u.correo === params[0]);
        return [user ? [{ ...user }] : []];
      }
      if (q.startsWith("UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ?")) {
        const user = db.usuarios.find((u) => u.id === params[2])!;
        user.intentos_fallidos = params[0];
        user.bloqueado_hasta = params[1];
        return [{}];
      }
      if (q.startsWith("UPDATE usuarios SET intentos_fallidos = 0")) {
        const user = db.usuarios.find((u) => u.id === params[1])!;
        user.intentos_fallidos = 0;
        user.bloqueado_hasta = null;
        user.ultimo_acceso = params[0];
        return [{}];
      }
      if (q.startsWith("INSERT INTO sesiones")) {
        db.sesiones.push({
          id: params[0],
          usuario_id: params[1],
          expira_en: params[2],
          ip: params[3],
          user_agent: params[4],
        });
        return [{}];
      }
      if (q.startsWith("INSERT INTO auditoria")) {
        db.auditoria.push({
          usuario_id: params[0],
          accion: params[1],
          detalle: params[2],
          ip: params[3],
        });
        return [{}];
      }
      if (q.startsWith("DELETE FROM sesiones WHERE expira_en < ?")) {
        db.sesiones = db.sesiones.filter(
          (s) => s.expira_en.getTime() >= (params[0] as Date).getTime(),
        );
        return [{}];
      }
      if (q.startsWith("DELETE FROM sesiones WHERE id = ?")) {
        db.sesiones = db.sesiones.filter((s) => s.id !== params[0]);
        return [{}];
      }
      if (q.includes("FROM sesiones s JOIN usuarios u")) {
        const session = db.sesiones.find(
          (s) => s.id === params[0] && s.expira_en.getTime() > (params[1] as Date).getTime(),
        );
        const user =
          session && db.usuarios.find((u) => u.id === session.usuario_id && u.activo === 1);
        return [
          user
            ? [
                {
                  id: user.id,
                  nombre: user.nombre,
                  correo: user.correo,
                  rol: user.rol,
                  debe_cambiar_password: user.debe_cambiar_password ?? 0,
                },
              ]
            : [],
        ];
      }
      throw new Error("Consulta no prevista en la prueba: " + q);
    },
  }),
}));

const {
  GENERIC_LOGIN_ERROR,
  LOCK_MINUTES,
  MAX_FAILED_ATTEMPTS,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  cleanExpiredSessions,
  clearSessionCookie,
  getSessionUser,
  hashSessionToken,
  isSameOrigin,
  login,
  logout,
  newSessionToken,
  nextFailureState,
  readSessionToken,
  serializeSessionCookie,
} = await import("./auth.server");
const { hashPassword } = await import("./password.server");

const PASSWORD = "Clave-Correcta-De-Prueba-1";
const IP = "198.51.100.10";
let hash: string;

beforeAll(async () => {
  hash = await hashPassword(PASSWORD);
}, 30_000);

function addUser(overrides: Partial<FakeUser> = {}): FakeUser {
  const user: FakeUser = {
    id: db.usuarios.length + 1,
    nombre: "Ana Prueba",
    correo: "ana@example.invalid",
    password_hash: hash,
    rol: "comercial",
    activo: 1,
    debe_cambiar_password: 0,
    intentos_fallidos: 0,
    bloqueado_hasta: null,
    ultimo_acceso: null,
    ...overrides,
  };
  db.usuarios.push(user);
  return user;
}

const tryLogin = (password: string, correo = "ana@example.invalid") =>
  login({ correo, password, ip: IP, userAgent: "UA-de-prueba" });

beforeEach(() => {
  db.usuarios.length = 0;
  db.sesiones.length = 0;
  db.auditoria.length = 0;
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-18T10:00:00-05:00"));
});
afterEach(() => vi.useRealTimers());

describe("login correcto", () => {
  it("abre una sesión: guarda solo el SHA-256 del token, 8 h, IP y user-agent recortado", async () => {
    const user = addUser({ intentos_fallidos: 3 });
    const result = await login({
      correo: "  ANA@example.invalid ",
      password: PASSWORD,
      ip: IP,
      userAgent: "x".repeat(400),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.user).toEqual({
      id: user.id,
      nombre: "Ana Prueba",
      correo: "ana@example.invalid",
      rol: "comercial",
      debe_cambiar_password: 0,
    });
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes en base64url
    expect(db.sesiones).toHaveLength(1);
    const [session] = db.sesiones;
    expect(session!.id).toBe(hashSessionToken(result.token));
    expect(session!.id).toMatch(/^[0-9a-f]{64}$/);
    expect(session!.expira_en.getTime()).toBe(Date.now() + 8 * 3600 * 1000);
    expect(session!.ip).toBe(IP);
    expect(session!.user_agent).toHaveLength(255);
    // El token en claro no está en ninguna parte de la base.
    expect(JSON.stringify(db)).not.toContain(result.token);
    // Reinicia el contador y registra el acceso.
    expect(user.intentos_fallidos).toBe(0);
    expect(user.ultimo_acceso).toEqual(new Date());
    expect(db.auditoria).toEqual([
      { usuario_id: user.id, accion: "login", detalle: "Inicio de sesión", ip: IP },
    ]);
  });

  it("cada inicio de sesión genera un token distinto", async () => {
    addUser();
    const a = await tryLogin(PASSWORD);
    const b = await tryLogin(PASSWORD);
    expect(a.ok && b.ok && a.token !== b.token).toBe(true);
  });

  it("limpia las sesiones vencidas de forma oportunista", async () => {
    addUser();
    db.sesiones.push({
      id: "viejo",
      usuario_id: 1,
      expira_en: new Date(Date.now() - 1000),
      ip: null,
      user_agent: null,
    });
    await tryLogin(PASSWORD);
    expect(db.sesiones.map((s) => s.id)).not.toContain("viejo");
    expect(db.sesiones).toHaveLength(1);
  });
});

describe("login fallido", () => {
  it("contraseña incorrecta: falla, suma un intento y audita con el usuario (sin la contraseña)", async () => {
    const user = addUser();
    expect((await tryLogin("contraseña-equivocada-123")).ok).toBe(false);
    expect(user.intentos_fallidos).toBe(1);
    expect(db.sesiones).toHaveLength(0);
    expect(db.auditoria).toEqual([
      { usuario_id: user.id, accion: "login_fallido", detalle: "Contraseña incorrecta", ip: IP },
    ]);
    expect(JSON.stringify(db)).not.toContain("contraseña-equivocada-123");
  });

  it("correo inexistente: falla igual, audita con usuario NULL y no guarda el correo escrito", async () => {
    addUser();
    expect((await tryLogin(PASSWORD, "nadie@example.invalid")).ok).toBe(false);
    expect(db.auditoria).toHaveLength(1);
    expect(db.auditoria[0]).toMatchObject({ usuario_id: null, accion: "login_fallido", ip: IP });
    expect(JSON.stringify(db.auditoria)).not.toContain("nadie@example.invalid");
  });

  it("el mensaje genérico es el mismo y no revela nada", () => {
    expect(GENERIC_LOGIN_ERROR).toBe("Correo o contraseña incorrectos");
  });

  it("una cuenta inactiva no entra ni con la contraseña correcta", async () => {
    addUser({ activo: 0 });
    expect((await tryLogin(PASSWORD)).ok).toBe(false);
    expect(db.sesiones).toHaveLength(0);
    expect(db.auditoria[0]).toMatchObject({ accion: "login_fallido", detalle: "Cuenta inactiva" });
  });
});

describe("bloqueo tras intentos fallidos", () => {
  it("nextFailureState bloquea 15 min al llegar a 5 y reinicia el contador", () => {
    const now = new Date("2026-11-18T10:00:00-05:00");
    expect(nextFailureState(0, now)).toEqual({ attempts: 1, lockedUntil: null });
    expect(nextFailureState(MAX_FAILED_ATTEMPTS - 2, now)).toEqual({
      attempts: MAX_FAILED_ATTEMPTS - 1,
      lockedUntil: null,
    });
    expect(nextFailureState(MAX_FAILED_ATTEMPTS - 1, now)).toEqual({
      attempts: 0,
      lockedUntil: new Date(now.getTime() + LOCK_MINUTES * 60_000),
    });
  });

  it("5 fallos seguidos bloquean; con la contraseña correcta sigue sin entrar hasta que pasan 15 min", async () => {
    const user = addUser();
    for (let i = 0; i < 4; i++) {
      await tryLogin("incorrecta-numero-" + i);
      expect(user.bloqueado_hasta).toBeNull();
    }
    await tryLogin("incorrecta-numero-5");
    expect(user.bloqueado_hasta).toEqual(new Date(Date.now() + 15 * 60_000));
    expect(db.auditoria.at(-1)?.detalle).toContain("bloqueada");

    // Bloqueada: ni con la contraseña correcta, y no suma intentos.
    expect((await tryLogin(PASSWORD)).ok).toBe(false);
    expect(db.auditoria.at(-1)?.detalle).toBe("Cuenta bloqueada");
    vi.setSystemTime(Date.now() + 14 * 60_000);
    expect((await tryLogin(PASSWORD)).ok).toBe(false);

    // Pasado el bloqueo, entra y se reinicia todo.
    vi.setSystemTime(Date.now() + 2 * 60_000);
    expect((await tryLogin(PASSWORD)).ok).toBe(true);
    expect(user.intentos_fallidos).toBe(0);
    expect(user.bloqueado_hasta).toBeNull();
  }, 30_000);

  it("un acierto intermedio reinicia el contador (los 5 deben ser seguidos)", async () => {
    const user = addUser();
    for (let i = 0; i < 4; i++) await tryLogin("incorrecta-" + i);
    expect(user.intentos_fallidos).toBe(4);
    expect((await tryLogin(PASSWORD)).ok).toBe(true);
    expect(user.intentos_fallidos).toBe(0);
    await tryLogin("incorrecta-otra-vez");
    expect(user.bloqueado_hasta).toBeNull();
  }, 30_000);
});

describe("sesiones", () => {
  it("la sesión vale 8 horas y después vence", async () => {
    addUser();
    const result = await tryLogin(PASSWORD);
    if (!result.ok) throw new Error("login");
    expect((await getSessionUser(result.token))?.nombre).toBe("Ana Prueba");
    vi.setSystemTime(Date.now() + 8 * 3600 * 1000 - 1000);
    expect(await getSessionUser(result.token)).not.toBeNull();
    vi.setSystemTime(Date.now() + 2000); // pasaron las 8 h
    expect(await getSessionUser(result.token)).toBeNull();
  });

  it("un token desconocido, vacío o manipulado no abre sesión", async () => {
    addUser();
    const result = await tryLogin(PASSWORD);
    if (!result.ok) throw new Error("login");
    expect(await getSessionUser(null)).toBeNull();
    expect(await getSessionUser("")).toBeNull();
    expect(await getSessionUser(newSessionToken())).toBeNull();
    expect(await getSessionUser(result.token.slice(0, -1) + "A")).toBeNull();
    // El hash guardado tampoco sirve como token.
    expect(await getSessionUser(db.sesiones[0]!.id)).toBeNull();
  });

  it("si la cuenta se desactiva, su sesión deja de valer", async () => {
    const user = addUser();
    const result = await tryLogin(PASSWORD);
    if (!result.ok) throw new Error("login");
    user.activo = 0;
    expect(await getSessionUser(result.token)).toBeNull();
  });

  it("logout borra la fila y audita; después la sesión no existe", async () => {
    const user = addUser();
    const result = await tryLogin(PASSWORD);
    if (!result.ok) throw new Error("login");
    await logout(result.token, IP);
    expect(db.sesiones).toHaveLength(0);
    expect(await getSessionUser(result.token)).toBeNull();
    expect(db.auditoria.at(-1)).toEqual({
      usuario_id: user.id,
      accion: "logout",
      detalle: "Cierre de sesión",
      ip: IP,
    });
    await expect(logout(null, IP)).resolves.toBeUndefined();
  });

  it("cleanExpiredSessions solo borra las vencidas", async () => {
    db.sesiones.push(
      {
        id: "vencida",
        usuario_id: 1,
        expira_en: new Date(Date.now() - 1),
        ip: null,
        user_agent: null,
      },
      {
        id: "vigente",
        usuario_id: 1,
        expira_en: new Date(Date.now() + 1000),
        ip: null,
        user_agent: null,
      },
    );
    await cleanExpiredSessions();
    expect(db.sesiones.map((s) => s.id)).toEqual(["vigente"]);
  });
});

describe("cookie de sesión", () => {
  it("lleva __Host-, HttpOnly, Secure, SameSite=Strict, Path=/ y 8 horas", () => {
    const cookie = serializeSessionCookie("tok");
    expect(cookie.startsWith(`${SESSION_COOKIE}=tok;`)).toBe(true);
    expect(SESSION_COOKIE.startsWith("__Host-")).toBe(true);
    for (const attribute of [
      "Path=/",
      `Max-Age=${SESSION_MAX_AGE_SECONDS}`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
    ]) {
      expect(cookie).toContain(attribute);
    }
    expect(SESSION_MAX_AGE_SECONDS).toBe(28800);
    expect(cookie).not.toContain("Domain"); // requisito del prefijo __Host-
  });

  it("clearSessionCookie la expira", () => {
    expect(clearSessionCookie()).toContain("Max-Age=0");
  });

  it("readSessionToken extrae el token entre otras cookies", () => {
    expect(readSessionToken(`a=1; ${SESSION_COOKIE}=abc123; b=2`)).toBe("abc123");
    expect(readSessionToken("a=1; b=2")).toBeNull();
    expect(readSessionToken(null)).toBeNull();
    expect(readSessionToken(`${SESSION_COOKIE}=`)).toBeNull();
    expect(readSessionToken(`otra-${SESSION_COOKIE}=zzz`)).toBeNull();
  });
});

describe("isSameOrigin (CSRF)", () => {
  const post = (headers: Record<string, string>) =>
    new Request("https://telcobras.com/api/admin/login", { method: "POST", headers });

  it("acepta un Origin con el mismo host", () => {
    expect(isSameOrigin(post({ origin: "https://telcobras.com", host: "telcobras.com" }))).toBe(
      true,
    );
  });

  it("rechaza sin Origin, con «null», con otro host o mal formado", () => {
    expect(isSameOrigin(post({ host: "telcobras.com" }))).toBe(false);
    expect(isSameOrigin(post({ origin: "null", host: "telcobras.com" }))).toBe(false);
    expect(isSameOrigin(post({ origin: "https://evil.example", host: "telcobras.com" }))).toBe(
      false,
    );
    expect(
      isSameOrigin(post({ origin: "https://telcobras.com.evil.example", host: "telcobras.com" })),
    ).toBe(false);
    expect(isSameOrigin(post({ origin: "no es una url", host: "telcobras.com" }))).toBe(false);
  });

  it("distingue el puerto (localhost:8080 ≠ localhost:9999)", () => {
    const request = new Request("http://localhost:8080/api/admin/login", {
      method: "POST",
      headers: { origin: "http://localhost:9999", host: "localhost:8080" },
    });
    expect(isSameOrigin(request)).toBe(false);
  });

  it("x-forwarded-host solo cuenta con TRUST_PROXY", () => {
    const headers = {
      origin: "https://telcobras.com",
      host: "127.0.0.1:3000",
      "x-forwarded-host": "telcobras.com",
    };
    const request = () =>
      new Request("http://127.0.0.1:3000/api/admin/login", { method: "POST", headers });
    delete process.env["TRUST_PROXY"];
    expect(isSameOrigin(request())).toBe(false);
    process.env["TRUST_PROXY"] = "1";
    expect(isSameOrigin(request())).toBe(true);
    delete process.env["TRUST_PROXY"];
  });
});
