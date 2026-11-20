import { createFileRoute } from "@tanstack/react-router";
import { adminJson, logAdminError, readJsonBody, requireAdminApi } from "@/lib/admin-api.server";
import {
  eliminarDefinitivamente,
  moverAPapelera,
  restaurarCotizacion,
} from "@/lib/cotizaciones-admin.server";
import { parseId, parsePapeleraInput } from "@/lib/cotizaciones-admin-shared";

const MAX_BODY_CHARS = 2 * 1024;
const STATUS = { not_found: 404, conflict: 409, forbidden: 403, invalid: 400 } as const;
const ACCIONES = ["eliminar", "restaurar", "definitivo"] as const;
type Accion = (typeof ACCIONES)[number];

// POST /api/admin/cotizaciones/:id/papelera — borrado lógico, restauración o borrado definitivo.
// Sesión + rol de administrador + Origin + límite genérico de escrituras (requireAdminApi).
async function handlePost(request: Request, rawId: string): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true, adminOnly: true });
  if (auth instanceof Response) return auth;

  const id = parseId(rawId);
  const body = await readJsonBody(request, MAX_BODY_CHARS);
  const raw = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const accion = ACCIONES.find((item) => item === raw["accion"]);
  const input = parsePapeleraInput(body);
  if (id === null || accion === undefined || input === null) {
    return adminJson({ error: "invalid_request" }, 400);
  }

  try {
    let result:
      | { ok: true; actualizado_en?: string }
      | { ok: false; error: "not_found" | "conflict" | "forbidden" | "invalid" };
    switch (accion as Accion) {
      case "eliminar":
        result = await moverAPapelera(auth.user, id, input, auth.ip);
        break;
      case "restaurar":
        result = await restaurarCotizacion(auth.user, id, input, auth.ip);
        break;
      case "definitivo":
        result = await eliminarDefinitivamente(auth.user, id, input, auth.ip);
        break;
    }
    if (!result.ok) return adminJson({ error: result.error }, STATUS[result.error]);
    return adminJson({ status: "ok", ...result });
  } catch (error) {
    logAdminError("api/admin/cotizaciones/:id/papelera", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/cotizaciones/$id/papelera")({
  server: {
    handlers: {
      POST: async ({ request, params }) => handlePost(request, params.id),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
