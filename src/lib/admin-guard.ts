import { redirect } from "@tanstack/react-router";
import { getAdminSession } from "./admin-session.server";

/**
 * `beforeLoad` común de las páginas del panel: la sesión se verifica en el SERVIDOR (SSR y
 * navegación del cliente). Sin sesión válida redirige al login antes de renderizar nada.
 */
export async function requirePanelSession() {
  const user = await getAdminSession();
  if (!user) throw redirect({ to: "/admin/login" });
  return { user };
}

export const PANEL_HEAD = (title: string) => ({
  meta: [{ title: `${title} | TELCOBRAS` }, { name: "robots", content: "noindex, nofollow" }],
});
