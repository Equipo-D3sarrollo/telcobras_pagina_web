import { createFileRoute } from "@tanstack/react-router";
import { adminJson, logAdminError, readJsonBody, requireAdminApi } from "@/lib/admin-api.server";
import { cambiarPasswordPropio } from "@/lib/usuarios-admin.server";
import { parseCambiarPassword } from "@/lib/usuarios-admin-shared";

const MAX_BODY_CHARS = 4 * 1024;

// POST /api/admin/mi-cuenta — cambia la propia contraseña y limpia el aviso de contraseña temporal.
async function handlePost(request: Request): Promise<Response> {
  const auth = await requireAdminApi(request, { mutation: true });
  if (auth instanceof Response) return auth;

  const input = parseCambiarPassword(await readJsonBody(request, MAX_BODY_CHARS));
  if (!input) return adminJson({ error: "invalid_request" }, 400);

  try {
    const result = await cambiarPasswordPropio(auth.user, input, auth.ip);
    if (!result.ok) return adminJson({ error: "invalid_credentials" }, 400);
    return adminJson({ status: "ok" });
  } catch (error) {
    logAdminError("api/admin/mi-cuenta", error);
    return adminJson({ error: "unavailable" }, 503);
  }
}

export const Route = createFileRoute("/api/admin/mi-cuenta")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      ANY: async () => adminJson({ error: "method_not_allowed" }, 405, [["allow", "POST"]]),
    },
  },
});
