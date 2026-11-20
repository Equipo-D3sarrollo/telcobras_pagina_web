import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DatosAviso, TransporteCorreo } from "./cotizaciones-mail.server";

const estado = vi.hoisted(() => ({
  eventos: [] as string[],
  executed: [] as { sql: string; params: unknown[] }[],
  fila: null as Record<string, unknown> | null,
}));

vi.mock("./db.server", () => ({
  getPool: () => ({
    getConnection: async () => ({
      beginTransaction: async () => void estado.eventos.push("begin"),
      commit: async () => void estado.eventos.push("commit"),
      rollback: async () => void estado.eventos.push("rollback"),
      release: () => void estado.eventos.push("release"),
      execute: async (sql: string, params: unknown[]) => {
        estado.eventos.push(sql.includes("INSERT INTO cotizaciones") ? "insert" : "audit");
        estado.executed.push({ sql, params });
        return [{ insertId: 77 }];
      },
    }),
    execute: async (sql: string, params: unknown[]) => {
      estado.eventos.push(sql.startsWith("SELECT") ? "select" : "update");
      estado.executed.push({ sql, params });
      if (sql.startsWith("SELECT")) return [estado.fila ? [estado.fila] : []];
      return [{}];
    },
  }),
}));

const {
  MAIL_TIMEOUT_MS,
  construirMensaje,
  datosAvisoPorId,
  enviarAvisoCotizacion,
  leerConfigSmtp,
  programarAvisoCotizacion,
  reiniciarAvisoConfigFaltante,
  sanitizarCabecera,
} = await import("./cotizaciones-mail.server");
const { guardarCotizacionConAviso: guardar } = await import("./cotizaciones.server");

const CLAVES = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_SECURE",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "MAIL_FROM",
  "MAIL_TO_COTIZACIONES",
  "PUBLIC_SITE_URL",
] as const;
const originales = new Map<string, string | undefined>();

type Enviado = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

function transporte(opciones: { fallar?: unknown; espera?: Promise<void> } = {}) {
  const enviados: Enviado[] = [];
  const sendMail = vi.fn(async (mail: Enviado) => {
    estado.eventos.push("send");
    if (opciones.espera) await opciones.espera;
    if (opciones.fallar) throw opciones.fallar;
    enviados.push(mail);
    return { messageId: "prueba-local" };
  });
  return { enviados, sendMail } as {
    enviados: Enviado[];
    sendMail: ReturnType<typeof vi.fn>;
  } & TransporteCorreo;
}

const datos: DatosAviso = {
  id: 77,
  creado_en: "2026-11-19T15:30:00-05:00",
  servicio: "Conectividad",
  empresa: "ACME S.A.S.",
  nombre: "Ana Pérez",
  origen: "formulario_web",
};

const formulario = {
  nombre: "Ana Pérez",
  empresa: "ACME S.A.S.",
  cargo: "Gerente",
  correo: "ana@example.invalid",
  telefono: "3001234567",
  servicio: "Conectividad",
  mensaje: "Mensaje privado del cliente",
  idioma: "es" as const,
};

beforeEach(() => {
  for (const clave of CLAVES) {
    if (!originales.has(clave)) originales.set(clave, process.env[clave]);
    process.env[clave] = "";
  }
  process.env["SMTP_HOST"] = "smtp.example.invalid";
  process.env["SMTP_PORT"] = "465";
  process.env["SMTP_SECURE"] = "true";
  process.env["SMTP_USER"] = "usuario@example.invalid";
  process.env["SMTP_PASSWORD"] = "Clave-Temporal-De-Prueba-1";
  process.env["MAIL_FROM"] = "TELCOBRAS Web <notificaciones@example.invalid>";
  process.env["MAIL_TO_COTIZACIONES"] = "contabilidad@example.invalid";
  process.env["PUBLIC_SITE_URL"] = "https://telcobras.com";
  estado.eventos.length = 0;
  estado.executed.length = 0;
  estado.fila = null;
  reiniciarAvisoConfigFaltante();
  vi.restoreAllMocks();
});

afterEach(() => {
  for (const [clave, valor] of originales) {
    if (valor === undefined) delete process.env[clave];
    else process.env[clave] = valor;
  }
});

describe("aviso por correo de cotizaciones nuevas", () => {
  it("el timeout es de 15 s y la configuración se lee del entorno", () => {
    expect(MAIL_TIMEOUT_MS).toBe(15_000);
    expect(leerConfigSmtp()).toMatchObject({ port: 465, secure: true });
  });

  it("guarda en MySQL, después envía y marca aviso_correo_enviado = 1", async () => {
    const t = transporte();
    const id = await guardar(formulario, t);
    expect(id).toBe(77);
    await vi.waitFor(() => expect(estado.eventos).toContain("update"));

    expect(estado.eventos.indexOf("insert")).toBeLessThan(estado.eventos.indexOf("send"));
    expect(estado.eventos.indexOf("commit")).toBeLessThan(estado.eventos.indexOf("send"));
    expect(t.enviados).toHaveLength(1);
    const update = estado.executed.find((e) => e.sql.startsWith("UPDATE cotizaciones"));
    expect(update?.sql).toContain("aviso_correo_enviado = 1");
    expect(update?.params).toEqual([77]);
  });

  it("no bloquea la respuesta: el envío puede seguir pendiente tras guardar", async () => {
    let liberar: () => void = () => {};
    const espera = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    const t = transporte({ espera });

    const inicio = Date.now();
    await guardar(formulario, t);
    expect(Date.now() - inicio).toBeLessThan(1000);
    expect(t.sendMail).toHaveBeenCalledTimes(1);
    expect(estado.eventos).not.toContain("update");

    liberar();
    await vi.waitFor(() => expect(estado.eventos).toContain("update"));
  });

  it("si SMTP falla, no marca la columna y el error se registra solo con código", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const t = transporte({
      fallar: Object.assign(new Error("detalle sensible"), { code: "ESMTP" }),
    });

    const resultado = await enviarAvisoCotizacion(datos, t);
    expect(resultado).toEqual({ ok: false, enviado: false, code: "ESMTP" });
    expect(estado.eventos).not.toContain("update");
    expect(error).toHaveBeenCalledWith("[cotizaciones/mail] Error de SMTP.", { code: "ESMTP" });
    expect(JSON.stringify(error.mock.calls)).not.toContain("detalle sensible");
    expect(JSON.stringify(error.mock.calls)).not.toContain("Ana Pérez");
    await expect(guardar(formulario, t)).resolves.toBe(77);
  });

  it("sin configuración no envía y avisa una sola vez", async () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const clave of CLAVES) process.env[clave] = "";
    const t = transporte();

    await enviarAvisoCotizacion(datos, t);
    programarAvisoCotizacion(77, datos, t);
    await enviarAvisoCotizacion(datos, t);

    expect(t.sendMail).not.toHaveBeenCalled();
    expect(aviso).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(aviso.mock.calls)).not.toContain("Ana Pérez");
  });

  it("el contenido tiene id, fecha de Colombia, servicio, empresa, nombre y enlace", () => {
    const mensaje = construirMensaje(datos, leerConfigSmtp()!);
    expect(mensaje.subject).toBe("Nueva solicitud de cotización #77");
    for (const texto of [mensaje.text, mensaje.html]) {
      expect(texto).toContain("TELCOBRAS S.A.S.");
      expect(texto).toContain("Nueva solicitud de cotización #77");
      expect(texto).toContain("19/11/2026"); // hora Colombia (UTC 20:30 -> 15:30)
      expect(texto).toContain("3:30");
      expect(texto).toContain("Conectividad");
      expect(texto).toContain("ACME S.A.S.");
      expect(texto).toContain("Ana Pérez");
      expect(texto).toContain("https://telcobras.com/admin/cotizaciones/77");
    }
  });

  it("no incluye teléfono, correo, mensaje ni notas, y escapa el HTML", () => {
    const sucio = {
      ...datos,
      nombre: "Ana <script>alert(1)</script>",
      empresa: "ACME & Co",
      servicio: "<b>Redes</b>",
      telefono: "3001234567",
      correo: "ana@example.invalid",
      mensaje: "Mensaje privado del cliente",
      notas: "Notas internas secretas",
    } as DatosAviso & {
      telefono: string;
      correo: string;
      mensaje: string;
      notas: string;
    };
    const mensaje = construirMensaje(sucio, leerConfigSmtp()!);
    const todo = mensaje.text + mensaje.html;

    expect(todo).not.toContain("3001234567");
    expect(todo).not.toContain("ana@example.invalid");
    expect(todo).not.toContain("Mensaje privado del cliente");
    expect(todo).not.toContain("Notas internas secretas");
    expect(mensaje.html).not.toContain("<script>");
    expect(mensaje.html).toContain("&lt;script&gt;");
    expect(mensaje.html).toContain("ACME &amp; Co");
    expect(mensaje.html).toContain("&lt;b&gt;Redes&lt;/b&gt;");
  });

  it("el asunto no admite saltos de línea", () => {
    expect(sanitizarCabecera("a\r\nBcc: atacante@example.invalid")).toBe(
      "a Bcc: atacante@example.invalid",
    );
    const mensaje = construirMensaje(
      { ...datos, id: "77\r\nBcc: atacante@example.invalid" as unknown as number },
      leerConfigSmtp()!,
    );
    expect(mensaje.subject).not.toMatch(/[\r\n]/);
  });

  it("las cotizaciones creadas a mano no generan aviso", async () => {
    const t = transporte();
    programarAvisoCotizacion(77, { ...datos, origen: "manual" }, t);
    await Promise.resolve();
    expect(t.sendMail).not.toHaveBeenCalled();
  });

  it("lee los datos mínimos para reenviar y responde null si no existe", async () => {
    estado.fila = {
      id: 77,
      creado_en: new Date("2026-11-19T20:30:00Z"),
      servicio: "Conectividad",
      empresa: "ACME",
      nombre: "Ana",
      origen: "formulario_web",
    };
    expect(await datosAvisoPorId(77)).toMatchObject({ id: 77, empresa: "ACME" });
    estado.fila = null;
    expect(await datosAvisoPorId(78)).toBeNull();
  });
});
