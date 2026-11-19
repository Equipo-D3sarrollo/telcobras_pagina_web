import { createFileRoute } from "@tanstack/react-router";
import { adminJson, logAdminError, readJsonBody, requireAdminApi } from "@/lib/admin-api.server";
import { actualizarCotizacion } from "@/lib/cotizaciones-admin.server";
import { parseId, parseUpdateInput } from "@/lib/cotizaciones-admin-shared";

// notas (5000) + el resto de campos caben con holgura en 16 KB.
const MAX_BODY_CHARS = 16 * 1024;

const STATUS = { not_found: 404, conflict: 409, forbidden: 403, invalid: 400 } as const;

// POST /api/admin/cotizaciones/:id — cambia estado, responsable y/o notas.
// Sesión + Origin + límite (requireAdminApi); el rol se verifica dentro de
// actualizarCotizacion, en el servidor, en cada acción.
async function handlePost(request: Request, rawId: string): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true });
  if (auth instanceof Response) return auth;

  const id = parseId(rawId);
  const input = parseUpdateInput(await readJsonBody(request, MAX_BODY_CHARS));
  if (id === null || input === null) return adminJson({ error: "invalid_request" }, 400);

  try {
    const result = await actualizarCotizacion(auth.user, id, input, auth.ip);
    if (!result.ok) return adminJson({ error: result.error }, STATUS[result.error]);
    return adminJson({ status: "ok", ...result });
  } catch (error) {
    logAdminError("api/admin/cotizaciones/:id", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/cotizaciones/$id")({
  server: {
    handlers: {
      POST: async ({ request, params }) => handlePost(request, params.id),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
