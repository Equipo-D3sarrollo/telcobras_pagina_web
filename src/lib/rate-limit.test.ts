import { afterEach, describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp, isProxyTrusted } from "./rate-limit";

const request = (headers: Record<string, string>) =>
  new Request("https://telcobras.com/api/x", { headers });

const original = process.env["TRUST_PROXY"];
afterEach(() => {
  if (original === undefined) delete process.env["TRUST_PROXY"];
  else process.env["TRUST_PROXY"] = original;
});

describe("getClientIp sin TRUST_PROXY (comportamiento actual)", () => {
  it("usa cf-connecting-ip", () => {
    delete process.env["TRUST_PROXY"];
    expect(getClientIp(request({ "cf-connecting-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("ignora X-Forwarded-For aunque exista", () => {
    delete process.env["TRUST_PROXY"];
    expect(getClientIp(request({ "x-forwarded-for": "198.51.100.9" }))).toBeNull();
  });

  it("sin encabezados devuelve null", () => {
    expect(getClientIp(request({}))).toBeNull();
  });
});

describe("getClientIp con TRUST_PROXY=1", () => {
  it("sin encabezado conserva el comportamiento actual", () => {
    process.env["TRUST_PROXY"] = "1";
    expect(getClientIp(request({}))).toBeNull();
    expect(getClientIp(request({ "cf-connecting-ip": "203.0.113.7" }))).toBe("203.0.113.7");
  });

  it("con una sola IP usa esa", () => {
    process.env["TRUST_PROXY"] = "1";
    expect(getClientIp(request({ "x-forwarded-for": "198.51.100.9" }))).toBe("198.51.100.9");
  });

  it("con varias IPs toma la de más a la derecha (la que añadió el proxy)", () => {
    process.env["TRUST_PROXY"] = "1";
    expect(getClientIp(request({ "x-forwarded-for": "10.0.0.1, 192.0.2.50 ,198.51.100.9" }))).toBe(
      "198.51.100.9",
    );
  });

  it("una IP falsificada a la izquierda no cambia el resultado", () => {
    process.env["TRUST_PROXY"] = "true";
    const real = "198.51.100.9";
    const a = getClientIp(request({ "x-forwarded-for": real }));
    const b = getClientIp(request({ "x-forwarded-for": `1.2.3.4, ${real}` }));
    const c = getClientIp(request({ "x-forwarded-for": `6.6.6.6, 1.2.3.4, ${real}` }));
    expect([a, b, c]).toEqual([real, real, real]);
  });

  it("un valor que no parece una IP se ignora y se usa cf-connecting-ip", () => {
    process.env["TRUST_PROXY"] = "1";
    expect(
      getClientIp(
        request({ "x-forwarded-for": "1.2.3.4, <script>", "cf-connecting-ip": "203.0.113.7" }),
      ),
    ).toBe("203.0.113.7");
  });

  it("acepta IPv6", () => {
    process.env["TRUST_PROXY"] = "1";
    expect(getClientIp(request({ "x-forwarded-for": "2001:db8::1" }))).toBe("2001:db8::1");
  });
});

describe("isProxyTrusted", () => {
  it("solo se activa con 1 o true", () => {
    for (const [value, expected] of [
      ["1", true],
      ["true", true],
      ["TRUE", true],
      ["0", false],
      ["", false],
      ["si", false],
    ] as const) {
      process.env["TRUST_PROXY"] = value;
      expect(isProxyTrusted()).toBe(expected);
    }
    delete process.env["TRUST_PROXY"];
    expect(isProxyTrusted()).toBe(false);
  });
});

describe("createRateLimiter con la IP real", () => {
  it("dos clientes distintos no comparten el contador", () => {
    process.env["TRUST_PROXY"] = "1";
    const limiter = createRateLimiter({ windowMs: 1000, maxRequests: 1, maxEntries: 10 });
    const ipA = getClientIp(request({ "x-forwarded-for": "198.51.100.1" }))!;
    const ipB = getClientIp(request({ "x-forwarded-for": "198.51.100.2" }))!;
    expect(limiter.check(ipA).allowed).toBe(true);
    expect(limiter.check(ipA).allowed).toBe(false);
    expect(limiter.check(ipB).allowed).toBe(true);
  });
});
