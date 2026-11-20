import type { AdminUser } from "./auth.server";

/**
 * Guardián de páginas administrativas. Solo servidor.
 *
 * Las server functions ya devuelven 403 al comercial (la UI muestra «Acceso restringido»).
 * Este guardián hace además que la RESPUESTA HTTP del documento sea 403 en una visita
 * directa (SSR / recarga / curl), no solo el estado interno de la función de servidor.
 * Devuelve `null` cuando el usuario puede continuar (administrador o sin sesión: en ese
 * caso `beforeLoad` redirige al login).
 */
export async function respuestaSoloAdmin(
  request: Request,
  mensaje: string,
): Promise<Response | null> {
  const { getSessionUser, readSessionToken } = await import("./auth.server");
  const user: AdminUser | null = await getSessionUser(
    readSessionToken(request.headers.get("cookie")),
  );
  if (!user || user.rol === "administrador") return null;

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Acceso restringido | Telcobras</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#071a33;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}main{max-width:34rem;text-align:center;border:1px solid rgba(255,255,255,.16);border-radius:20px;padding:40px;background:rgba(16,40,74,.85)}h1{margin:0 0 12px;font-size:1.5rem}p{margin:0 0 24px;color:#cbd5e1}a{display:inline-block;min-height:44px;line-height:44px;padding:0 20px;border-radius:12px;background:#88BD4C;color:#061a33;font-weight:800;text-decoration:none}</style></head><body><main><h1>Acceso restringido</h1><p>${mensaje}</p><a href="/admin">Volver a Cotizaciones</a></main></body></html>`;
  return new Response(html, {
    status: 403,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
