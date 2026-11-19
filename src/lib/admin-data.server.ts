import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseStatus } from "@tanstack/react-start/server";
import { parseId, parseListQuery } from "./cotizaciones-admin-shared";

/**
 * Lecturas del panel (lista y detalle) como funciones de servidor: se ejecutan siempre en el
 * servidor, con sesión válida verificada contra la base en CADA llamada (SSR o navegación del
 * cliente). Sin sesión responden 401 y las páginas redirigen al login. Los imports de las
 * capas de servidor son dinámicos para que no lleguen al bundle del cliente.
 */

async function sessionUser() {
  const { getSessionUser, readSessionToken } = await import("./auth.server");
  const request = getRequest();
  return getSessionUser(readSessionToken(request.headers.get("cookie")));
}

function logError(error: unknown) {
  const { code, errno } = (typeof error === "object" && error !== null ? error : {}) as Record<
    string,
    unknown
  >;
  console.error("[admin/datos] Error.", { code, errno });
}

export const listarCotizacionesFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => parseListQuery(data))
  .handler(async ({ data }) => {
    try {
      if (!(await sessionUser())) {
        setResponseStatus(401);
        return { ok: false, error: "unauthorized" } as const;
      }
      const { listarCotizaciones } = await import("./cotizaciones-admin.server");
      return { ok: true, ...(await listarCotizaciones(data)) } as const;
    } catch (error) {
      logError(error);
      setResponseStatus(503);
      return { ok: false, error: "unavailable" } as const;
    }
  });

export const obtenerCotizacionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => ({ id: parseId(data) }))
  .handler(async ({ data }) => {
    try {
      const user = await sessionUser();
      if (!user) {
        setResponseStatus(401);
        return { ok: false, error: "unauthorized" } as const;
      }
      if (data.id === null) return { ok: false, error: "not_found" } as const;
      const { obtenerDetalle } = await import("./cotizaciones-admin.server");
      const { getClientIp } = await import("./rate-limit");
      const detalle = await obtenerDetalle(user, data.id, getClientIp(getRequest()));
      if (!detalle) {
        setResponseStatus(404);
        return { ok: false, error: "not_found" } as const;
      }
      return { ok: true, detalle, rol: user.rol, usuarioId: user.id } as const;
    } catch (error) {
      logError(error);
      setResponseStatus(503);
      return { ok: false, error: "unavailable" } as const;
    }
  });
