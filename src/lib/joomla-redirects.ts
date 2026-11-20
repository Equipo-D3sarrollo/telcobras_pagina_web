/**
 * Redirecciones del sitio Joomla al que sustituye esta app. Se aplican antes del router
 * (ver `src/server.ts`) y solo responden para `/index.php*` y `/administrator*`.
 * El resto de rutas quedan intactas.
 */

export type JoomlaAction = { status: 301; location: string } | { status: 404 };

const SPAGEBUILDER_ANCHORS: Record<string, string> = {
  "104": "/",
  "98": "/#nosotros",
  "99": "/#servicios",
  "100": "/#proyectos",
  "107": "/#proyectos",
  "103": "/#contacto",
};

function isJoomlaSitePath(pathname: string): boolean {
  return pathname === "/index.php" || pathname.startsWith("/index.php/");
}

function isJoomlaAdminPath(pathname: string): boolean {
  return pathname === "/administrator" || pathname.startsWith("/administrator/");
}

/** Acción para una URL antigua, o `null` si la URL no es del sitio Joomla. */
export function joomlaAction(url: URL): JoomlaAction | null {
  const pathname = url.pathname.toLowerCase();

  // El admin de Joomla no se redirige: se oculta con 404.
  if (isJoomlaAdminPath(pathname)) return { status: 404 };

  if (!isJoomlaSitePath(pathname)) return null;

  // Ruta amigable de contacto; se acepta barra final y query adicional.
  if (pathname === "/index.php/contacto" || pathname === "/index.php/contacto/") {
    return { status: 301, location: "/#contacto" };
  }

  // Se comparan solo los parámetros que identifican la página; el orden y los demás
  // parámetros (Itemid, lang, catid, ...) son indiferentes.
  const { searchParams } = url;
  const option = searchParams.get("option");
  const view = searchParams.get("view");
  const id = searchParams.get("id");

  if (option === "com_sppagebuilder" && view === "page" && id) {
    const location = SPAGEBUILDER_ANCHORS[id];
    if (location) return { status: 301, location };
  }

  if (option === "com_content" && view === "article" && id === "62") {
    return { status: 301, location: "/politica-de-privacidad" };
  }

  return { status: 301, location: "/" };
}

/** Igual que `joomlaAction`, pero devuelve la Response lista para el servidor. */
export function joomlaResponse(url: URL): Response | null {
  const action = joomlaAction(url);
  if (!action) return null;

  if (action.status === 404) {
    return new Response(null, {
      status: 404,
      statusText: "Not Found",
      headers: { "cache-control": "no-store" },
    });
  }

  return new Response(null, {
    status: 301,
    statusText: "Moved Permanently",
    headers: { location: action.location },
  });
}
