import { createFileRoute } from "@tanstack/react-router";
import {
  adminJson,
  checkAdminActionLimit,
  logAdminError,
  readJsonBody,
  requireAdminApi,
} from "@/lib/admin-api.server";
import { parseId } from "@/lib/cotizaciones-admin-shared";
import {
  cambiarEstadoUsuario,
  desbloquearUsuario,
  editarUsuario,
  reiniciarPassword,
  type ResultadoAccion,
} from "@/lib/usuarios-admin.server";
import { parseAccion, parseEditarUsuario } from "@/lib/usuarios-admin-shared";

const MAX_BODY_CHARS = 8 * 1024;
const STATUS = { not_found: 404, conflict: 409, forbidden: 403 } as const;

// POST /api/admin/usuarios/:id — editar, activar, desactivar, desbloquear o reiniciar contraseña.
// El rol se comprueba de nuevo en usuarios-admin.server, en cada acción.
async function handlePost(request: Request, rawId: string): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true, adminOnly: true });
  if (auth instanceof Response) return auth;

  const id = parseId(rawId);
  const body = (await readJsonBody(request, MAX_BODY_CHARS)) as Record<string, unknown> | null;
  const accion = parseAccion(body?.["accion"]);
  if (id === null || !accion || !body) return adminJson({ error: "invalid_request" }, 400);

  try {
    let result: ResultadoAccion;
    switch (accion) {
      case "editar": {
        const input = parseEditarUsuario(body);
        if (!input) return adminJson({ error: "invalid_request" }, 400);
        result = await editarUsuario(auth.user, id, input, auth.ip);
        break;
      }
      case "activar":
        result = await cambiarEstadoUsuario(auth.user, id, true, auth.ip);
        break;
      case "desactivar":
        result = await cambiarEstadoUsuario(auth.user, id, false, auth.ip);
        break;
      case "desbloquear":
        result = await desbloquearUsuario(auth.user, id, auth.ip);
        break;
      case "reiniciar_password": {
        const limitada = checkAdminActionLimit(request, auth.user, "reiniciar_password");
        if (limitada) return limitada;
        result = await reiniciarPassword(auth.user, id, auth.ip);
        break;
      }
    }
    if (!result.ok) {
      const { error, mensaje } = result;
      return adminJson({ error, ...(mensaje ? { mensaje } : {}) }, STATUS[error]);
    }
    return adminJson({
      status: "ok",
      ...(result.passwordTemporal ? { passwordTemporal: result.passwordTemporal } : {}),
    });
  } catch (error) {
    logAdminError("api/admin/usuarios/:id", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/usuarios/$id")({
  server: {
    handlers: {
      POST: async ({ request, params }) => handlePost(request, params.id),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
