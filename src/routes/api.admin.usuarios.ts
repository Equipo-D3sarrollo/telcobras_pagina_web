import { createFileRoute } from "@tanstack/react-router";
import {
  adminJson,
  checkAdminActionLimit,
  logAdminError,
  readJsonBody,
  requireAdminApi,
} from "@/lib/admin-api.server";
import { crearUsuario } from "@/lib/usuarios-admin.server";
import { parseCrearUsuario } from "@/lib/usuarios-admin-shared";

const MAX_BODY_CHARS = 8 * 1024;

// POST /api/admin/usuarios — crea una cuenta con contraseña temporal (debe cambiarse al entrar).
async function handlePost(request: Request): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true, adminOnly: true });
  if (auth instanceof Response) return auth;

  const limitada = checkAdminActionLimit(request, auth.user, "crear_usuario");
  if (limitada) return limitada;

  const input = parseCrearUsuario(await readJsonBody(request, MAX_BODY_CHARS));
  if (!input) return adminJson({ error: "invalid_request" }, 400);

  try {
    const result = await crearUsuario(auth.user, input, auth.ip);
    if (!result.ok)
      return adminJson({ error: result.error }, result.error === "conflict" ? 409 : 403);
    return adminJson({ status: "ok", id: result.id }, 201);
  } catch (error) {
    logAdminError("api/admin/usuarios", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/usuarios")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
