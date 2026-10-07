import { createFileRoute } from "@tanstack/react-router";

const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_SESSION_ID_LENGTH = 128;
const MAX_MESSAGE_LENGTH = 4000;
const MAX_UPSTREAM_RESPONSE_BYTES = 64 * 1024;
const MAX_REPLY_LENGTH = 16_000;
const UPSTREAM_TIMEOUT_MS = 30_000;

type ChatRequest = {
  session_id: string;
  mensaje: string;
};

function jsonResponse(body: Record<string, string>, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json; charset=utf-8");
  responseHeaders.set("cache-control", "no-store");

  return new Response(JSON.stringify(body), { status, headers: responseHeaders });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractBotResponse(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return null;

  for (const key of ["respuesta_bot", "respuesta", "response", "message", "text"]) {
    const candidate = value[key];
    if (typeof candidate === "string") return candidate;
  }

  return null;
}

function isChatRequest(value: unknown): value is ChatRequest {
  if (!isRecord(value)) return false;

  const { session_id, mensaje } = value;
  return (
    typeof session_id === "string" &&
    session_id.trim().length > 0 &&
    session_id.length <= MAX_SESSION_ID_LENGTH &&
    typeof mensaje === "string" &&
    mensaje.trim().length > 0 &&
    mensaje.length <= MAX_MESSAGE_LENGTH
  );
}

async function readLimitedStream(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (!stream) return new Uint8Array();

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

async function readLimitedBody(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && Number(contentLength) > maxBytes) return null;
  return readLimitedStream(request.body, maxBytes);
}

async function readUpstreamBody(response: Response): Promise<Uint8Array | null> {
  return readLimitedStream(response.body, MAX_UPSTREAM_RESPONSE_BYTES);
}

function getConfiguredWebhookUrl(): string | null {
  const configuredUrl = process.env["MAKE_CHAT_WEBHOOK_URL"]?.trim();
  if (!configuredUrl) return null;

  try {
    const parsedUrl = new URL(configuredUrl);
    return parsedUrl.protocol === "https:" ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}

async function handlePost(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return jsonResponse({ error: "unsupported_media_type" }, 415);
  }

  let body: Uint8Array | null;
  try {
    body = await readLimitedBody(request, MAX_REQUEST_BYTES);
  } catch {
    return jsonResponse({ error: "invalid_request" }, 400);
  }
  if (body === null) return jsonResponse({ error: "payload_too_large" }, 413);

  let input: unknown;
  try {
    input = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    return jsonResponse({ error: "invalid_request" }, 400);
  }
  if (!isChatRequest(input)) return jsonResponse({ error: "invalid_request" }, 400);

  const webhookUrl = getConfiguredWebhookUrl();
  if (!webhookUrl) return jsonResponse({ error: "chat_unavailable" }, 503);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const upstreamResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        session_id: input.session_id,
        mensaje: input.mensaje,
      }),
      redirect: "error",
      signal: controller.signal,
    });

    if (!upstreamResponse.ok) return jsonResponse({ error: "upstream_error" }, 502);
    const upstreamContentType = upstreamResponse.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase();
    if (upstreamContentType !== "application/json" && upstreamContentType !== "text/plain") {
      return jsonResponse({ error: "invalid_upstream_response" }, 502);
    }

    let upstreamBody: Uint8Array | null;
    try {
      upstreamBody = await readUpstreamBody(upstreamResponse);
    } catch {
      if (controller.signal.aborted) return jsonResponse({ error: "upstream_timeout" }, 504);
      return jsonResponse({ error: "invalid_upstream_response" }, 502);
    }
    if (upstreamBody === null) return jsonResponse({ error: "invalid_upstream_response" }, 502);

    const upstreamText = new TextDecoder("utf-8", { fatal: true }).decode(upstreamBody);
    let upstreamData: unknown = upstreamText;
    if (upstreamContentType === "application/json" || upstreamText.trimStart().startsWith("{")) {
      try {
        upstreamData = JSON.parse(upstreamText);
      } catch {
        if (upstreamContentType === "application/json") {
          return jsonResponse({ error: "invalid_upstream_response" }, 502);
        }
      }
    }

    const botResponse = extractBotResponse(upstreamData);
    if (typeof botResponse === "string" && /^accepted\.?$/i.test(botResponse.trim())) {
      return jsonResponse({ error: "agent_response_unavailable" }, 502);
    }
    if (
      typeof botResponse !== "string" ||
      botResponse.trim().length === 0 ||
      botResponse.length > MAX_REPLY_LENGTH
    ) {
      return jsonResponse({ error: "invalid_upstream_response" }, 502);
    }

    return jsonResponse({ respuesta_bot: botResponse });
  } catch {
    if (controller.signal.aborted) return jsonResponse({ error: "upstream_timeout" }, 504);
    return jsonResponse({ error: "upstream_error" }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

function methodNotAllowed(): Response {
  return jsonResponse({ error: "method_not_allowed" }, 405, { allow: "POST" });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => methodNotAllowed(),
    },
  },
});
