export type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export const NO_CLIENT_IP_KEY = "no-client-ip";

// Una IP v4/v6 razonable: solo dígitos hexadecimales, puntos y dos puntos (máx. 45).
const IP_PATTERN = /^[0-9a-fA-F:.]{2,45}$/;

/** TRUST_PROXY=1 (o «true»): el servidor está detrás de un proxy de confianza (cPanel). */
export function isProxyTrusted(): boolean {
  const value = process.env["TRUST_PROXY"]?.trim().toLowerCase();
  return value === "1" || value === "true";
}

/**
 * IP del cliente. Con TRUST_PROXY activo se toma la entrada de la DERECHA de
 * X-Forwarded-For: es la que añadió nuestro proxy; las de la izquierda las envía el propio
 * cliente y pueden ser falsas. Sin TRUST_PROXY, sin encabezado o con un valor que no parece
 * una IP, se usa cf-connecting-ip (Cloudflare) y, si tampoco existe, `null`.
 * Si hubiera dos proxies encadenados de confianza, la derecha sería la del proxy interno.
 */
export function getClientIp(request: Request): string | null {
  if (isProxyTrusted()) {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const last = forwarded.split(",").at(-1)?.trim();
      if (last && IP_PATTERN.test(last)) return last;
    }
  }
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  const ip = cfConnectingIp?.trim();
  if (ip) return ip;
  return null;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  maxEntries: number;
}) {
  const rateLimitMap = new Map<string, RateLimitRecord>();
  const { windowMs, maxRequests, maxEntries } = options;

  function check(key: string): RateLimitResult {
    const now = Date.now();

    if (rateLimitMap.size > maxEntries) {
      for (const [k, record] of Array.from(rateLimitMap.entries())) {
        if (now > record.resetAt) {
          rateLimitMap.delete(k);
        }
      }
      if (rateLimitMap.size > maxEntries) {
        let deleted = 0;
        const toDeleteCount = rateLimitMap.size - maxEntries;
        for (const k of rateLimitMap.keys()) {
          if (deleted >= toDeleteCount) break;
          rateLimitMap.delete(k);
          deleted += 1;
        }
      }
    }

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.delete(key);
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (record.count >= maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    record.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { check };
}
