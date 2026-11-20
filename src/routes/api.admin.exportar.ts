import { createFileRoute } from "@tanstack/react-router";
import {
  adminJson,
  checkAdminActionLimit,
  logAdminError,
  readJsonBody,
  requireAdminApi,
} from "@/lib/admin-api.server";
import { exportarCotizaciones } from "@/lib/cotizaciones-admin.server";
import { MAX_EXPORTAR, parseListQuery } from "@/lib/cotizaciones-admin-shared";

const MAX_BODY_CHARS = 4 * 1024;

// POST /api/admin/exportar — CSV de las cotizaciones no eliminadas, con los filtros de la lista.
// Responde el archivo (no JSON) cuando termina bien; errores en JSON con mensaje genérico.
async function handlePost(request: Request): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true, adminOnly: true });
  if (auth instanceof Response) return auth;

  // Límite dedicado: 10 exportaciones cada 15 minutos por IP y por usuario de la sesión.
  const limitada = checkAdminActionLimit(request, auth.user, "exportar");
  if (limitada) return limitada;

  const filtros = parseListQuery(await readJsonBody(request, MAX_BODY_CHARS));
  try {
    const result = await exportarCotizaciones(filtros, auth.user, auth.ip);
    if (!result.ok) {
      if (result.error === "too_many") {
        return adminJson(
          {
            error: "too_many",
            maximo: MAX_EXPORTAR,
            mensaje: `La exportación supera el límite de ${MAX_EXPORTAR.toLocaleString("es-CO")} filas (${result.total?.toLocaleString("es-CO") ?? "más"}). Ajusta los filtros e inténtalo de nuevo.`,
          },
          422,
        );
      }
      return adminJson({ error: result.error }, 403);
    }

    return new Response(result.csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${result.nombreArchivo}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    logAdminError("api/admin/exportar", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/exportar")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
