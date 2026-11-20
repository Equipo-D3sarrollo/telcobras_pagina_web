import { createFileRoute } from "@tanstack/react-router";
import {
  adminJson,
  checkAdminActionLimit,
  logAdminError,
  requireAdminApi,
} from "@/lib/admin-api.server";
import { registrarAvisoReenviado } from "@/lib/cotizaciones-admin.server";
import { datosAvisoPorId, enviarAvisoCotizacion } from "@/lib/cotizaciones-mail.server";
import { parseId } from "@/lib/cotizaciones-admin-shared";

// POST /api/admin/cotizaciones/:id/aviso — reenvía el aviso a contabilidad.
// Sesión + rol de administrador + Origin + límite genérico y propio (10/15 min).
async function handlePost(request: Request, rawId: string): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true, adminOnly: true });
  if (auth instanceof Response) return auth;

  const limite = checkAdminActionLimit(request, auth.user, "reenviar_aviso");
  if (limite) return limite;

  const id = parseId(rawId);
  if (id === null) return adminJson({ error: "invalid_request" }, 400);

  try {
    const datos = await datosAvisoPorId(id);
    if (!datos) return adminJson({ error: "not_found" }, 404);
    // Las cotizaciones creadas a mano en el panel nunca generan este aviso.
    if (datos.origen !== "formulario_web") {
      return adminJson({ error: "invalid_request" }, 400);
    }

    const resultado = await enviarAvisoCotizacion(datos);
    if (!resultado.ok) return adminJson({ error: "mail_unavailable" }, 503);

    await registrarAvisoReenviado(auth.user, id, auth.ip);
    return adminJson({ status: "ok" });
  } catch (error) {
    logAdminError("api/admin/cotizaciones/:id/aviso", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/cotizaciones/$id/aviso")({
  server: {
    handlers: {
      POST: async ({ request, params }) => handlePost(request, params.id),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
