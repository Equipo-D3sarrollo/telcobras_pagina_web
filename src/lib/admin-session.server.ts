import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/**
 * Usuario de la sesión del panel, verificado EN EL SERVIDOR (cookie → SHA-256 → fila vigente
 * en `sesiones`). Lo usan los `beforeLoad` de /admin y /admin/login: se ejecuta en el servidor
 * tanto en la carga directa (SSR) como en la navegación del cliente (llamada RPC). Si falla
 * la base, devuelve `null` (se trata como sin sesión: falla cerrado).
 * El import de auth.server es dinámico para que no llegue al bundle del cliente.
 */
export const getAdminSession = createServerFn({ method: "POST" }).handler(async () => {
  const { getSessionUser, readSessionToken } = await import("./auth.server");
  try {
    return await getSessionUser(readSessionToken(getRequestHeader("cookie")));
  } catch (error) {
    const { code, errno } = (typeof error === "object" && error !== null ? error : {}) as Record<
      string,
      unknown
    >;
    console.error("[admin] No se pudo verificar la sesión.", { code, errno });
    return null;
  }
});
