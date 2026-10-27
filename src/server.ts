import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { readAccessibilityPreferencesCookie } from "./lib/accessibility-preferences";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

// TanStack Start injects inline bootstrap/hydration scripts, so script-src keeps
// 'unsafe-inline'. Dev also needs eval and the Vite HMR websocket.
// The policy is enforced (Content-Security-Policy); it can be tightened to
// nonces/hashes for script-src once the inline bootstrap is nonce-aware.
const isDev = import.meta.env.DEV;

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://vibe.filesafe.space https://*.supabase.co",
  "media-src 'self'",
  "frame-src 'self' https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
  `connect-src 'self' https://challenges.cloudflare.com${isDev ? " ws: wss: http://localhost:* http://127.0.0.1:*" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const SECURITY_HEADERS: Array<[string, string]> = [
  ["content-security-policy", CONTENT_SECURITY_POLICY],
  ["x-content-type-options", "nosniff"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
  ["permissions-policy", "camera=(), microphone=(), geolocation=()"],
  ["x-frame-options", "DENY"],
];

function withSecurityHeaders(response: Response, requestUrl: URL): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of SECURITY_HEADERS) headers.set(name, value);
  if (requestUrl.protocol === "https:") {
    headers.set("strict-transport-security", "max-age=31536000");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  request: Request,
  response: Response,
  cookieHeader: string | null,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));

  const isApiRoute = new URL(request.url).pathname.startsWith("/api/");
  if (isApiRoute) {
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const language = readAccessibilityPreferencesCookie(cookieHeader ?? undefined).language;
  return new Response(renderErrorPage(language), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
      stack?: unknown;
      statusCode?: unknown;
    };
    return (
      (payload.unhandled === true && payload.message === "HTTPError") ||
      Boolean(payload.stack) ||
      (typeof payload.statusCode === "number" && payload.statusCode >= 500)
    );
  } catch {
    return false;
  }
}

async function handleRequest(request: Request, env: unknown, ctx: unknown): Promise<Response> {
  try {
    const handler = await getServerEntry();
    const response = await handler.fetch(request, env, ctx);
    return await normalizeCatastrophicSsrResponse(request, response, request.headers.get("cookie"));
  } catch (error) {
    console.error(error);
    const isApiRoute = new URL(request.url).pathname.startsWith("/api/");
    if (isApiRoute) {
      return new Response(JSON.stringify({ error: "internal_error" }), {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }
    const language = readAccessibilityPreferencesCookie(
      request.headers.get("cookie") ?? undefined,
    ).language;
    return new Response(renderErrorPage(language), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const response = await handleRequest(request, env, ctx);
    return withSecurityHeaders(response, new URL(request.url));
  },
};
