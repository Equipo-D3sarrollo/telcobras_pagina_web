export type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export const NO_CLIENT_IP_KEY = "no-client-ip";

export function getClientIp(request: Request): string | null {
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
