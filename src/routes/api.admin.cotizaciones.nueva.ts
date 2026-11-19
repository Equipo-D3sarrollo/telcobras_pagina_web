import { createFileRoute } from "@tanstack/react-router";
import { adminJson, logAdminError, readJsonBody, requireAdminApi } from "@/lib/admin-api.server";
import { crearCotizacionManual } from "@/lib/cotizaciones-admin.server";

const MAX_BODY_CHARS = 16 * 1024;

// POST /api/admin/cotizaciones/nueva — crea una solicitud a mano (origen «manual», estado
// «nueva»). Mismas validaciones que el formulario público; la casilla de autorización
// (consentimiento) es obligatoria.
async function handlePost(request: Request): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true });
  if (auth instanceof Response) return auth;

  const body = await readJsonBody(request, MAX_BODY_CHARS);
  try {
    const result = await crearCotizacionManual(auth.user, body);
    if (!result.ok) return adminJson({ error: "invalid_request" }, 400);
    return adminJson({ status: "ok", id: result.id }, 201);
  } catch (error) {
    logAdminError("api/admin/cotizaciones/nueva", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/cotizaciones/nueva")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
