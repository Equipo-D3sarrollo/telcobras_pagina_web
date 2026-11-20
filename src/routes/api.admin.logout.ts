import { createFileRoute } from "@tanstack/react-router";
import { getClientIp } from "@/lib/rate-limit";
import { clearSessionCookie, isSameOrigin, logout, readSessionToken } from "@/lib/auth.server";

function json(body: Record<string, unknown>, status = 200, extra?: [string, string][]) {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  for (const [name, value] of extra ?? []) headers.append(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

// Cerrar sesión es un POST (no un GET): así un enlace o una imagen de otro sitio no puede
// cerrarla. Borra la fila de la sesión y la cookie.
async function handlePost(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) return json({ error: "forbidden" }, 403);
  try {
    await logout(readSessionToken(request.headers.get("cookie")), getClientIp(request));
  } catch (error) {
    const { code, errno } = (typeof error === "object" && error !== null ? error : {}) as Record<
      string,
      unknown
    >;
    console.error("[api/admin/logout] Error al cerrar la sesión.", { code, errno });
    return json({ error: "unavailable" }, 503);
  }
  return json({ status: "ok" }, 200, [["set-cookie", clearSessionCookie()]]);
}

export const Route = createFileRoute("/api/admin/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => json({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
