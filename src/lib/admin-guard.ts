import { redirect } from "@tanstack/react-router";
import { getAdminSession } from "./admin-session.server";

/**
 * Verifica la sesión en el SERVIDOR (SSR y navegación del cliente). Si la cuenta usa una
 * contraseña temporal, solo se permite /admin/mi-cuenta hasta cambiarla.
 * Las dos funciones no toman parámetros para poder usarlas directamente como `beforeLoad`.
 */
async function verificarSesion(allowPasswordChange: boolean) {
  const user = await getAdminSession();
  if (!user) throw redirect({ to: "/admin/login" });
  if (user.debe_cambiar_password === 1 && !allowPasswordChange) {
    throw redirect({ to: "/admin/mi-cuenta" });
  }
  return { user };
}

/** `beforeLoad` de las páginas del panel: sin sesión válida redirige al login. */
export async function requirePanelSession() {
  return verificarSesion(false);
}

/** `beforeLoad` de /admin/mi-cuenta: permite el cambio obligatorio de contraseña. */
export async function requirePasswordChangeSession() {
  return verificarSesion(true);
}

export const PANEL_HEAD = (title: string) => ({
  meta: [{ title: `${title} | TELCOBRAS` }, { name: "robots", content: "noindex, nofollow" }],
});
