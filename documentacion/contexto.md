# Contexto técnico del proyecto TELCOBRAS

Este documento está pensado como punto de entrada para una persona desarrolladora o
una inteligencia artificial que deba continuar el proyecto. Resume la arquitectura,
los módulos, los flujos de datos, las integraciones, las convenciones y los problemas
conocidos. Debe actualizarse cuando cambien la arquitectura o las capacidades descritas.

> Última revisión integral: **26-10-2026**. Auditoría de seguridad, dependencias, pruebas,
> accesibilidad y páginas legales; se ejecutaron `tsc`, `eslint`, `npm audit`, `npm run build`
> y una verificación en navegador de `/terminos-de-servicio` y `/sla`. Ver sección 11
> («Auditoría 26-10-2026»). La revisión anterior (22-10-2026) cubrió el pipeline de
> CSS/Tailwind, el build de Nitro/Cloudflare y el estado de Git; ver secciones 7 y 9.

## 1. Instrucciones para quien continúe el proyecto

- Leer este documento y `AGENTS.md` antes de modificar código.
- El proyecto está conectado a AI Studio. No reescribir historia Git ya publicada:
  no hacer force-push, rebase, amend ni squash de commits publicados.
- Revisar `git status` antes de editar. Puede haber cambios locales no relacionados;
  no descartarlos ni incluirlos accidentalmente.
- `src/routeTree.gen.ts` es generado por TanStack Router. No modificarlo manualmente.
- Mantener la URL y cualquier credencial de Make exclusivamente en configuración de
  servidor. Nunca leerlas a la consola, pegarlas en documentación ni incluirlas en
  variables `VITE_*`, código cliente o capturas.
- Los cambios visuales del sitio suelen hacerse en los componentes de `src/components/`
  y los estilos globales en `src/styles.css`.
- Ejecutar `npm exec eslint -- <archivos-modificados>` y `npm run build` cuando
  corresponda. Hay archivos de pruebas/configuración vacíos en el árbol de trabajo,
  pero no constituyen una suite ejecutable ni hay scripts `test` en `package.json`.
- Mantener la interfaz, mensajes y documentación del producto principalmente en español.
- No ejecutar `npm run build` con el servidor de desarrollo activo: en Windows Vite
  vigila `.output/` y se cae con `EBUSY`. Detener el servidor, compilar y volver a
  levantarlo.
- El artefacto desplegable canónico es **`.output/`** (Nitro/Cloudflare). `dist/` es un
  build antiguo (7-10-2026) y no debe desplegarse; si producción sirve `dist/` o HTML
  cacheado, el diseño puede quedar desfasado aunque el código fuente sea correcto.
- Reconstruir siempre antes de desplegar si se tocó `src/styles.css`,
  `src/routes/__root.tsx`, `src/server.ts` o cualquier componente: el build no se
  actualiza solo. El build actual de `.output/` es anterior a la última edición de
  `src/server.ts`; ver sección 9.
- No existe `index.html` ni `src/main.tsx`: el documento HTML lo genera `RootShell` en
  `src/routes/__root.tsx`. El CSS global se importa con `import appCss from
  "../styles.css?url"` y se inyecta en `head.links`; no añadir otra hoja global.
- En Windows, detener la tarea `npm run dev` puede dejar vivo el proceso hijo
  `node …vite.js dev`. Si Vite avisa «Port 8080 is in use» y arranca en 8081/8082,
  hay instancias huérfanas: cerrarlas (por PID) y dejar una sola. Varias instancias
  a la vez hacen muy lenta la hidratación.
- El equipo de desarrollo tiene desactivados los «Efectos de animación» de Windows,
  por lo que Chrome/Edge reportan `prefers-reduced-motion: reduce`. Ver la sección
  «Convenciones de movimiento» antes de tocar animaciones.

## 2. Resumen del producto

TELCOBRAS S.A.S. es un sitio corporativo de una sola página que presenta servicios
de conectividad, ciberseguridad, colaboración, nube híbrida e inteligencia artificial.
También muestra información institucional, proyectos, diferenciales, aliados, datos
de contacto y un formulario de cotización/diagnóstico.

La ruta visual principal es `/`. Las secciones se enlazan mediante anclas HTML
(por ejemplo `#inicio`, `#servicios` y `#contacto`). El chatbot y el botón de WhatsApp
se montan globalmente; el botón para volver al inicio se monta en la página principal.

### Estado actual del proyecto

- El sitio ya dispone de un shell global en `src/routes/__root.tsx` con gestión de
  accesibilidad, idioma, cookie banner, chatbot flotante y botón de WhatsApp.
- La ruta interna `/politica-de-privacidad` quedó implementada en
  `src/routes/politica-de-privacidad.tsx` y está conectada con `PRIVACY_POLICY_URL`.
- La política es bilingüe (`es`/`en`) y contiene una sección detallada de eliminación
  de datos personales con referencia a la Ley 1581/2012 y al RGPD.
- Los enlaces legales y el consentimiento del formulario apuntan a la política local,
  no a un enlace externo de la web corporativa.
- El formulario de contacto y el footer incluyen controles de seguridad básicos: IDs
  por campo, límites de longitud, honeypot y validación del lado servidor en
  `src/routes/api.contacto.ts`.
- Cloudflare Turnstile está implementado en el formulario de contacto. El widget vive
  en `src/components/TurnstileWidget.tsx` y se monta desde `ContactAndFooter.tsx`; el
  token se envía como `turnstile_token` y el servidor lo valida contra
  `siteverify` antes de persistir en Supabase.
- El endpoint `/api/contacto` aplica limitación de tasa por IP (5 envíos por ventana
  de 10 minutos) y responde `429` con cabecera `retry-after`. El contador es en
  memoria del proceso, por lo que no es un límite distribuido entre instancias.
- La higiene de errores evita exponer mensajes crudos de Supabase: el endpoint
  devuelve códigos genéricos (`insert_failed`, `internal_error`, etc.) y solo registra
  el código interno en logs. `src/server.ts` también normaliza errores SSR
  catastróficos de rutas `/api/*` a `{ "error": "internal_error" }`.
- Las rutas legales `/terminos-de-servicio` y `/sla` ya están creadas y registran sus
  propias rutas en el árbol de TanStack (`src/routes/terminos-de-servicio.tsx` y
  `src/routes/sla.tsx`). Ya no son marcadores: ambas renderizan el documento completo
  en ES/EN con el componente compartido `src/components/LegalDocument.tsx` (encabezado,
  índice «Contenido» con anclas, secciones, tablas desplazables y enlaces «Volver al
  inicio»), con metadatos SEO/Open Graph y `canonical` propios. El contenido vive en
  `src/lib/terms-content.ts` (15 secciones) y `src/lib/sla-content.ts` (10 secciones);
  los tipos compartidos están en `src/lib/legal-types.ts`. Los valores numéricos del
  SLA se centralizan en `SLA_VALUES` (`src/lib/sla-content.ts`) y son una **propuesta
  pendiente de aprobación de gerencia y revisión jurídica**: no cambiarlos ni la
  redacción sin esa aprobación.
- Todos los enlaces legales del footer y del banner de cookies usan `<Link>` de
  `@tanstack/react-router` (navegación SPA sin recarga completa). Las rutas internas se
  resuelven con las constantes `PRIVACY_POLICY_URL`, `TERMS_OF_SERVICE_URL` y
  `SLA_URL` de `src/lib/telcobras-data.ts`. Ningún enlace legal apunta a un dominio
  externo.
- El SEO técnico está implementado en las cuatro rutas públicas: metadatos por ruta
  (`title`, `description`, `canonical`), etiquetas Open Graph y Twitter Card
  (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale`,
  `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) y datos
  estructurados JSON-LD de tipo `Organization` en la landing (`script:ld+json` de
  TanStack Router, que se serializa a `<script type="application/ld+json">` en el
  `<head>`). El JSON-LD consume `RAZON_SOCIAL`, `LOGO_URL`, `CONTACT` y `SOCIAL_LINKS`
  de `src/lib/telcobras-data.ts` e incluye `name`, `url`, `logo`, `telephone`,
  `address` y `sameAs`.
- Títulos y descripciones (27-10-2026): palabra clave al inicio y la marca al final,
  con títulos de 50-60 caracteres y descripciones de 140-160. La landing no define
  `title`/`description`/`og`/`twitter` propios: los pone el `head` raíz desde
  `metadata` de `translations.ts` según el idioma de la cookie (una sola fuente para el
  SSR y para `LocalizedMetadata`). La política de privacidad usa `metaTitle` y
  `metaDescription` de `policyCopy` (separados del título y la introducción visibles).
  Términos y SLA usan `metaTitle`/`description` de `terms-content.ts`/`sla-content.ts`.
- Estructura de la landing: un solo `<main>` (de Hero a Contacto/Ubicación), con
  `HeaderNav` antes y `SiteFooter` después, y un solo `<h1>` (en `HeroAndMetrics`).
- `<html lang>` vale `es-CO` en español y `en` en inglés (`htmlLang()` en
  `src/lib/accessibility-preferences.ts`); se usa también en el `lang` de las páginas
  legales, los mensajes del chatbot y la página de error. La preferencia y la cookie
  `telcobras_a11y` siguen guardando `es`/`en`.
- Iconos: `public/favicon.ico` (32×32, más 16 y 48) y `public/apple-touch-icon.png`
  (180×180, fondo blanco), generados a partir del isotipo (las tres velas) de
  `LOGO_URL` y enlazados en `head.links` de `__root.tsx`. No hay `icon.svg` porque no
  existe una versión vectorial del logo; añadirlo cuando se tenga el SVG oficial.
- Imágenes (27-10-2026): todas son propias, en `public/images/`, como AVIF y WebP en
  varios anchos (ver «Imágenes» en la sección 10). Se pintan con
  `src/components/ResponsivePicture.tsx` (`<picture>` con `<source type="image/avif">`
  y `<img>` WebP, `srcset` y `sizes` según el ancho real, y `width`/`height` para no
  causar CLS). La primera foto del hero usa `loading="eager"` + `fetchPriority="high"`
  y la landing la precarga con `<link rel="preload" as="image" type="image/avif"
  imagesrcset imagesizes>` (`HERO_IMAGE_SIZES` es la misma cadena en el preload y en el
  `<picture>`, para que el navegador no la descargue dos veces). Las demás son
  `loading="lazy"`.
- `public/sitemap.xml` está generado con las cuatro URLs públicas (`/`,
  `/politica-de-privacidad`, `/terminos-de-servicio`, `/sla`) bajo
  `https://telcobras.com`, con `<lastmod>` y código HTTP 200. `public/robots.txt`
  declara `Sitemap: https://telcobras.com/sitemap.xml`.
- El componente `CookieBanner` persiste la elección del usuario en `localStorage`
  bajo `telcobras_cookie_consent` y no vuelve a renderizar cuando ya existe la clave.
  El botón «Preferencias de cookies» del footer lo vuelve a abrir con el panel de
  preferencias y la elección guardada (evento de `src/lib/cookie-consent.ts`).
- Consentimiento explícito (27-10-2026): el banner pide decidir («Usamos cookies
  esenciales… y, si lo aceptas, cookies opcionales…»), ya no dice «al navegar
  aceptas». Lo opcional solo se activa con `nonEssential: true`
  (`hasNonEssentialConsent()` / `useNonEssentialConsent()`):

  | Almacenamiento | Sin aceptar opcionales | Con opcionales aceptadas |
  |---|---|---|
  | `telcobras_cookie_consent` (localStorage) | se guarda al decidir (esencial) | igual |
  | `telcobras_session_id` (localStorage, chat) | solo al enviar el primer mensaje | igual |
  | Cookie `telcobras_a11y` (preferencias) | de sesión, solo si se cambia una opción | persistente, 1 año |
  | Mapa de Google (cookies de terceros) | no se carga; recuadro con «Ver mapa» | se carga |

  Al cambiar la elección, la cookie de preferencias existente pasa a persistente o a
  sesión en el momento. Turnstile no deja cookies en el dominio; las fuentes son propias.
- El menú de accesibilidad y la preferencia de idioma persisten en una cookie y se
  aplican también durante SSR para evitar flashes de contenido con idioma incorrecto.
- La documentación legal debe revisarse con el responsable del tratamiento antes de
  considerarse una política aprobada para publicación formal.
- El pipeline de CSS/Tailwind está verificado de punta a punta (22-10-2026): el CSS
  global se importa en `src/routes/__root.tsx:14`, se enlaza desde `head.links`
  (`:120-127`) dentro de `<head>`, Tailwind v4 lo genera en
  `.output/public/assets/styles-<hash>.css` y el mismo hash aparece en los bundles
  cliente y SSR. No se encontró una «fuga de estilos» en el código ni en el build.
- El único desfase real está en los artefactos: `dist/` es un build del 7-10-2026 con
  otro CSS (`styles-CwhTlhtd.css`) y el deploy apunta a `.output/`
  (`.wrangler/deploy/config.json` → `.output/server/wrangler.json`). Reconstruir y
  desplegar solo `.output/`; ver secciones 9 y 11.

## 3. Stack y ejecución

- React 19 y TypeScript 5.8 (modo estricto).
- TanStack Start 1.168.32 y TanStack Router 1.170.18 (rutas basadas en archivos).
- Vite 8.1.5 como servidor de desarrollo y compilador; Rolldown fijado a 1.2.1 por
  `overrides` en `package.json`.
- Tailwind CSS 4 (`package.json` declara `^4.2.1`; el lock/build resuelve 4.3.3),
  `tw-animate-css`, Radix UI y `lucide-react`.
- TanStack Query está configurado en el contexto del router.
- Nitro 3 (beta) genera el despliegue para Cloudflare con preset `cloudflare-module`;
  `nodeCompat` está habilitado.
- Tipografía principal: Nunito autoalojada en `public/fonts/` (ver «Tipografía» en la
  sección 7); no se usa Google Fonts.
- `vitest`, `jsdom`, Testing Library, `axe-core` y Playwright están instalados, pero
  sus archivos de configuración y pruebas siguen vacíos (0 bytes); no hay suite
  ejecutable ni script `test`.

### Comandos del proyecto

```powershell
npm install                     # ejecuta prepare -> scripts/install-hooks.mjs
npm run dev
npm run build                   # cliente + servidor -> .output/
npm run build:dev               # build con modo development
npm run preview
npm run lint                    # eslint .
npm run format                  # prettier --write .
npm run secrets:scan            # gitleaks sobre todo el historial
npm exec eslint -- src/components/NombreComponente.tsx
```

`npm run dev` muestra en consola la URL local disponible, habitualmente
`http://localhost:8080/`. No abrir un HTML local directamente: la aplicación requiere
el servidor de desarrollo. `npm run build` compila cliente y servidor y genera
artefactos en `.output/`; `dist/` es un directorio legado de un build anterior y no es
el artefacto de despliegue.

`npm install` activa el hook de pre-commit (`core.hooksPath=.githooks`) mediante
`prepare`. `npm run secrets:scan` requiere `gitleaks` instalado en el `PATH`. La CI
repite el escaneo en `.github/workflows/gitleaks.yml`.

No hay script `test` en `package.json` ni se encontró una suite de pruebas del producto.
Usar lint, build, `tsc --noEmit` y comprobaciones manuales/navegador hasta que se
agreguen pruebas.

## 4. Estructura del repositorio

```text
.
├── .github/workflows/gitleaks.yml  # CI: escaneo de secretos en todo el historial
├── .githooks/pre-commit            # Hook local: gitleaks sobre archivos staged
├── .gitattributes                  # EOL LF para hooks, CI y configuración
├── .gitleaks.toml                  # Reglas de gitleaks + allowlist de artefactos
├── documentacion/
│   └── contexto.md                 # Esta guía de traspaso
├── e2e/                            # Placeholder de Playwright (spec vacío)
├── public/                         # Recursos estáticos servidos desde /
├── scripts/
│   └── install-hooks.mjs           # Activa core.hooksPath en npm install
├── src/
│   ├── components/                 # Secciones y controles de la interfaz
│   │   └── ui/                     # Primitivas reutilizables estilo shadcn/Radix
│   ├── hooks/                      # Hooks compartidos (móvil, rotación de resaltado)
│   ├── lib/                        # Datos, preferencias, utilidades y manejo de errores
│   ├── routes/                     # Rutas TanStack Start
│   ├── routeTree.gen.ts            # Generado automáticamente; no editar
│   ├── router.tsx                  # Crea el router (sin React Query desde el 28-10-2026)
│   ├── server.ts                   # Adaptador SSR, CSP y normalización de errores
│   ├── start.ts                    # Middleware de servidor y CSRF para server functions
│   └── styles.css                  # Tema, tokens y estilos globales/animaciones
├── vite.config.ts                  # Configuración del wrapper de Vite/Nitro/Cloudflare
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # TypeScript estricto y alias @/*
├── eslint.config.js                # ESLint, React Hooks y Prettier
├── components.json                 # Configuración de componentes UI
└── README.md                       # Inicio rápido y contrato del endpoint de chat
```

`node_modules/` y `.output/` son dependencias/artefactos generados; no editar ni
versionar `.output/`. `dist/` también está ignorado, pero es un build legado
(7-10-2026): el artefacto canónico es `.output/`. `*.local` está ignorado por Git;
`.env.local` puede contener configuración privada, así que no debe abrirse ni
reproducirse en informes. `.gitignore` ya contempla `.env`, `.env.*` y `.dev.vars*`
con excepciones para `*.example`, aunque hoy no existe un `.env.example` versionado.

### Archivos críticos del negocio y la integración

- `src/lib/telcobras-data.ts`: contiene datos corporativos oficiales, enlaces de
  redes sociales, URL interna de privacidad y datos de contacto.
- `src/components/ContactAndFooter.tsx`: exporta `ContactSection` (formulario,
  consentimiento legal, mapa y ubicación) y `SiteFooter` (footer semántico, contacto,
  redes sociales y enlaces legales).
- `src/components/CookieBanner.tsx`: aceptación/rechazo de cookies y persistencia en
  `localStorage`; se reabre desde el footer.
- `src/lib/cookie-consent.ts`: clave y lectura del consentimiento guardado, y
  `openCookiePreferences()` / `onOpenCookiePreferences()` para reabrir el banner.
- `src/components/TurnstileWidget.tsx`: widget de Cloudflare Turnstile usado por el
  formulario de contacto (carga explícita del script, callback, reset y errores). El
  script solo se descarga cuando el formulario está a menos de ~600 px de la pantalla
  (`IntersectionObserver` con `rootMargin: "600px 0px"`).
- `src/routes/api.contacto.ts`: endpoint de contacto usado por el formulario. Valida
  honeypot, longitudes de campos, estructura de payload, Turnstile y limitación de tasa
  por IP antes de persistir en Supabase.
- `src/routes/api.chat.ts`: integración con Make/WhatsApp y respuesta del chatbot.
- `src/lib/translations.ts`: catálogos ES/EN para UI, SEO, formulario y chatbot.
- `src/lib/accessibility-preferences.ts`: configuración de idioma/tema/tamaño y
  validación del almacenamiento local.
- `src/routes/politica-de-privacidad.tsx`: versión legal interna, bilingüe, con
  procedimiento detallado de eliminación de datos.
- `src/routes/terminos-de-servicio.tsx` y `src/routes/sla.tsx`: páginas legales
  bilingües que renderizan `LegalDocument` con el contenido de
  `src/lib/terms-content.ts` y `src/lib/sla-content.ts` (valores del SLA en
  `SLA_VALUES`, pendientes de aprobación).
- `src/components/LegalDocument.tsx` y `src/lib/legal-types.ts`: componente y tipos
  compartidos de las páginas legales; el contenido se renderiza como texto, sin HTML.
- `src/routes/__root.tsx`: shell, metadatos, providers y montajes globales del sitio.

## 5. Composición de la aplicación y rutas

### `src/routes/index.tsx`

- Define la ruta `/` y metadatos SEO/Open Graph.
- Publica los datos estructurados JSON-LD de `Organization` usando la clave
  `script:ld+json` del array `meta` de TanStack Router: el router la serializa y la
  escapa como `<script type="application/ld+json">` dentro del `<head>` a través de
  `<HeadContent />`. No hace falta escribir el `<script>` a mano ni usar `dangerouslySetInnerHTML`.
  Los datos (`name`, `url`, `logo`, `telephone`, `address`, `sameAs`) salen de
  `src/lib/telcobras-data.ts`.
- Compone la landing en este orden: `HeaderNav`; dentro de `<main>`,
  `HeroAndMetrics`, `AboutAndValues`, `ServicesSection`, `LetyIaAndWhyUs` y
  `ContactSection`; después `SiteFooter` y `ScrollToTopButton`.
- El formulario y la ubicación están en `ContactSection`; el footer es `SiteFooter`
  (ambos en `ContactAndFooter.tsx`).

### `src/routes/__root.tsx`

- Es el shell de todas las rutas: `RootShell` define `<html>`, `<head>` con
  `<HeadContent />`, `<body>` con los children y `<Scripts />`; `RootComponent` monta
  `<Outlet />`, los providers y los controles globales.
- Importa el CSS global con `import appCss from "../styles.css?url"` (línea 14) y lo
  publica en `head.links` como `{ rel: "stylesheet", href: appCss }` (líneas 120-127).
  En el build, `appCss` resuelve a `/assets/styles-<hash>.css`; el mismo hash debe
  aparecer en el bundle cliente y en el SSR. No hay `index.html` ni `src/main.tsx`.
- Monta globalmente `AccessibilityMenu` (solo el botón; el panel se carga al abrirlo)
  y `WhatsAppFloatingButton` (enlace flotante a `wa.me` con el número comercial de
  `CONTACT`, definido en este archivo). `FloatingChatbot` y `CookieBanner` se cargan
  con `React.lazy` y se montan cuando el navegador queda libre tras la carga o con la
  primera interacción (`useIdleReady`, `src/hooks/use-idle-ready.ts`:
  `requestIdleCallback` con tope de 2 s, `setTimeout` donde no exista). En la primera
  visita el banner aparece en cuanto el navegador queda libre, después del LCP.
  «Preferencias de cookies» funciona aunque el banner aún no se haya cargado: la
  petición queda pendiente (`openCookiePreferences`) y el banner la atiende al montarse.
- La ruta raíz es `createRootRoute` sin contexto: React Query (`QueryClient`) se quitó
  el 28-10-2026 porque no había ningún `useQuery` (24 KiB menos en el chunk principal).
- En `head.links` precarga la Nunito normal autoalojada (`<link rel="preload"
  href="/fonts/nunito-latin-400-900.woff2" as="font" type="font/woff2" crossorigin>`) y
  enlaza `styles.css`. `head.links` es la forma de inyectar `<link>` en el `<head>` con
  TanStack Router; no duplicarlos como JSX dentro del `<body>`. Desde el 27-10-2026 no
  hay `preconnect` ni hoja de estilos de Google Fonts.
- Tiene los componentes raíz de error (`ErrorComponent`, con `reportVibeError`) y 404.
- El 404 (`NotFoundComponent`) ofrece dos salidas claras: «Ir al inicio» (`<Link to="/">`)
  y «Ver servicios» (`<Link to="/" hash="servicios">`, que produce `/#servicios` y
  desplaza a la sección de servicios). Los textos salen de `errors.home` y
  `errors.services` de `src/lib/translations.ts` (ES/EN).
- El loader raíz obtiene las preferencias de accesibilidad desde la cookie
  `telcobras_a11y` en el servidor y las aplica a los atributos de `<html>`, incluido
  `lang` (`es-CO` o `en`, vía `htmlLang()`), antes de renderizar. El idioma
  predeterminado es `es`.
- `src/components/CookieBanner.tsx` se monta desde el shell global. Guarda la elección
  en `localStorage` bajo `telcobras_cookie_consent` (esenciales siempre activas y una
  preferencia booleana para las no esenciales); si la clave existe, no vuelve a mostrar
  el banner, salvo que se pulse «Preferencias de cookies» en el footer, que lo abre con
  el panel de preferencias, la elección guardada y el foco en él. La elección se guarda
  con `saveCookieConsent()`, que avisa del cambio (evento y `storage` entre pestañas).
  Cualquier integración nueva que deje cookies de terceros debe condicionarse a
  `useNonEssentialConsent()`, como el mapa de Google.
- Si se añaden rutas, no eliminar `<Outlet />`.

### Preferencias de accesibilidad

- `src/lib/accessibility-preferences.ts` define el esquema, los valores por defecto y la
  validación de las preferencias recibidas desde la cookie.
- `src/lib/accessibility-preferences.server.ts` lee la cookie con las utilidades de
  petición de TanStack Start; el loader de la ruta raíz comparte el resultado con el
  shell SSR y la interfaz.
- `src/components/AccessibilityMenu.tsx` es el botón flotante inferior izquierdo; al
  abrirlo carga `src/components/AccessibilityPanel.tsx` (con `React.lazy`), con opciones
  de apariencia (sistema/claro/oscuro), tamaño de texto (100/125/150/200 %), idioma
  (español/inglés), modo daltonismo y restauración de valores predeterminados.
- `src/lib/accessibility-preferences-context.ts` y
  `src/lib/accessibility-preferences-provider.tsx` exponen las preferencias existentes
  al árbol React; no se debe crear un segundo estado de idioma.
- `src/lib/translations.ts` contiene los catálogos tipados `es` y `en`, agrupados por
  navegación, contenido, formulario, chatbot, accesibilidad, errores y metadatos. Los
  componentes consultan el catálogo mediante `useTranslations()`.
- El idioma guardado se usa durante el SSR para `lang`, título, descripción y metadatos
  Open Graph; los metadatos del navegador también se actualizan al cambiar la preferencia.
  Los mensajes previos del chatbot conservan su idioma mediante `lang` en cada mensaje.
- El cambio de idioma solo cambia cadenas visibles: no desmonta ni reinicia el estado del
  formulario o del chat. Las opciones de servicio conservan sus valores originales en
  español al enviar la solicitud para mantener compatible el contrato del endpoint.
- Los fuentes deben permanecer en UTF-8. Mantener tildes y caracteres españoles como
  texto Unicode real; evitar conversiones que produzcan secuencias mojibake.
- Los cambios se guardan en una cookie `SameSite=Lax` durante un año para que el
  servidor pueda producir el idioma y el tema iniciales sin esperar a la hidratación.
  El contenido de la cookie no es información sensible ni se usa para autorización.
- La escala de contenido se apoya en el zoom nativo del navegador y no se persiste como
  una preferencia propia; no se aplica `transform: scale()` ni se añade otro control de
  escala. El selector de texto conserva los niveles 100/125/150/200 % y sus tamaños
  tipográficos relativos crecen sin escalar las imágenes ni el mapa.
- A tamaños grandes, el menú de navegación se repliega para evitar desbordamiento y las
  etiquetas largas pueden redistribuirse. En ventanas de menos de 400 px, el botón
  flotante de accesibilidad muestra el icono y conserva su nombre accesible para no
  competir por espacio con WhatsApp y el chatbot. Las descripciones truncadas en tarjetas
  se muestran completas al ampliar el texto; el menú móvil limita su altura y permite
  desplazamiento vertical propio.
- Los tokens semánticos cubren fondo, texto, tarjetas, superficies, bordes, controles,
  foco y estados. Las secciones de marca con fondo azul marino conservan su identidad;
  se ajustan los controles superpuestos, tarjetas y enlaces para mantener legibilidad
  en ambas apariencias.
- Los botones de acción que usan verde o azul de marca emplean variantes más oscuras
  cuando necesitan texto o iconos blancos. El amarillo y el verde claros conservan texto
  azul marino de alto contraste. Los títulos con degradado usan tonos de marca ajustados
  para conservar contraste sobre superficies claras y oscuras. El foco visible se refuerza
  globalmente y los controles nativos siguen `color-scheme` de la apariencia seleccionada.
- El modo daltonismo subraya los enlaces, resalta las pestañas y tarjetas de servicio
  seleccionadas con un borde doble, y mantiene la distinción de enlaces continuos/
  punteados y nodos circulares/romboidales en el diagrama de red. Los errores del formulario
  y del chatbot incluyen texto e icono además del color y reciben un borde reforzado. No se
  aplican filtros cromáticos a imágenes ni videos.
- El panel de accesibilidad, la navegación, el formulario, las tarjetas, el chatbot y los
  diálogos consumen los colores semánticos o sus variantes compatibles con el tema.
  El mapa es un `iframe` de Google Maps y, por ser contenido externo de otro origen,
  conserva los colores propios del proveedor; su contenedor y los controles circundantes
  sí se adaptan al tema.
- La landing y los controles principales consumen los catálogos ES/EN de
  `src/lib/translations.ts`; header, formulario, ubicación, footer, chatbot, proyectos,
  nombres accesibles, metadatos SSR y páginas de error usan el idioma seleccionado.
  La dirección física se mantiene como dato geográfico propio (no se traduce), pero se
  obtiene del catálogo locale. Los campos visibles del formulario están asociados a sus
  controles mediante `htmlFor`/`id`.
- Cambiar de idioma conserva los valores del formulario y el historial/chat escrito. El
  saludo inicial del chatbot se actualiza y los mensajes anteriores mantienen su atributo
  `lang` original. La página HTML de contingencia también lee el idioma de la cookie.
- `formatLocalizedNumber` y `formatLocalizedDate` están disponibles en `translations.ts`;
  el año del pie usa el helper numérico. Aplicar estos helpers a futuras fechas y cifras
  que se incorporen a la interfaz.

### `src/routes/api.chat.ts`

- Endpoint del servidor `POST /api/chat`; también responde `405` a otros métodos.
- Valida JSON y los campos `session_id`/`mensaje`.
- Límites actuales: cuerpo de solicitud 16 KiB, ID de sesión 128 caracteres,
  mensaje 4.000 caracteres, respuesta upstream 64 KiB y texto final 16.000 caracteres.
- Requiere `MAKE_CHAT_WEBHOOK_URL` configurada en el servidor y con esquema HTTPS.
- Reenvía a Make únicamente `session_id` y `mensaje`.
- Timeout del webhook: 30 segundos.
- Acepta respuesta upstream `application/json` o `text/plain`; intenta extraer el
  texto de `respuesta_bot`, `respuesta`, `response`, `message` o `text`.
- Rechaza `Accepted` como respuesta final, porque significa que el escenario recibió
  el evento pero no entregó en esa respuesta el texto del agente.
- Errores funcionales habituales: `chat_unavailable` (503),
  `invalid_request` (400), `upstream_error` (502),
  `upstream_timeout` (504), `invalid_upstream_response` (502) y
  `agent_response_unavailable` (502).
- Se establece `cache-control: no-store` y se responde JSON UTF-8.
- La higiene de errores responde `internal_error` (500) sin incluir mensajes crudos de
  excepciones ni detalles del upstream.

### Rutas legales internas

- `/politica-de-privacidad` contiene la política bilingüe completa.
- `/terminos-de-servicio` y `/sla` ya existen como rutas registradas del router
  (`src/routes/terminos-de-servicio.tsx` y `src/routes/sla.tsx`) y ambas usan el
  componente compartido `LegalDocument` (main → article → header → índice → section →
  footer, un solo `<h1>`, enlaces «Volver al inicio» y metadatos).
- El contenido bilingüe está en `src/lib/terms-content.ts` (15 secciones) y
  `src/lib/sla-content.ts` (10 secciones, con tablas de prioridades y de créditos que se
  desplazan dentro de su caja en móvil). El idioma sigue la preferencia del menú de
  accesibilidad. Los compromisos del SLA salen de `SLA_VALUES`; son una propuesta
  pendiente de aprobación de gerencia y revisión jurídica.
- El footer enlaza a estas páginas con `<Link>` de `@tanstack/react-router` usando
  `TERMS_OF_SERVICE_URL` y `SLA_URL` de `telcobras-data.ts` (igual que
  `PRIVACY_POLICY_URL`). El banner de cookies usa el mismo patrón para la política.
- Cada ruta legal declara sus propios metadatos SEO/Open Graph y `canonical`
  (`https://telcobras.com/<ruta>`), por lo que el SEO técnico es homogéneo en las cuatro
  URLs públicas del sitemap.

### Rutas generadas

`src/routeTree.gen.ts` refleja las rutas TanStack; regenerar a través del flujo
normal de desarrollo/build si hay nuevas rutas. No duplicar convenciones de Next.js
o Remix: la guía local está en `src/routes/README.md`.

## 6. Componentes de la landing

### `src/components/HeaderNav.tsx`

- Barra superior (`header-topbar`) con ubicación, soporte 24/7 y NOC, teléfono y correo.
- Navegación sticky con efecto de vidrio (`header-glass`) y enlaces a anclas:
  Inicio, Quiénes Somos, Servicios, Inteligencia Artificial, Proyectos,
  ¿Por qué TELCOBRAS?, Ubicación y Contacto. El menú completo aparece en `xl`; por
  debajo se usa el panel móvil desplegable (`header-glass-panel`).
- CTA «Solicita una cotización» (`header-cta`) apunta a `#contacto`.
- Usa `LOGO_IMAGE` (con `ResponsivePicture`, `sizes="151px"`) y constantes de contacto
  de `telcobras-data.ts`.
- El estilo real (glass, links, indicadores) vive en clases de `styles.css`:
  `header-topbar`, `header-topbar-icon`, `header-glass`, `header-glass-panel`,
  `header-nav-link` (y `--block`), `header-cta`.

### `src/components/HeroAndMetrics.tsx`

- Hero de inicio: badge «Sede Principal en Cali • Cobertura Nacional», titular con
  degradado de marca, dos CTA (`#contacto` y `#servicios`) y eslogan «Una nueva forma
  de entender las redes».
- Fondo de video `/video_inicio.mp4`.
- Tarjeta lateral con rotación automática de tres imágenes (`HERO_SLIDES`:
  `HERO_IMAGE`, `TECHNICIAN_IMAGE`, `CALI_IMAGE`) cada 4 segundos y una tarjeta
  superpuesta «Infraestructura de Red Propia» con `min-h-[5.75rem]`: reserva dos líneas
  de texto, porque al llegar la fuente Nunito el corte de línea cambiaba y la tarjeta
  crecía (CLS).
- Debajo presenta métricas como +20 años, 99,6 % de SLA, instalación en 15 días y
  soporte 24/7; los iconos usan la animación `metric-icon-glow`.
- Cada métrica se envuelve en `MetricCard`, que añade `BrandGlowBorder` sin tocar su
  contenido. Una tarjeta a la vez se ilumina (anillo de marca, luz que recorre el borde
  y glow) y la iluminación rota 1 → 2 → 3 → 4 cada 3 s mediante
  `useRotatingHighlight`. Hover/focus toma la luz y pausa la rotación.

### `src/components/AboutAndValues.tsx`

- Sección `#nosotros`: descripción corporativa, propuesta de valor, Misión, Visión y
  siete valores.
- El título utiliza degradado azul/verde/amarillo; el contenido se organiza en grid
  adaptable.
- Referencia `/video_tel.mp4` como fondo; el archivo está en `public/video_tel.mp4`
  (movido desde la raíz el 27-10-2026, antes daba 404).
- Las animaciones de borde de Misión/Visión usan clases `motion-safe:`; considerar
  accesibilidad al modificarlas.

### `src/components/ServicesSection.tsx`

- Sección `#servicios`, construida desde `SERVICIOS_DATA`.
- Cinco servicios y sus videos:
  - `conectividad` → `/video_conectividad.mp4`
  - `seguridad` → `/video_seguridad.mp4`
  - `colaboracion` → `/video_colaboracion.mp4`
  - `nube` → `/video_nuve.mp4`
  - `agentes-ia` → `/video_agentes.mp4`
- Usa `BackgroundVideo` (ver «Videos de fondo»), con el mapa `SERVICE_VIDEOS`; la
  `key` por ID recrea el reproductor al cambiar de pestaña. Overlay oscuro (`bg-slate-950/75`) para
  mantener contraste.
- Interfaz con dos formas de selección sincronizadas: una barra de pestañas
  (`services-tabs` / `services-tab` / `services-tab-indicator`) y una cuadrícula de
  5 tarjetas (`services-card`) que también cambia el servicio y marca el activo.
- Cambia automáticamente al siguiente servicio cada 30 segundos. La selección manual
  por pestañas/tarjetas también se conserva; el intervalo sigue rotando desde la
  selección actual.
- El panel grande usa `brand-glow-always` + `BrandGlowBorder`; el color de acento por
  servicio sale de `SERVICE_COLORS` (con respaldo en `serv.color`), y hay un degradado
  SVG compartido (`servicios-icon-gradient`) para colorear los iconos de las tarjetas.
- El panel tiene un bloque lateral «Valor diferencial» (alta disponibilidad, soporte
  24/7, instalación en 15 días) y un CTA «Cotizar … para tu empresa» → `#contacto`.
- Los videos son de peso desigual; `video_agentes.mp4` es especialmente grande
  (aprox. 49 MB según el archivo local), relevante para carga móvil y transferencia.

### `src/components/LetyIaAndWhyUs.tsx`

Compone cuatro bloques, en este orden:

1. `#inteligencia-artificial`: presentación de inteligencia artificial y video de fondo
   `/video_inicio.mp4` (definido en este archivo).
2. `#proyectos`: `<ProjectsSection />`.
3. `#por-que`: `<WhyUsSection />`.
4. «Alianzas y Ecosistema Tecnológico» (definido en este archivo): heading destacado,
   logos de Xpertic y Aquora, rotación CSS suave alternada; fondo gris suave, Xpertic
   en tarjeta blanca y Aquora en tarjeta azul oscuro.

### `src/components/ProjectsSection.tsx`

- Sección `#proyectos` en bento grid, construida desde `PROYECTOS_DATA`.
- Escritorio (4 columnas × 3 filas, sin huecos): el proyecto con `destacado: true`
  (agua en Cali) ocupa 2×2; Vigilancia y Nodos 1×1; Chatbot ESPY 2×1 (necesita ancho
  para el robot); Wi-Fi y Centros Digitales 2×1. El orden y los spans viven en
  `BENTO_LAYOUT`; un ID nuevo no listado se añade al final como celda simple.
- Tablet 2 columnas; móvil 1 columna con la destacada primero.
- Tarjeta: imagen de fondo con tinte de marca y degradado, chips de categoría y
  ubicación, número decorativo, título y descripción con `line-clamp`.
- Toda la tarjeta es un `<button>` superpuesto que abre un `Dialog` (primitiva de
  `ui/dialog.tsx`) con imagen, descripción, categoría, ubicación y «Cotizar algo
  similar». Ese enlace cierra el modal y desplaza a `#contacto` en `onCloseAutoFocus`.
- `chatbot-espy` conserva la ilustración React del robot y su enlace de WhatsApp,
  que queda por encima del botón de la tarjeta (`z-20`) para no anidar interactivos.
- Aparición escalonada con `IntersectionObserver`. Cierre con «¿Tienes un reto
  similar? Hablemos» → `#contacto`.
- El botón de cierre del modal dice «Close» (texto de `ui/dialog.tsx`, compartido).

### `src/components/WhyUsSection.tsx`

- Sección `#por-que`. Fondo navy `#0A192F` con `video_inicio.mp4` girado 90°
  (contenedor con `container-type: size`; el video mide `100cqh × 100cqw` y se rota
  para cubrir), capa navy al 75 % y malla de degradados cian/verde. El video se pausa
  cuando la sección sale de pantalla.
- Bento de 3 columnas en escritorio: «Red Propia y Redundante» ocupa 2×2 a la
  izquierda; Instalación y Soporte apiladas a la derecha; Acompañamiento, Soluciones
  y Compromiso en la fila inferior. En tablet la destacada y Compromiso ocupan 2
  columnas para no dejar huecos; en móvil, 1 columna.
- Tarjeta destacada: siempre iluminada con `BrandGlowBorder` (giro de 6 s vía
  `--brand-glow-duration`), chips «Fibra óptica» y «Radioenlace» e ilustración SVG
  `NetworkIllustration` (`aria-hidden`).
- Ilustración: nodo central y un nodo por diferencial en sus posiciones originales
  (Instalación arriba-derecha, Soporte abajo-derecha, Compromiso arriba-izquierda,
  Acompañamiento abajo-izquierda, Soluciones abajo-centro). Fibra = trazo continuo,
  radioenlace = punteado. Un arco de respaldo amarillo entre Instalación y Soporte se
  enciende cada 6 s.
- Estado compartido: un único activo para la ilustración y las 5 tarjetas,
  `useRotatingHighlight(5, 3000, { resumeDelayMs: 1500 })`. Orden del ciclo
  (`CICLO`): Instalación → Soporte → Compromiso → Soluciones → Acompañamiento.
  Hover/focus en tarjeta o nodo lo fija; al salir se reanuda tras 1,5 s; un toque en
  táctil pausa 6 s.
- Nodo activo: halo y anillo pulsante en el color de su tarjeta, enlace resaltado,
  pulso de luz que viaja del centro al nodo y pulso del nodo central al cambiar.
- Tarjetas pequeñas (`.diff-card`): cada una define `--node-color` y lleva siempre un
  tinte suave de su color y un borde de marca al 45 %. La activa crece de 94 % a
  103 % (`scale`, sin mover el layout), sube su tinte, toma borde y glow de su color,
  colorea el icono y muestra una barra de señal a la izquierda.
- Colores por tarjeta: Instalación `#0087C3`, Soporte `#F3CB35`, Compromiso
  `#88BD4C`, Soluciones `#1a6f9c`, Acompañamiento `#6A9D32`.
- Cierre «¿Quieres conocer nuestra red?» con botón verde «Hablemos» → `#contacto`.
- Los textos de los diferenciales se acortaron (≤ ~110 caracteres) y los IDs son
  estables: `instalacion-15-dias`, `soporte-24-7`, `acompanamiento-cercano`,
  `soluciones-a-la-medida`, `compromiso-integridad` (la destacada es `red-propia`).

### `src/components/BrandGlowBorder.tsx`

Borde decorativo de marca (`aria-hidden`): halo exterior, anillo con degradado
cian/verde/amarillo y, opcionalmente (`light`), una luz que recorre el perímetro. Se
enciende con `data-active="true"` en el contenedor o con `.brand-glow-hover`
(hover/focus); `.brand-glow-always` lo deja encendido de forma tenue. El contenedor
debe ser `relative` y tener `border-radius`. Lo usan métricas (`HeroAndMetrics`),
diferenciales (`WhyUsSection`), el panel y tarjetas de servicio (`ServicesSection`) y
las tarjetas del formulario de contacto (`ContactAndFooter`).

### `src/components/ContactAndFooter.tsx`

Exporta dos componentes: `ContactSection` (`#contacto` y `#ubicacion`, dentro del
`<main>` de la landing) y `SiteFooter` (el pie de página, fuera de `<main>`).

- Contacto con teléfono, correo, dirección y redes sociales (Facebook, Instagram,
  LinkedIn; los `href` son genéricos `facebook.com`/`instagram.com`/`linkedin.com` sin
  perfil real todavía). Las tarjetas de datos usan `brand-glow-hover` + `BrandGlowBorder`.
- Formulario «Solicitud de Cotización o Diagnóstico». El `<select>` de servicio ofrece
  las opciones del portafolio (Conectividad, Seguridad, Colaboración, Nube híbrida,
  IA integrada, Agentes con IA, Solución integral).
- `#ubicacion`: mapa de Google de la sede en Cali (`LocationMap`; solo se carga con
  cookies opcionales aceptadas o al pulsar «Ver mapa») y botón «Cómo llegar» con enlace
  de indicaciones.
- Footer con logo, eslogan y copyright dinámico. Debajo, una rejilla (1 columna en
  móvil, 2 en tablet, 3 en escritorio) con: `<address>` con la dirección
  (`CONTACT.address`), el teléfono (`<a href="tel:…">`) y el correo
  (`<a href="mailto:…">`), y debajo el horario de atención (`HORARIO`); las redes
  sociales; y los enlaces legales (Términos, Política de datos, SLA) más el botón
  «Preferencias de cookies», que reabre `CookieBanner`. Verificado sin desborde a 360,
  768 y 1440 px; en tablet las redes van a la izquierda para no quedar bajo el robot
  flotante del chat.
- Fondo decorativo: SVG de red (`network-flow`, `contact-node-pulse`) sobre la imagen de
  Cali; se pausa con `data-animations-paused` controlado por `IntersectionObserver`
  (`sectionRef`/`isInView`), con el mismo criterio que `WhyUsSection`.

El formulario hace `POST /api/contacto` y muestra éxito solo si el endpoint responde
con estado HTTP exitoso. El servidor valida el JSON y longitudes, exige
`consentimiento: true` y persiste el registro en Supabase, tabla
`solicitudes_contacto`, usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno
de servidor.

**Seguridad del formulario implementada:** el endpoint aplica limitación de tasa por IP
(5 envíos por ventana de 10 minutos, con `429` y `retry-after`), descarta el honeypot
`sitio_web` y exige un token de Cloudflare Turnstile válido antes de persistir. El
widget está en `src/components/TurnstileWidget.tsx` y se monta en el formulario; el
token se resetea tras cada intento. La verificación usa `TURNSTILE_SECRET_KEY` en el
servidor (y `VITE_TURNSTILE_SITE_KEY` en el cliente); si la clave secreta falta, el
endpoint responde `503` con `contacto_unavailable` antes de llamar a `siteverify` o a
Supabase, sin usar claves de prueba. Si falta la site key, el cliente no carga el widget y
deshabilita el envío con un aviso. El rate limit es
un `Map` en memoria: protege por instancia, pero no es un límite distribuido/global.
La respuesta 500 ya no incluye `error.message` de Supabase: solo se registra el código
interno en el servidor y el cliente recibe `insert_failed` o `internal_error`.
Las etiquetas visibles de nombre, empresa, cargo, correo, teléfono, servicio y mensaje
están asociadas mediante `htmlFor`/`id`; los límites HTML y los del endpoint están
alineados para esos campos. Los campos tienen `autoComplete` (`name`, `organization`,
`organization-title`, `email`, `tel`). Todos los textos del formulario y de
`TurnstileWidget` (avisos de verificación, rate limit, errores de carga y
`aria-label`) vienen de `translations.ts`.

El formulario recopila nombre, empresa, cargo, correo, teléfono, servicio, mensaje y
consentimiento; nombre, correo y teléfono son obligatorios en cliente y servidor.
La ruta interna `/politica-de-privacidad` describe los tratamientos conocidos en la
aplicación. El responsable de datos debe revisar y confirmar especialmente las bases
jurídicas, proveedores/transferencias, retención, acceso y borrado antes de tratarla como
política legal aprobada.

### `src/components/FloatingChatbot.tsx`

- Chat flotante con bienvenida cerrable (se cierra sola a los 8 s, `WELCOME_BUBBLE_MS`,
  para no tapar contenido como el correo y el horario del footer en móvil), botón de robot, historial en memoria mientras
  está montado, mensajes de usuario/asistente, loading indicator (tres puntos) y
  mensajes de error.
- El botón colapsado es un robot animado (`chatbot-robot-vibrate` +
  `motion-safe:animate-bounce`, ambos quietos con movimiento reducido) y
  la invitación («¡Hola! ¿Necesitas ayuda?») usa `chatbot-invite-animation`.
- La sesión se guarda en `localStorage` bajo `telcobras_session_id`. Al cargar solo se
  lee una existente; si no hay, se crea con `crypto.randomUUID()` al enviar el primer
  mensaje (`ensureSessionId`), así quien no usa el chat no guarda nada. Si el acceso a
  `localStorage` falla, usa el UUID en memoria y registra el error.
- Al abrir el panel y al terminar la petición enfoca el input; desplaza el log al
  mensaje más reciente.
- Enviar mensaje hace `POST /api/chat` con JSON `{ session_id, mensaje }`; espera
  `{ respuesta_bot: string }`. El texto del bot se normaliza con `formatBotText`
  (unifica saltos de línea y quita los de los extremos).
- El input se deshabilita durante la petición o mientras se inicializa la sesión.
- El panel se amplió verticalmente: casi toda la altura disponible en móvil y hasta
  720 px en escritorio, limitado por altura de viewport.
- Los mensajes de error del backend se traducen al idioma seleccionado mediante el
  catálogo de chatbot, incluido `agent_response_unavailable`. Cada mensaje del historial
  conserva el idioma con `lang`; cambiar idioma no desmonta el chat ni borra lo escrito.
- No exponer la URL de Make en el frontend. No pasar datos sensibles del historial
  en telemetría.

### `src/components/ScrollToTopButton.tsx`

Botón «Volver al inicio»: aparece al desplazarse más de 400 px, ejecuta scroll suave
y está situado alto (`bottom-[24rem]`) para evitar superposición con burbuja/chatbot.

### Componentes UI compartidos

`src/components/ui/` incluye primitivas Radix/shadcn para diálogos, formularios,
botones, tarjetas, menús, pestañas, tablas, etc. Son infraestructura de interfaz:
antes de crear un control nuevo, revisar si ya existe una primitiva apropiada.

## 7. Datos y estilo compartido

### `src/lib/telcobras-data.ts`

Fuente de verdad para:

- Imágenes propias (`ResponsiveImage` = base en `public/images/` + anchos):
  `LOGO_IMAGE`, `HERO_IMAGE`, `TECHNICIAN_IMAGE`, `CALI_IMAGE`, `PROJECT_IMAGE_WIDTHS`
  (el campo `imagen` de cada proyecto es su base) y `HERO_IMAGE_SIZES`. URLs absolutas
  del dominio para usos externos: `SITE_URL`, `LOGO_URL` (`/images/logo.png`, JSON-LD)
  y `OG_IMAGE_URL` (`/images/og.jpg`, `og:image` y `twitter:image` de las 4 rutas).
- Paleta de marca (`BRAND_COLORS`: azul `#0087C3`, verde `#88BD4C`, amarillo
  `#F3CB35`, gris `#888D91`, navy `#0A192F`).
- Datos de contacto (`CONTACT`: teléfono, WhatsApp, correo, dirección) y el teléfono
  del chatbot (`CHATBOT_PHONE`).
- `HORARIO`: horario de atención que muestra el footer. Hoy vale
  `"[PENDIENTE: horario de gerencia]"` (pendiente 30).
- Tipo `ServiceItem` y catálogo `SERVICIOS_DATA`.
- Tipo `ProyectoItem` y catálogo `PROYECTOS_DATA`. Cada proyecto tiene `categoria`,
  `ubicacion` (opcional; el chatbot de la ESPY no la tiene porque ningún texto la
  indica), `destacado` y `descripcionLarga` (opcional, hoy vacía en todos; el modal
  usa `descripcion` si falta).

Cambiar aquí el catálogo se refleja en la sección Servicios, que itera el array para
tabs y tarjetas. Mantener IDs estables porque se usan para seleccionar iconos, videos
y la posición de cada proyecto en el bento de `ProjectsSection`.

Los textos de los diferenciales de «¿Por qué TELCOBRAS?» no están aquí: viven en
`DIFERENCIALES` dentro de `WhyUsSection.tsx`.

### Tipografía

- Nunito autoalojada en `public/fonts/` (licencia SIL OFL 1.1 en `public/fonts/OFL.txt`),
  descargada el 27-10-2026 de la API de Google Fonts, subconjunto latino (U+0000-00FF:
  tildes, ñ, ¿ y ¡; más comillas, guiones, € y ™):
  - `nunito-latin-400-900.woff2` (39 KiB): normal variable de 400 a 900. Cubre todos los
    grosores que usa el sitio (`font-normal`, `medium`, `semibold`, `bold`, `extrabold`,
    `black`); no se usa 300. Es la única que se precarga.
  - `nunito-latin-italic-700.woff2` (17 KiB): cursiva solo en 700, para el único texto
    en cursiva (eslogan del hero). Se descarga solo cuando la página la usa.
  - La flecha «→» (U+2192) no está en el subconjunto y se pinta con la fuente del
    sistema, igual que antes con Google Fonts.
- `@font-face` en `src/styles.css` con `font-display: swap`. Fuente de reserva
  `"Nunito Fallback"`: Arial (400-500) y Arial Bold (600, 700, 800, 900, una cara por
  grosor) con `size-adjust`, `ascent-override`, `descent-override` y
  `line-gap-override` medidos en Chrome con los textos reales del sitio. Con las fuentes
  bloqueadas, el header, el hero y Servicios ocupan exactamente lo mismo que con Nunito
  (quedan diferencias de ~25 px más abajo en la página).
- Los enlaces del menú de escritorio llevan `whitespace-nowrap`: el header no deja
  margen a 1280 px y una diferencia de 3 px partía en dos líneas los enlaces de dos
  palabras. Con Nunito no se parten en ningún ancho de escritorio, así que no cambia el
  diseño.
- Para regenerar: pedir a la API `family=Nunito:ital,wght@0,400..900;1,700` con un
  User-Agent de Chrome y quedarse con los bloques `/* latin */` (¡no el primero del CSS,
  que es cirílico!). Si cambian los grosores usados, volver a medir la reserva.

### `src/styles.css`

- Entrada única del CSS global. Usa Tailwind v4 con detección automática desactivada:
  `@import "tailwindcss" source(none);`, `@import "tw-animate-css";` y
  `@source "../src";`. El orden se normalizó el 22-10-2026 para que los `@import`
  precedan a `@source` (orden recomendado por Tailwind/Lightning CSS); el build ya
  incluía ambas dependencias antes del cambio.
- `@source "../src"` es relativo a este archivo y equivale a escanear `src/`. No existe
  `tailwind.config.ts`/`.js`; `src/tailwind.config.vibe.json` lo genera el
  `componentTagger` solo en desarrollo y está ignorado por Git, así que no participa
  del build de producción.
- Define variables de color/tema mediante OKLCH.
- Define tokens semánticos y la fuente (`--font-sans: "Nunito", "Nunito Fallback",
  sans-serif`) con sus `@font-face` (ver «Tipografía» más abajo).
- Contiene estilos globales y animaciones. Familias de clases propias:
  - `header-*` (`header-topbar`, `header-topbar-icon`, `header-glass`,
    `header-glass-panel`, `header-nav-link`, `header-nav-link--block`, `header-cta`).
  - `services-*` (`services-tabs`, `services-tab`, `services-tab-indicator`,
    `services-tab-icon`, `services-panel`, `services-panel-video`, `services-card`,
    `services-card-frame`, `services-card-icon`, `services-card-signal`,
    `services-status-dot`, `services-accent-border`, `services-accent-chip`,
    `services-accent-line`).
  - `brand-glow-*`: borde iluminado compartido. La luz gira con `transform: rotate`
    sobre un cuadrado enmascarado (no depende de `@property`).
  - `diff-card-*` y `network-*`: tintes, glow y señal de las tarjetas de diferenciales;
    nodos, enlaces, pulsos y arco de respaldo de la ilustración de red.
  - `contact-node-pulse`: nodos del SVG decorativo del formulario de contacto.
  - `metric-icon-glow`, `chatbot-robot-vibrate`, `chatbot-invite-animation`,
    `whatsapp-floating-button` (ripple), `ally-logo-rotation` (y `-delayed`),
    `telcobras-rounded-font`.
  - `hero-aurora-blob` (+ `--blue/--green/--yellow`) y sus `@keyframes` siguen
    definidos pero no se referencian desde ningún componente: posible CSS muerto.
- `[data-animations-paused="true"]` pausa las animaciones de red (contacto) y de los
  diferenciales cuando la sección está fuera de pantalla.
- Algunas clases Tailwind del sitio usan valores de marca literales; respetar el
  patrón existente si no se está haciendo una normalización de estilos aparte.

### Utilidades/error

- `src/lib/utils.ts`: helper `cn()` combina `clsx` y `tailwind-merge`.
- `src/lib/error-page.ts`: página HTML mínima de recuperación de error SSR.
- `src/lib/error-capture.ts`: captura y amplía errores/cause chains para que el
  servidor pueda recuperar detalles cuando H3 convierte errores en respuestas HTTP.
- `src/lib/vibe-error-reporting.ts`: puente opcional de errores React al entorno
  de vista previa/editor; no es un backend general de telemetría.
- `src/hooks/use-mobile.tsx`: hook compartido relacionado con detección móvil.
- `src/hooks/use-rotating-highlight.ts`: rota un índice activo cada `intervalMs`.
  Arranca por defecto (`isInView` inicia en `true`) y solo se pausa con hover/focus,
  pestaña oculta o cuando el `IntersectionObserver` confirma que el contenedor salió
  del viewport. Opciones: `resumeDelayMs` y `onTouchActivate(index, pauseMs)`. No usa
  `window` durante el render (SSR seguro). Lo usan las métricas y los diferenciales.

### Videos de fondo

- Los cinco `<video>` de la landing (Hero, Quiénes Somos, Servicios, Inteligencia
  Artificial y «¿Por qué TELCOBRAS?») usan `src/components/BackgroundVideo.tsx`:
  silenciado, en bucle, `playsInline`, `poster` `.webp` (primer fotograma, mismo nombre
  que el `.mp4` en `public/`), `preload="none"` y **sin `autoPlay`**. Se reproduce desde
  el cliente con `play()` salvo con `prefers-reduced-motion: reduce`, en cuyo caso se
  queda en el poster y ni siquiera descarga el video. Desde el 28-10-2026 cada video
  solo se reproduce mientras está a la vista (`IntersectionObserver` propio) y se pausa
  al salir; `playing` añade una condición externa (la usa `WhyUsSection`). El del hero
  usa `startAfterLcp`: no arranca hasta que la imagen principal
  (`img[fetchpriority="high"]`) se ha cargado y pintado (`whenLcpImagePainted`,
  `src/lib/when-lcp-painted.ts`). El del hero lleva además `desktopOnly`: por debajo de
  768 px no se reproduce ni se descarga y queda el poster fijo, igual que con
  movimiento reducido (28-10-2026).
- La preferencia se lee con `useReducedMotion()` / `prefersReducedMotion()` de
  `src/hooks/use-reduced-motion.ts`.
- Compresión (27-10-2026, `ffmpeg` 9.0.2): H.264 `-preset veryfast -crf 28`, sin audio,
  máximo 1280×720 y `-movflags +faststart`. Excepciones: `video_agentes.mp4` a 960×540
  para bajar de 5 MB, y `video_seguridad.mp4` sin recodificar (con CRF 28 crecía), solo
  sin audio y con `+faststart`. Se comprobó fotograma a fotograma que no hay pérdida
  visible y que cada video conserva su número de fotogramas. Para volver a comprimir:
  `ffmpeg -i in.mp4 -an -c:v libx264 -preset veryfast -crf 28 -pix_fmt yuv420p -vf
  "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2"
  -movflags +faststart out.mp4`; poster: `ffmpeg -i in.mp4 -frames:v 1 -c:v libwebp
  -quality 75 in.webp` (para `video_nuve` añadir `-ss 3` antes de `-i`). Bucle de
  `video_tel` con fundido, a partir del original (`git show ab17f5a~1:public/video_tel.mp4`):
  `ffmpeg -ss 101 -t 21 -i original.mp4 -filter_complex
  "[0:v]split[x][y];[x]trim=start=1:end=21,setpts=PTS-STARTPTS[a];[y]trim=end=1,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=1:offset=19,format=yuv420p[v]"
  -map "[v]" -an -c:v libx264 -preset veryfast -crf 28 -movflags +faststart video_tel.mp4`.

### Convenciones de movimiento

- Con `prefers-reduced-motion` no se elimina un efecto: se conservan los ciclos y los
  cambios de color/estado con fundidos de opacidad, y se quitan giros, pulsos
  viajeros y desplazamientos. Antes una rotación quedaba detenida en ese modo y en
  este equipo parecía rota.
- Animar solo `opacity`, `transform` y `stroke-dashoffset`; pausar fuera de pantalla.
- Las rotaciones deben arrancar por defecto y pausarse solo al confirmar que el
  elemento está fuera del viewport (un estado inicial «pausado» hacía que nunca
  arrancaran si la sección empezaba debajo del borde).
- Para verificar en navegador, emular ambos modos (`reducedMotion: "reduce"` y
  `"no-preference"`). No usar capturas de un elemento más alto que el viewport
  mientras se mide una rotación: alteran el área visible y el observer la pausa.
- Excepciones explícitas (27-10-2026): con movimiento reducido los videos de fondo no
  se reproducen (se ve el poster), y se detienen del todo el rebote y la vibración del
  robot del chat, los puntos de carga del chat (`motion-safe:animate-bounce`) y la
  rotación de logos de aliados (`.chatbot-robot-vibrate` y `.ally-logo-rotation` con
  `animation: none` en `styles.css`).

## 8. Integración del chatbot con Make

### Flujo

```text
Visitante
  → FloatingChatbot (navegador)
  → POST del mismo origen /api/chat
  → validación en src/routes/api.chat.ts
  → webhook de Make (servidor a servidor)
  → escenario/agente de Make
  → módulo Webhook response
  → proxy normaliza el texto a { "respuesta_bot": "..." }
  → FloatingChatbot muestra la respuesta
```

### Configuración

- Local: definir `MAKE_CHAT_WEBHOOK_URL` en `.env.local` (archivo ignorado por Git).
- Cloudflare: guardar el valor como secreto del entorno con
  `wrangler secret put MAKE_CHAT_WEBHOOK_URL`.
- Nunca usar prefijo `VITE_`, guardar el webhook en datos del cliente ni exponer su valor.
- Make debe devolver la respuesta del agente en el mismo ciclo HTTP. Formato sugerido:

```json
{
  "status": "success",
  "respuesta_bot": "Respuesta del asistente"
}
```

Enviar `Content-Type: application/json`. En Make, mapear de forma segura la salida
del agente; una cadena insertada manualmente puede romper JSON si incluye comillas o
saltos de línea. Usar el mecanismo de serialización JSON del escenario cuando esté
disponible.

### Estado de conectividad conocido

Historial de pruebas manuales previas:

- Hubo ejecuciones que devolvieron `Accepted`, señal de recepción upstream pero sin
  respuesta utilizable del agente.
- Se observó al menos una respuesta HTTP 200 con texto en una prueba histórica.
- Varias pruebas dieron HTTP 502 `invalid_upstream_response`.
- El 8 de octubre de 2026 alrededor de las 11:58, una llamada a `/api/chat` devolvió
  HTTP 502 con `invalid_upstream_response`.
- Una repetición solicitada a las 12:01 quedó esperando y fue interrumpida/no produjo
  resultado confirmado en el contexto disponible.

Conclusión: la integración del proxy está construida, pero el funcionamiento actual
de la salida del escenario Make no debe darse por confirmado hasta obtener una prueba
exitosa y repetible con el módulo Webhook response configurado correctamente.

## 9. Despliegue y configuración

- `vite.config.ts` importa el wrapper `@leadconnector/vite-tanstack-config`; este
  wrapper ya instala plugins TanStack Start, React, Tailwind, alias, Nitro y otros.
  No duplicar plugins manualmente. El wrapper añade `@tailwindcss/vite` siempre; el
  `componentTagger` solo en `serve` + `development`.
- El destino Nitro es Cloudflare: el wrapper lo usa como target por defecto
  (`cloudflare-module`). `vite.config.ts` activa `nitro.cloudflare.nodeCompat` y fija
  el nombre del Worker con `nitro.cloudflare.wrangler.name: "telcobras-web"` (desde el
  27-10-2026; antes Nitro lo derivaba del remoto de git y, al cambiar `origin` al repo
  del equipo, pasó a `equipo-d3sarrollo-telcobras-pagina-web`). No existe
  `nitro.json`; el `.output/server/wrangler.json` generado lleva ese `name` y una
  `compatibility_date` igual a la fecha del build. Si un Wrangler local no admite la
  fecha del día, para probar en local se puede pasar `--compatibility-date` con una
  anterior sin tocar archivos.
- `npm run build` escribe el artefacto canónico en `.output/` (cliente en
  `.output/public/`, servidor en `.output/server/`). `dist/` es un build legado del
  7-10-2026 y no debe desplegarse.
- `.wrangler/deploy/config.json` apunta a `.output/server/wrangler.json`. Ese archivo
  declara `main: index.mjs`, `assets.binding: ASSETS`, `assets.directory: ../public`,
  `compatibility_flags: ["nodejs_compat"]`, `no_bundle: true` y reglas ESModule.
- `.output/server/index.mjs` incluye `public_assets_data_default`, el mapa de assets
  públicos; el CSS aparece como `/assets/styles-<hash>.css` con
  `type: "text/css; charset=utf-8"`. `.output/public/_headers` (lo lee Workers Static
  Assets) se arma con `public/_headers` y, al final, la regla de Nitro para `/assets/*`
  (`public, max-age=31536000, immutable`, porque llevan hash). Desde el 28-10-2026
  `public/_headers` da a los estáticos sin hash (`/images/*`, `/fonts/*`, `/video_*`
  —videos y posters—, `/logo_*`, `/favicon.ico`, `/apple-touch-icon.png`)
  `cache-control: public, max-age=2592000, stale-while-revalidate=604800`: 30 días y,
  al caducar, revalidación con ETag (304 si no cambió), sirviendo la copia vieja hasta
  7 días mientras revalida. No se usa `immutable` de un año porque los nombres no
  cambian al sustituir un archivo; si se sustituye uno, conviene renombrarlo. El HTML
  (dinámico) no lleva caché y `robots.txt`/`sitemap.xml` usan el valor por defecto
  (`max-age=0, must-revalidate`). `_headers` no se sirve (404). Comprobado con el build
  servido por Wrangler. No hay `_routes.json` ni `_redirects`.
- `src/server.ts` importa dinámicamente la entrada SSR y reemplaza determinadas
  respuestas JSON 500 genéricas de H3 por la página de error del proyecto. En rutas
  `/api/*` devuelve `{ "error": "internal_error" }` con `cache-control: no-store` en
  lugar de HTML, sin propagar el detalle del error.
- `src/server.ts` aplica cabeceras de seguridad a **todas** las respuestas que pasan
  por el Worker: `Content-Security-Policy`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` y
  `Strict-Transport-Security` (solo sobre HTTPS). La CSP está en modo **bloqueante**
  (cabecera `Content-Security-Policy`); ya no se emite
  `Content-Security-Policy-Report-Only`, así que cualquier origen no permitido bloquea
  el recurso en lugar de solo reportarse. La CSP permite Turnstile y el iframe de
  Google Maps; las imágenes y las fuentes solo pueden venir del propio origen
  (`img-src 'self' data: blob:`, `font-src 'self'`, `style-src 'self' 'unsafe-inline'`);
  en desarrollo añade
  `'unsafe-eval'`, `ws:`/`wss:` y localhost porque Vite lo requiere. `script-src`
  conserva `'unsafe-inline'` por los scripts inline de hidratación de TanStack Start;
  endurecerlo con nonces/hashes es el siguiente paso natural. No se usa
  `public/_headers` para esto: el SSR es dinámico y el `_headers` que genera Nitro solo
  cubre assets estáticos (`/assets/*` con cache immutable).
- El JSON-LD se publica como `<script type="application/ld+json">`; los bloques de datos
  JSON-LD no ejecutan código, por lo que no están sujetos a `script-src`. Aun así, el
  bloque se genera con `JSON.stringify` y escapado automático del router, sin
  concatenar HTML a mano.
- `src/start.ts` instala middleware de captura de errores y protección CSRF para
  server functions; el filtro solo cubre handlers `serverFn`.
- El endpoint HTTP `/api/chat` tiene su propia validación y controles; no confundir
  la protección CSRF de server functions con validación del endpoint de chat.
- `src/start.ts` limita `createCsrfMiddleware` a handlers `serverFn`. Los handlers HTTP
  `/api/chat` y `/api/contacto` no obtienen esa protección automáticamente; al endurecer
  estos endpoints, decidir una política de origen/CSRF además de limitación de tasa.
- El formulario usa Turnstile: configurar `TURNSTILE_SECRET_KEY` como secreto del
  entorno y `VITE_TURNSTILE_SITE_KEY` como variable pública de compilación. El rate
  limit en memoria de `api.contacto.ts` no se comparte entre instancias.
- Escaneo de secretos con gitleaks: `.gitleaks.toml` extiende las reglas por defecto y
  excluye artefactos generados. `npm run secrets:scan` revisa todo el historial
  (`--log-opts=--all`) con `--redact`. `.githooks/pre-commit` bloquea commits con
  secretos en staged; `npm install` activa el hook mediante `scripts/install-hooks.mjs`
  (`core.hooksPath=.githooks`). CI lo repite en `.github/workflows/gitleaks.yml`
  (v8.30.1 fijado y verificado por checksum). `.gitignore` cubre `.env`, `.env.*` y
  `.dev.vars*`, con excepción para los archivos `*.example`.
- `src/router.tsx` construye el router con restauración de scroll (sin QueryClient).
- `tsconfig.json` está en modo estricto y define alias `@/*` → `src/*`.
- `components.json` refleja la configuración de componentes tipo shadcn.
- El `README.md` del repositorio cubre el arranque y el contrato/configuración de chat;
  esta guía complementa, no sustituye, la documentación de deploy vigente del proveedor.

### Pipeline de CSS en el build

- `src/routes/__root.tsx:14` importa `../styles.css?url`; `head.links` publica el
  `<link rel="stylesheet">` en el `<head>` (`HeadContent`).
- `src/styles.css` usa Tailwind v4 (`@import "tailwindcss" source(none)` +
  `@source "../src"`), `tw-animate-css` y tokens OKLCH.
- El build genera `.output/public/assets/styles-<hash>.css` (~162 KB), con utilidades
  como `bg-primary`, `min-h-screen`, `rounded-2xl` y `animate-in`.
- El hash se repite en `.output/server/_ssr/router-*.mjs` (SSR) y en
  `.output/public/assets/index-*.js` (cliente); Nitro sirve el archivo con MIME
  `text/css; charset=utf-8`.
- Verificación 22-10-2026: no hay fuga de estilos ni referencias rotas. El único
  desfase es el build antiguo de `dist/` y que `.output/` (13:09) es anterior a la
  última edición de `src/server.ts` (13:21); reconstruir antes de desplegar.
- La ruta del CSS es absoluta (`/assets/...`). Si algún día se despliega bajo un
  subpath, hay que configurar `base` en Vite; hoy no está configurado y se asume raíz.

## 10. Recursos estáticos y observaciones

En `public/` se encontraron:

| Recurso | Uso |
|---|---|
| `video_inicio.mp4` | Fondos de Inicio, Inteligencia Artificial y «¿Por qué TELCOBRAS?» (girado 90°) |
| `video_conectividad.mp4` | Servicio de Conectividad |
| `video_seguridad.mp4` | Servicio de Seguridad |
| `video_colaboracion.mp4` | Servicio Colaboración |
| `video_nuve.mp4` | Servicio Nube (nombre exacto del archivo, «nuve») |
| `video_agentes.mp4` | Servicio Agentes IA |
| `video_tel.mp4` | Fondo de «Quiénes Somos» (`AboutAndValues.tsx`) |
| `video_*.webp` | Poster (primer fotograma) de cada video, mismo nombre que el `.mp4` |
| `logo_aquora.png` | Aliado Aquora |
| `logo_xpertic.png` | Aliado Xpertic |
| `favicon.ico` | Favicon (32×32, más 16 y 48), isotipo de TELCOBRAS |
| `apple-touch-icon.png` | Icono de iOS (180×180, fondo blanco) |
| `robots.txt` | Reglas básicas para rastreo + referencia al sitemap |
| `sitemap.xml` | Mapa del sitio con las cuatro URLs públicas (`/`, `/politica-de-privacidad`, `/terminos-de-servicio`, `/sla`) bajo `https://telcobras.com`, con `<lastmod>` (2026-10-27) |

**Versionado:** al auditar el repositorio, todos los recursos de la tabla de `public/`
estaban versionados en Git. `video_tel.mp4`, que antes estaba solo en la raíz y daba
404, se movió a `public/` con `git mv` el 27-10-2026.

Los archivos de la carpeta `public/` se sirven desde raíz (por ejemplo,
`public/video_inicio.mp4` se solicita como `/video_inicio.mp4`). Ya no hay copias de
medios en la raíz del repositorio (se eliminaron el 27-10-2026, ver pendiente 23).

### Imágenes

Desde el 27-10-2026 no hay imágenes externas: las 11 que venían de
`vibe.filesafe.space` se descargaron a `public/images/` y se generaron con Pillow
(AVIF calidad 55, WebP calidad 78, sin ampliar nunca el original):

| Imagen | Original (PNG) | AVIF servido en móvil (360 px) | AVIF servido en escritorio (1280 px) | Anchos |
|---|---|---|---|---|
| `hero` (LCP) | 178 KiB | 12 KiB (480) | 24 KiB (768) | 480, 768, 1024 |
| `tecnico` | 288 KiB | 24 KiB | 51 KiB | 480, 768, 1024 |
| `cali` (hero y fondo de Contacto) | 301 KiB | 18 KiB | 41 KiB / 93 KiB (fondo, 1280) | 480, 768, 1024, 1280 |
| `logo` | 128 KiB | 4 KiB (160) | 4-9 KiB (160/320) | 160, 320, 480 + `logo.png` 44 KiB |
| `proyecto-vigilancia-risaralda` | 318 KiB | 24 KiB | 24 KiB (480) | 480, 768, 1200 |
| `proyecto-automatizacion-agua-cali` | 327 KiB | 23 KiB | 52 KiB (768) | 480, 768, 1200 |
| `proyecto-zonas-wifi-corregimientos` | 318 KiB | 30 KiB | 60 KiB (768) | 480, 768, 1200 |
| `proyecto-nodos-telemetria-cali` | 350 KiB | 27 KiB | 27 KiB (480) | 480, 768, 1200 |
| `proyecto-centros-digitales-claro` | 234 KiB | 20 KiB | 41 KiB (768) | 480, 768, 1200 |
| `proyecto-chatbot-espy` | 83 KiB | — (la tarjeta usa una ilustración) | — | 480, 768, 1200 |
| `og` (Open Graph) | 223 KiB | — | — | `og.jpg` 1200 px, 150 KiB |

Total de imágenes de la landing: unos 2.440 KiB antes; unos 182 KiB en móvil y unos
420 KiB en escritorio después. Para regenerarlas: `Image.resize(..., LANCZOS)` al
ancho y `save(..., "AVIF", quality=55)` / `save(..., "WEBP", quality=78, method=6)`
desde los PNG originales (siguen en el historial: commit anterior a este cambio, en
`src/lib/telcobras-data.ts`).

`og:image`, `twitter:image` y el `logo` del JSON-LD apuntan a URLs absolutas de
`https://telcobras.com/images/...`: no funcionarán hasta que esta app se despliegue en
ese dominio (hoy `telcobras.com` sirve otro sitio, ver pendiente 17).

## 11. Estado funcional y pendientes conocidos

### Implementado

- Landing responsiva con secciones institucionales, servicios, proyectos, contacto y ubicación.
- Preferencias de accesibilidad persistidas/validadas y aplicadas en SSR; catálogos
  tipados ES/EN para el contenido principal, el formulario, el chatbot y los errores raíz.
- Formulario conectado al endpoint `/api/contacto`, con persistencia de solicitudes en
  Supabase mediante credenciales de servidor.
- Protección anti-abuso del formulario: Cloudflare Turnstile, honeypot, validación de
  longitudes y limitación de tasa por IP (5 envíos / 10 minutos).
- Higiene de errores: respuestas públicas genéricas (`insert_failed`, `internal_error`)
  sin exponer mensajes crudos de Supabase, tanto en `api.contacto.ts` como en la
  normalización de errores SSR de `src/server.ts` para rutas `/api/*`.
- Cabeceras de seguridad y CSP **activa (bloqueante)** aplicadas desde `src/server.ts`
  a SSR, API y respuestas de error (ver sección 9). La cabecera emitida es
  `Content-Security-Policy`; ya no se envía `Content-Security-Policy-Report-Only`.
- Rutas legales `/terminos-de-servicio` y `/sla` con su contenido completo en ES/EN
  mediante el componente compartido `LegalDocument`; el footer navega a ellas con
  `<Link>`, igual que al resto de enlaces legales y al banner de cookies. Los valores
  del SLA (`SLA_VALUES`) siguen pendientes de aprobación.
- SEO técnico: metadatos por ruta (`title`, `description`, `canonical`), etiquetas
  Open Graph y Twitter Card en las cuatro rutas públicas, datos estructurados JSON-LD
  de `Organization` en la landing y `public/sitemap.xml` referenciado desde
  `robots.txt`. Desde el 27-10-2026: títulos de 50-60 y descripciones de 140-160
  caracteres, `<main>` único en la landing, `lang="es-CO"`, favicon y
  apple-touch-icon.
- Optimización de imágenes para Core Web Vitals: `loading`/`decoding`/`fetchPriority`
  explícitos y `width`/`height` declarados para evitar CLS y priorizar el LCP.
- Nunito autoalojada con `preload` y fuente de reserva con métricas ajustadas (sin CLS
  por cambio de fuente).
- Página 404 con enlaces de salida a «Ir al inicio» (`/`) y «Ver servicios» (`/#servicios`).
- Higiene de secretos: auditoría del código, historial completo (incluidos objetos
  huérfanos) y bundle de cliente sin hallazgos; `.gitignore` cubre `.env*`/`.dev.vars*`,
  hook pre-commit con gitleaks y workflow de CI que escanea todo el historial con
  `--redact`.
- Header sticky con barra superior, efecto glass y menú móvil.
- Fondos de video por pestaña de servicio y rotación automática cada 30 segundos;
  pestañas y cuadrícula de tarjetas seleccionan el mismo servicio.
- Chat flotante conectado a un proxy server-side de Make, con validación y errores visibles.
- Accesos flotantes de WhatsApp y regreso al inicio.
- Logos Aquora/Xpertic con tarjetas diferenciadas y rotación visual.
- Proyectos en bento con proyecto destacado y modal de detalle.
- Métricas del hero con iluminación rotativa cada 3 s.
- «¿Por qué TELCOBRAS?» en bento con ilustración de red sincronizada con las tarjetas.
- Sección de contacto con red decorativa animada y tarjetas con borde de marca.

### Auditoría 26-10-2026

Resultado de la revisión del 26-10-2026, por prioridad. Los detalles y el estado de cada
punto están en la lista «Pendiente/por confirmar» (número entre paréntesis).

| Prioridad | Hallazgo | Pendiente |
|---|---|---|
| Crítica (corregida) | XSS reflejado en TanStack Start (CVE-2026-102989): corregido con `react-start@1.168.60`; el plugin de AI Studio queda en `0.3.3-beta.0` hasta que salga la estable | 20 |
| Alta (mitigada) | Las páginas `/terminos-de-servicio` y `/sla` ya están en el remoto con textos y valores de SLA pendientes de aprobación; ahora muestran un aviso de borrador y son `noindex` | 7, 24 |
| Alta (corregida, `066ef0f`) | `TurnstileWidget` se destruía y se volvía a crear en cada render del formulario | 21 |
| Alta | No hay pruebas: todos los archivos de test y configuración están vacíos | 2 |
| Alta (corregida) | `/video_tel.mp4` daba 404: se movió a `public/` | 4 |
| Media | Rate limit en memoria por isolate; `/api/chat` sin Turnstile | 8 |
| Media (resuelta) | `conexion.php` de prueba con credenciales por defecto y salida de datos personales: eliminado | 22 |
| Media (corregida) | Videos pesados: comprimidos de 76,9 MB a 11,9 MB en total (`video_agentes.mp4` 49 → 3,5 MB); duplicados de la raíz eliminados | 6, 23 |
| Media (corregida) | Videos y animaciones que ignoraban `prefers-reduced-motion` | 14 |
| Media (corregida) | El banner de cookies decía «al navegar aceptas»; ahora pide decisión y lo opcional depende de ella | 25 |
| Baja (corregida) | CSP `connect-src` con dominios que el navegador no usa | 16 |
| Baja | Metadatos SSR de las páginas legales siempre en español | 26 |
| Baja (27 y 28 corregidas) | Textos fijos fuera del catálogo en el formulario (corregido), `siteverify` sin `hostname` (corregido), `sitemap.xml` desactualizado | 27, 28, 29 |

Verificado y correcto en esta revisión: `npx tsc --noEmit` sin errores; `eslint` con 0
errores (6 avisos en `components/ui`); `npm run build` correcto; las APIs limitan el tamaño
del cuerpo, validan el content-type, no exponen errores internos y aplican Turnstile en
modo fail-closed; los secretos están fuera de git (gitleaks en pre-commit y CI). Las
páginas legales muestran 15 y 10 secciones, un solo `<h1>`, índice funcional, cambio
ES/EN, SSR correcto y tablas sin desborde a 360 px.

### Pendiente/por confirmar

1. **Repositorios y estado Git al 27-10-2026:**
   - **Repositorio oficial:** `Equipo-D3sarrollo/telcobras_pagina_web` (**público**),
     remoto `origin`. Su `main` estaba en `16e5c5a` («first commit»), que es ancestro
     del `main` del repo personal: se pone al día mediante un PR de
     `feature/footer-seguridad-alejandro` hacia `main`, en fast-forward y sin reescribir
     historia. La cuenta de Git de este equipo **sí tiene permiso de push** a ese repo
     (comprobado con `git push --dry-run` el 27-10-2026). La rama
     `feature/footer-seguridad-alejandro` sigue a `origin`.
   - **Repositorio de respaldo:** `guidogonzalez21/telcobras-web` (privado), remoto
     `personal`. Ahí está la historia de los PR #1 (`b299546`), #2 (`6b92799`) y #3
     (`757e21e`), fusionados desde la rama `feature/footer-seguridad-alejandro`. Se
     mantiene sincronizado con `git push personal main` y
     `git push personal feature/footer-seguridad-alejandro`.
   - Antes del 27-10-2026 existía un remoto llamado
     `Equipo-D3sarrollo/telcobras_pagina_web.git` que, pese al nombre, apuntaba al repo
     personal; se eliminó para evitar confusiones.
   - Al ser público el repo oficial, antes de subir se revisó todo el historial con
     `git grep`: ningún `.env*` versionado ni valores reales de Supabase, Make o
     Turnstile; solo aparecen las claves de prueba públicas de Cloudflare
     (`1x0000…AA`). Los commits muestran nombre y correo del autor.
   **Origen de los push (investigado el 26-10-2026):** `96e94ec`+`0cef096` y `c1cc050`
   salieron de este equipo, no de AI Studio. El reflog de la rama remota (entonces
   `origin`, hoy `personal`) registra «update by push» a las 13:31:24 y 14:38:42
   (+01:00). El log de Git de VS Code
   (`%APPDATA%/Code/logs/20261026T095944/window1/exthost/vscode.git/Git.log`) muestra a
   esas mismas horas `git pull --tags` seguido de `git push`, que es la secuencia del
   botón «Sincronizar cambios» de VS Code. El 26-10-2026 a las 17:45 VS Code además
   creó y sincronizó `30f0a3b` con cambios a medio hacer (`git.enableSmartCommit:
   true`). La configuración de usuario de VS Code tiene `git.confirmSync: false`
   (sincroniza sin pedir confirmación) y `git.autofetch: true` (este solo hace fetch).
   No hay hooks que hagan push: `core.hooksPath=.githooks` solo contiene `pre-commit`
   (gitleaks) y `.git/hooks` solo tiene `*.sample`. No existe `.vscode/settings.json`
   ni `git.postCommitCommand`. Para retener commits en local, no pulsar «Sincronizar
   cambios» o poner `git.confirmSync: true`. Ahora «Sincronizar cambios» publica en el
   repo oficial y público (`origin`).
2. **Pruebas y validaciones:** `npm exec eslint -- .` pasa con 0 errores y 6
   advertencias de `react-refresh/only-export-components` en componentes UI
   compartidos; `npx tsc --noEmit` pasa; `npm run build` pasa (26-10-2026, con el
   código de `0cef096`). Siguen vacíos (0 bytes) `vitest.config.ts`,
   `playwright.config.ts`, `src/components/AccessibilityMenu.test.tsx`,
   `src/components/ServicesSection.test.tsx`, `src/lib/accessibility-preferences.test.ts`,
   `src/lib/error-page.test.ts`, `src/hooks/use-reduced-motion.test.tsx` y
   `e2e/accessibility.spec.ts` (el hook `src/hooks/use-reduced-motion.ts` ya tiene
   implementación desde el 27-10-2026).
   `npx vitest run` falla con «config must export or return an object» y no hay script
   `test`. Reconstruir la suite o retirar los archivos vacíos para no aparentar
   cobertura. `gitleaks` no está instalado localmente: el pre-commit lo omite y solo
   escanea CI.
3. **Make:** ejecutar una prueba exitosa de extremo a extremo y revisar salida del módulo
   Webhook response; hay históricos de respuestas upstream inválidas.
4. **Video de Quiénes Somos — corregido (27-10-2026):** `AboutAndValues.tsx` pide
   `/video_tel.mp4`, que estaba solo en la raíz y daba 404. Se movió con `git mv` a
   `public/video_tel.mp4` (sin copia) y se comprobó en el navegador que carga.
5. **Rotación automática de Servicios:** rota incluso sin interacción y cambia también
   si el visitante seleccionó manualmente una pestaña. Si UX requiere pausar/reiniciar
   el reloj tras interacción o al salir de viewport, implementar explícitamente.
6. **Peso de videos — corregido (27-10-2026):** los 7 videos de `public/` se
   comprimieron (ver «Videos de fondo»):

   | Video | Antes | Después | Duración |
   |---|---|---|---|
   | `video_agentes.mp4` | 49,04 MB | 3,51 MB | 40,87 s |
   | `video_colaboracion.mp4` | 1,40 MB | 0,66 MB | 12,80 s |
   | `video_conectividad.mp4` | 1,14 MB | 0,60 MB | 10,08 s |
   | `video_inicio.mp4` | 2,99 MB | 0,74 MB | 10,00 s |
   | `video_nuve.mp4` | 4,62 MB | 4,07 MB | 20,16 s |
   | `video_seguridad.mp4` | 2,33 MB | 2,08 MB | 15,00 s |
   | `video_tel.mp4` | 15,34 MB | 0,24 MB | 20,00 s (bucle, ver abajo) |

   Todos tienen poster `.webp` y `preload="none"`. Total en `public/`: 11,9 MB (antes
   76,9 MB).
   - `video_tel.mp4` (fondo de «Quiénes Somos») se recortó de 346 s a un bucle de 20 s
     desde el original sin comprimir: tramo de 101 a 122 s (plano de una mesa de
     reunión con portátiles), elegido sin cambios de plano ni franjas negras laterales
     (el tramo 206-294 s las tiene). Como ningún tramo coincidía al inicio y al final,
     el último segundo se funde con el primero (`xfade` de 1 s): el video termina en el
     fotograma con el que empieza y el bucle no salta. Poster: su primer fotograma.
   - El poster de `video_nuve.mp4` usa el fotograma del segundo 3, porque el video
     empieza con un fundido desde negro.
7. **Privacidad y textos legales:** `/politica-de-privacidad` está implementada y el
   formulario exige consentimiento. `/terminos-de-servicio` y `/sla` ya muestran sus
   textos completos, pero están pendientes de aprobación de gerencia y revisión
   jurídica, incluidos los valores de `SLA_VALUES` en `src/lib/sla-content.ts`. Revisar también bases
   jurídicas, proveedores/transferencias, retención, acceso y borrado de la política.
   El 27-10-2026 se reescribió la sección 6 («Cookies y almacenamiento local») de la
   política, ES/EN, para que describa el funcionamiento real (esencial frente a
   opcional, sesión del chat, mapa de Google) y se cambió su fecha de actualización:
   **pendiente de revisión jurídica**, igual que el texto nuevo del banner. También el
   27-10-2026 se quitó Google Fonts de la sección 5 («Proveedores», ES/EN), porque la
   tipografía pasó a servirse desde el propio sitio: **este cambio también lo revisa
   jurídica**. El 28-10-2026 se añadió a la sección 5 (ES/EN) Cloudflare Turnstile como
   proveedor que recibe datos técnicos del navegador y de la conexión (IP, señales del
   dispositivo) al verificar el formulario: **también va a revisión de jurídica**.
8. **Protección de endpoints HTTP:** `/api/contacto` tiene Turnstile y rate limit por IP
   (5 envíos cada 10 min) y `/api/chat` tiene rate limit (20 mensajes cada 5 min), ambos
   con el limitador compartido `src/lib/rate-limit.ts` basado en `cf-connecting-ip`. El
   límite vive en memoria de cada isolate del Worker: no es global, así que el límite
   efectivo se multiplica entre isolates y centros de datos. `/api/chat` no tiene
   Turnstile y cada mensaje consume operaciones de Make. Considerar el binding de
   Rate Limiting de Cloudflare, una regla WAF o un Durable Object, y valorar Turnstile en
   el chat. Sin la cabecera `cf-connecting-ip` (dev o preview fuera de Cloudflare) todos
   los clientes comparten el contador `no-client-ip`. Mantener los mensajes de error
   genéricos sin detalles internos.
9. **Codificación de README:** `README.md` decodifica como UTF-8, pero contiene 24 bytes
    NUL. Revisar y guardar el documento como UTF-8 limpio; no copiar/re-guardar con una
    codificación ambigua.
10. **Lockfiles:** están versionados `package-lock.json` y `bun.lock`, mientras que los
    comandos documentados usan npm. Elegir cuál es la fuente canónica y mantener o retirar
    el otro mediante una decisión coordinada para evitar instalaciones divergentes.
11. **Formulario:** los enlaces «Términos de Servicio» y «SLA y garantías» del footer ya
    apuntan con `<Link>` a `/terminos-de-servicio` y `/sla`, que ya muestran el
    contenido completo (pendiente de aprobación, ver pendiente 7).
12. **Integración real de proyectos/fotos/redes:** comprobar enlaces sociales e imágenes
    externas antes de publicar en producción.
13. **Tarjetas invisibles antes de hidratar:** las tarjetas de `#por-que` se renderizan
    con `opacity-0` (y las de `#proyectos` con `motion-safe:opacity-0`, es decir, solo
    sin movimiento reducido) y aparecen cuando el JavaScript hidrata y el observer las
    revela. En modo dev eso tarda unos 10 s; con conexión lenta se vería un
    hueco. Propuesta: renderizarlas visibles y aplicar la animación solo tras el montaje.
14. **Accesibilidad del movimiento — corregido (27-10-2026):** con
    `prefers-reduced-motion: reduce` los videos de fondo se quedan en el poster y se
    detienen el robot del chat, sus puntos de carga y la rotación de logos de aliados
    (ver «Convenciones de movimiento»).
15. **Por confirmar con el cliente:** textos nuevos de los diferenciales, colores por
    tarjeta, si con movimiento reducido la tarjeta activa debe seguir creciendo, y
    categorías/subtítulo de Proyectos.
16. **CSP en modo bloqueante:** la cabecera `Content-Security-Policy` ya se aplica de
    forma permanente desde `src/server.ts`. Vigilar en el primer despliegue en producción
    que no haya violaciones por recursos de terceros no contemplados (por ejemplo, si
    Google Maps incrusta algo adicional o si Turnstile cambia sus dominios) y resolver
    cualquier bloqueo antes de propagarlo al equipo. Siguiente paso de endurecimiento:
    sustituir `'unsafe-inline'` por nonces/hashes en `script-src` y añadir `report-to`
    con un endpoint de recogida de Reports CSP. Desde el 27-10-2026 `connect-src` es
    `'self' https://challenges.cloudflare.com` (más `ws:`/localhost solo en desarrollo):
    se quitaron Supabase, Make e Integromat porque el navegador solo llama a `/api/*`.
    Verificado: ninguna violación de CSP recorriendo landing, formulario con Turnstile,
    chat, mapa y páginas legales, y un `fetch` del navegador a Make queda bloqueado.
    `img-src` es `'self' data: blob:` desde el 27-10-2026: se quitaron `*.supabase.co`
    y `vibe.filesafe.space` porque todas las imágenes son propias.
17. **Empaquetado y despliegue (CSS):** el pipeline está correcto — `src/routes/__root.tsx:14`
    importa `styles.css?url`, `head.links` lo enlaza, Tailwind v4 lo genera en
    `.output/public/assets/styles-<hash>.css` (~162 KB) y el mismo hash está en SSR y
    cliente. El riesgo es desplegar `dist/` (build del 7-10-2026 con
    `styles-CwhTlhtd.css`) o un `.output/` anterior al último cambio: desplegar solo
    `.output/` recién construido y purgar caché si el HTML quedó cacheado. La URL
    pública real de la app no está confirmada: `telcobras.com` responde con un sitio
    Joomla, no con esta app.
18. **Ruta base del CSS:** los assets se referencian como `/assets/...`. Si el deploy
    final vive bajo un subpath (por ejemplo `https://dominio/app/`), configurar `base`
    en Vite o servir la app en la raíz; hoy no hay `base` configurado.
19. **`.env.example` — creado (27-10-2026):** contiene los nombres (sin valores) y un
    comentario de las 6 variables que lee el código: `SUPABASE_URL`,
    `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_CHAT_WEBHOOK_URL`, `TURNSTILE_SECRET_KEY`,
    `VITE_TURNSTILE_SITE_KEY` y `TURNSTILE_ALLOWED_HOSTNAMES`.
20. **Dependencias y CVE-2026-102989 (corregido el 26-10-2026):** el XSS reflejado en
    respuestas de server functions de TanStack Start (GHSA-qx66-fv34-fjm8; afecta a
    `@tanstack/react-start` <1.168.60 y `@tanstack/start-server-core` <1.169.39) está
    corregido con versiones exactas: `@tanstack/react-start@1.168.60`,
    `@tanstack/react-router@1.170.41`, `@tanstack/router-plugin@1.168.42` y
    `@tanstack/start-server-core@1.169.39` (transitiva). `package-lock.json` y
    `bun.lock` coinciden.
    **Plugin de AI Studio en beta:** `@leadconnector/vite-tanstack-config` está fijado en
    **`0.3.3-beta.0`**. La versión estable `0.3.2` modifica en desarrollo
    `start-server-core/dist/esm/server-functions-handler.js` buscando la línea
    `const unwrapped = res.result || res.error`, que ya no existe en las versiones con
    parche, y hace que `npm run dev` devuelva 500 en todas las páginas. La beta reconoce
    la línea de 1.169.39 (`res.error !== void 0 ? res.error : res.result`). **Pendiente:**
    pasar el plugin a la versión estable en cuanto salga (0.3.3 o superior) y comprobar
    `npm run dev`. No subir `@tanstack/react-start` por encima de 1.168.60 sin
    comprobar antes el plugin: con `react-start@1.169.4` (`start-server-core@1.169.45`,
    línea `failed ? res.error : res.result`) también falla la beta. El commit
    `30f0a3b`, hecho y sincronizado desde VS Code, dejó temporalmente esa combinación
    rota en el remoto.
    Siguen abiertos: `vite@8.1.5` (alto; afecta solo al servidor de desarrollo;
    corregido en 8.3.5), `zod@3.25.76` (alto; las APIs no usan zod; solo se corrige en
    zod 4, que es un cambio mayor), `launch-editor` y `postcss-selector-parser`
    (desarrollo; se corrigen con `npm audit fix`).
21. **Turnstile se recreaba en cada render — corregido en `066ef0f` (27-10-2026):**
    `ContactAndFooter.tsx` pasa `onSuccess`, `onError` y `onExpire` como funciones
    inline y el `useEffect` de `TurnstileWidget.tsx` dependía de ellos, así que cada
    tecla ejecutaba `turnstile.remove()` y un nuevo `render()`. Ahora el widget lee los
    callbacks desde refs y el efecto solo depende de `activeSiteKey` y `theme`.
    Verificado en navegador: 84 teclas, selección de servicio y consentimiento → un solo
    montaje; un envío fallido llama a `reset()` y uno correcto envía el token. En
    desarrollo, al montar, el widget se monta dos veces por el `<StrictMode>` del
    cliente por defecto de TanStack Start; es esperado y no ocurre en producción.
22. **`conexion.php` — resuelto (27-10-2026):** era un script PHP de prueba ajeno al
    stack que usaba por defecto `root` sin contraseña y, ejecutado directamente,
    devolvía una fila de `solicitudes` (nombre y correo) y el mensaje de la excepción.
    Se eliminó con `git rm` tras comprobar que nada en el código, la configuración ni el
    build lo referenciaba. Sigue en el historial de Git; no contenía secretos (las
    credenciales venían de variables de entorno).
23. **Peso del repositorio — duplicados eliminados (27-10-2026):** los videos de
    `public/` están comprimidos (pendiente 6) y se eliminaron con `git rm` las copias sin
    usar de la raíz (`video_agentes.mp4`, `video_conectividad.mp4`, `video_inicio.mp4` y
    `video_seguridad.mp4`, 53 MiB; `video_tel.mp4` ya se había movido a `public/`). Los
    originales siguen en el historial de Git, así que el clon no adelgaza: reducirlo
    exigiría reescribir historia, que no se hace en este repo.
    **Recuperar un original** (los de la raíz eran idénticos a los de `public/` antes de
    comprimir): `git show f5b2d90:video_agentes.mp4 > video_agentes.mp4` (mismo patrón
    para los otros tres), o la versión de `public/` previa a la compresión:
    `git show ab17f5a~1:public/video_tel.mp4 > video_tel_original.mp4`.
24. **Páginas legales publicadas sin aprobar:** `0cef096` ya está en el `main` del
    repo personal (PR #2) y en la rama que se sube al repo oficial. Si se despliega, `/terminos-de-servicio` y `/sla` quedarán públicas con compromisos
    (disponibilidad, tiempos y créditos de `SLA_VALUES`) que gerencia y jurídica aún no
    aprobaron. **Mitigado:** mientras `LEGAL_DOCUMENTS_ARE_DRAFT` sea `true`
    (`src/lib/legal-status.ts`), ambas páginas muestran un aviso ES/EN «Borrador
    pendiente de aprobación» no vinculante y se sirven con
    `<meta name="robots" content="noindex, nofollow">`. Cuando gerencia y jurídica
    aprueben, poner la constante a `false` y actualizar `sitemap.xml` (pendiente 29). El
    portafolio cita 99,6 % y +99,7 %: confirmar cuál se compromete.
25. **Banner de cookies — corregido (27-10-2026):** pide una decisión explícita en lugar
    de «al navegar aceptas», y lo opcional (cookie de preferencias de 1 año y mapa de
    Google) solo se activa si se acepta (ver la tabla de consentimiento en la sección
    2). Queda la revisión jurídica del texto (pendiente 7).
26. **Metadatos de las páginas legales:** `head()` en `sla.tsx`,
    `terminos-de-servicio.tsx` y `politica-de-privacidad.tsx` usa siempre la versión en
    español. Las páginas actualizan `title` y `description` en el cliente, pero el HTML
    SSR y las etiquetas Open Graph y Twitter siguen en español para quien tenga el
    idioma en inglés (la landing ya no tiene este problema: usa el `head` raíz).
27. **Textos fuera del catálogo — corregido (27-10-2026):** los mensajes de Turnstile y
    de rate limit del envío del formulario (antes `language === "en" ? … : …`) y los
    textos de `TurnstileWidget.tsx` (errores de carga y `aria-label`, antes solo en
    español) ahora vienen de `contact.*` en `translations.ts`.
28. **Validación de Turnstile — corregido (27-10-2026):** `api.contacto.ts` exige que
    el `hostname` de `siteverify` esté en `TURNSTILE_ALLOWED_HOSTNAMES` (en desarrollo
    se añaden `localhost` y `127.0.0.1`). En producción, sin esa variable responde 503
    (fail-closed) y una respuesta obtenida con clave de prueba de Cloudflare
    (`metadata.result_with_testing_key`) se rechaza con 403; en desarrollo las claves de
    prueba se aceptan sin mirar el hostname (siempre es `example.com`). Verificado con
    el build de producción en Wrangler local (503 y 403) y en `vite dev` (pasa). No se
    comprueba `action` porque el widget no la define. **Antes de desplegar:** configurar
    `TURNSTILE_ALLOWED_HOSTNAMES` en Cloudflare con el dominio real.
29. **`sitemap.xml`:** `<lastmod>` de las cuatro URLs se actualizó a 2026-10-27.
    Volver a actualizar el de `/terminos-de-servicio` y `/sla` cuando se publiquen los
    textos aprobados.
30. **Horario de atención:** `HORARIO` en `src/lib/telcobras-data.ts` vale
    `"[PENDIENTE: horario de gerencia]"` y el footer lo muestra tal cual. Sustituirlo por
    el horario que confirme gerencia; si debe variar por idioma, moverlo a
    `translations.ts`.
31. **Rendimiento — línea base de Lighthouse (27-10-2026, sin cambios de código):**
    build de producción (`npm run build`) servido en local con Wrangler
    (`wrangler dev --config .output/server/wrangler.json --compatibility-date 2026-10-26`)
    y Lighthouse 12.8.2 con Chrome 156 headless, perfil limpio y sin extensiones.
    Móvil: emulación por defecto (Moto G, 412×823, 4G lento simulado: RTT 150 ms,
    1,6 Mbps, CPU ×4), 3 corridas; escritorio: `--preset=desktop`, 1 corrida. Reportes
    HTML en `documentacion/lighthouse/2026-10-27-antes/`.

    | Métrica | Móvil 1 | Móvil 2 | Móvil 3 | **Mediana móvil** | Escritorio |
    |---|---|---|---|---|---|
    | Rendimiento | 46 | 54 | 53 | **53** | 80 |
    | FCP | 4,9 s | 4,9 s | 4,8 s | **4,9 s** | 1,2 s |
    | LCP | 10,5 s | 10,5 s | 8,6 s | **10,5 s** | 2,2 s |
    | TBT | 214 ms | 260 ms | 282 ms | **260 ms** | 5 ms |
    | CLS | 0,185 | 0 | 0 | **0** | 0,029 |
    | Speed Index | 8,0 s | 7,7 s | 7,6 s | **7,7 s** | 2,4 s |

    La mediana es por métrica. Otras categorías (móvil y escritorio): Accesibilidad 96,
    Buenas prácticas 78-79, SEO 100.

    **Elemento LCP:** la imagen del hero (`HERO_PHOTO`, PNG de 178 KiB en
    `vibe.filesafe.space`, `fetchpriority="high"`). Fases en la corrida mediana: TTFB
    482 ms, retraso de carga 0 ms, carga 2.193 ms y **retraso de renderizado 5.964 ms
    (69 %)**: la imagen llega a tiempo pero el hilo principal está ocupado (9,0 s de
    trabajo: 3,4 s «Other», 3,2 s estilo y layout, 1,1 s de scripts).

    **Oportunidades y diagnósticos con más impacto (móvil):**
    1. Retraso de renderizado del LCP: 5,96 s (ver arriba).
    2. Entrega de imágenes: ~776 KiB ahorrables en 4 PNG de `vibe.filesafe.space` (foto
       de Cali 301 KiB, técnico 288 KiB, hero 178 KiB, logo 128 KiB).
    3. Formatos modernos (WebP/AVIF): 425 KiB, ~1,35 s de LCP.
    4. Recursos que bloquean el renderizado: ~1.060 ms de FCP (CSS de Google Fonts
       ~1.011 ms y `styles-*.css` ~635 ms).
    5. Tamaño adecuado de imágenes: 387 KiB, ~850 ms de LCP (técnico, logo y hero se
       sirven más grandes de lo que se muestran).
    6. JavaScript sin usar: 59 KiB del chunk principal (156 KiB), ~750 ms de FCP y
       ~350 ms de LCP.
    7. Trabajo del hilo principal: 9,0 s; ejecución de JS 1,2 s.
    8. Tamaño del DOM: 1.213 elementos (~350 ms de TBT).
    9. Peso total: 3.080 KiB. Lo encabezan los videos que se reproducen al cargar
       (`video_inicio` 727 KiB, `video_conectividad` 586 KiB, `video_tel` 230 KiB) y
       Turnstile, que se carga al inicio aunque el formulario esté al final (205 KiB).
    10. Caché: los `.mp4` de `public/` se sirven sin `cache-control` de larga duración
        (solo `/assets/*` lo tiene). Corregido el 28-10-2026 con `public/_headers`.

    Otros hallazgos: una corrida tuvo CLS 0,185 por la tarjeta «Infraestructura de Red
    Propia» del hero (intermitente), y `vibe.filesafe.space` deja la cookie de terceros
    `__cf_bm` (gestión de bots de Cloudflare) al servir las imágenes.

    **Optimización 1, imágenes (27-10-2026, sin medir aún con Lighthouse):** imágenes
    propias en AVIF/WebP con `srcset`/`sizes`, preload del hero, CSP sin orígenes de
    imágenes externos (desaparece la cookie `__cf_bm`) y altura reservada en la tarjeta
    del hero (sección 10, «Imágenes»).

    **Optimización 2, fuentes (27-10-2026, sin medir aún con Lighthouse):** Nunito
    autoalojada (sin la petición de ~1 s que bloqueaba el renderizado a Google Fonts),
    precargada, y fuente de reserva con métricas ajustadas. Corrige el CLS de ~0,03 del
    menú del header en escritorio: en el navegador ya no hay ningún layout shift al
    cargar, ni a 360 ni a 1280 px (ver «Tipografía» en la sección 7).

    **Optimización 3, hilo principal (28-10-2026, sin medir aún con Lighthouse):**

    | Chunk (gzip) | Antes | Después |
    |---|---|---|
    | Principal (`index`) | 161,3 KB (502,5 KB sin comprimir) | 133,5 KB (408,9 KB) |
    | Landing (`routes`) | 50,3 KB (184,6 KB) | 15,8 KB (66,0 KB) |
    | Inicial de la landing (suma) | 211,6 KB | 149,3 KB (−29 %) |

    Fuera de la carga inicial: `LetyIaAndWhyUs` (Inteligencia Artificial, Proyectos con
    Radix Dialog y `tailwind-merge`, «¿Por qué?»; 29,6 KB, con `React.lazy` + `Suspense`,
    sigue en el HTML del SSR), chat 3,6 KB, banner 1,4 KB, panel de accesibilidad
    1,1 KB, `sonner` 9,4 KB (el `<Toaster>` se monta al quedar libre el navegador y los
    avisos usan `notify()` de `src/lib/notify.ts`, que importa `sonner` bajo demanda) y
    los textos legales, que ya solo se descargan en su página (sus metadatos están en
    `src/lib/legal-meta.ts` para que el `head()` no arrastre el contenido). Se quitó
    React Query (sin uso). `recharts` y los componentes de `components/ui` sin usar no
    estaban en el bundle (el build ya los descartaba). También: Turnstile solo cerca del
    formulario, videos solo a la vista (el del hero tras el LCP) y, en pantallas de
    menos de 768 px, sin animaciones decorativas continuas (las mismas reglas que el
    movimiento reducido, más la señal del header y el pulso de WhatsApp) y desenfoques
    de fondo de 4 px.

    **Fallo corregido de paso:** no había ningún `<Toaster>` montado, así que ninguno de
    los avisos del formulario de contacto (campos obligatorios, consentimiento,
    Turnstile, demasiados intentos, error de envío, éxito) se mostraba. Ahora se
    muestran arriba en el centro.

    Chrome avisa de que la fuente precargada «no se usó en unos segundos», pero en el
    build de producción se descarga una sola vez (por la precarga) y la usa el texto:
    es un falso positivo.

    **Optimización 4, caché de estáticos (28-10-2026):** ver `public/_headers` en la
    sección 9.

    **Medición después (28-10-2026, misma configuración que la línea base):** build de
    producción servido con Wrangler en local, Lighthouse 12.8.2, Chrome 156 headless con
    perfil limpio, 3 corridas en móvil (mediana) y 1 en escritorio. Reportes HTML en
    `documentacion/lighthouse/2026-10-27-despues/` (la carpeta lleva la fecha del plan;
    las corridas son del 28-10-2026).

    | Métrica | Móvil antes | Móvil después | Escritorio antes | Escritorio después |
    |---|---|---|---|---|
    | Rendimiento | 53 | **75** | 80 | **96** |
    | FCP | 4,9 s | **2,6 s** | 1,2 s | **0,6 s** |
    | LCP | 10,5 s | **4,2 s** | 2,2 s | **0,9 s** |
    | TBT | 260 ms | **140 ms** | 5 ms | **0 ms** |
    | CLS | 0 | **0** | 0,029 | **0** |
    | Speed Index | 7,7 s | **6,4 s** | 2,4 s | **1,8 s** |
    | Peso total | 3.073 KiB | **1.221 KiB** | 3.067 KiB | **1.215 KiB** |
    | Accesibilidad | 96 | 96 | 96 | 96 |
    | Buenas prácticas | 79 | **100** | 78 | **100** |
    | SEO | 100 | 100 | 100 | 100 |

    Móvil por corrida: rendimiento 73 / 75 / 76; LCP 4,2 / 4,3 / 4,2 s; TBT 210 / 140 /
    108 ms.

    **El móvil no llega a 85.** Elemento LCP: ahora es el **poster del video de fondo del
    hero** (`<video poster="/video_inicio.webp">`, que ocupa más que la tarjeta de fotos);
    fases: TTFB 496 ms, carga 0 ms y **retraso de renderizado 3.764 ms**. Las 5
    oportunidades que quedan (corrida mediana):
    1. Retraso de renderizado del LCP: ~1.750 ms de ahorro estimado. El hilo principal
       está ocupado al inicio: 4,7 s de trabajo, de ellos 2,3 s de estilo y layout, con
       una tarea larga de 943 ms del documento a ~1 s de cargar.
    2. JavaScript sin usar: 48 KiB del chunk principal (129 KiB), ~300 ms de LCP y
       ~150 ms de FCP.
    3. Trabajo del hilo principal 4,7 s y 13 tareas largas: ~150 ms de TBT.
    4. CSS que bloquea el renderizado: `styles-*.css` (26 KiB), ~150-196 ms de FCP.
    5. Entrega de imágenes: 46 KiB (técnico 20 KiB y Cali 12 KiB del carrusel del hero,
       que se descargan al inicio aunque empiezan ocultos; posters y logo), ~150 ms de
       LCP.
    Además, el video del hero (727 KiB) sigue entrando en la medición porque arranca
    tras el LCP. Buenas prácticas pasó de 79 a 100 (ya no hay cookie de terceros
    `__cf_bm` ni recursos de Google).

    **Optimización 5, móvil (28-10-2026):**
    - `content-visibility: auto` con `contain-intrinsic-size: auto <alto>` en
      `#nosotros`, `#servicios`, `#inteligencia-artificial`, `#proyectos`, `#por-que`,
      `#contacto` y `#ubicacion` (alturas medidas a 360, 768 y 1280 px, al final de
      `styles.css`). Ninguna contiene elementos fixed/sticky. Comprobado: los enlaces del
      menú y los saltos por `#hash` llevan a la sección y no saltan al pintarse (solo
      `#ubicacion` se movió 12 px a 360 px); la altura total de la página cambia 0 px
      (360) y 18 px (1280) al recorrerla.
    - Hero en móvil (< 768 px): sin video de fondo (`desktopOnly`), sin el resplandor
      difuminado detrás de la tarjeta de fotos y sin el pulso del punto de la etiqueta
      superior. Escritorio sin cambios (capturas comparadas a 360 y 1280 px).
    - Carrusel del hero: las fotos 2 y 3 solo se montan (y descargan) cuando la primera
      ya se pintó y el navegador queda libre; la rotación empieza entonces.
    - JavaScript sin usar (48 KiB del chunk principal): no se quitó. El chunk es ya casi
      solo el marco (`react-dom` 202 KiB, router y Start ~90 KiB, `seroval` 24 KiB) y el
      catálogo de traducciones (37 KiB, con el inglés sin usar cuando el idioma es
      español). Reducirlo exigiría tocar el framework/router o cargar las traducciones
      de forma asíncrona en todo el sitio (SSR y cambio de idioma incluidos).
    - Pendiente conocido (ya existía): el header es `sticky` y las secciones no tienen
      `scroll-margin-top`, así que al saltar a una sección su parte superior queda bajo
      el header (en escritorio, unos 40 px del título).

    **Medición tras la optimización 5** (misma configuración; reportes en
    `documentacion/lighthouse/2026-10-28-optim5/`):

    | Móvil (mediana de 3) | Línea base | Tras optim. 4 | Tras optim. 5 |
    |---|---|---|---|
    | Rendimiento | 53 | 75 | **81** |
    | FCP | 4,9 s | 2,6 s | **2,5 s** |
    | LCP | 10,5 s | 4,2 s | **3,7 s** |
    | TBT | 260 ms | 140 ms | **100 ms** |
    | CLS | 0 | 0 | **0** |
    | Speed Index | 7,7 s | 6,4 s | **5,3 s** |
    | Peso total | 3.073 KiB | 1.221 KiB | **494 KiB** |
    | Accesibilidad / Buenas prácticas / SEO | 96 / 79 / 100 | 96 / 100 / 100 | **96 / 100 / 100** |

    | Escritorio (1 corrida) | Línea base | Tras optim. 4 | Tras optim. 5 |
    |---|---|---|---|
    | Rendimiento | 80 | 96 | **96** |
    | FCP | 1,2 s | 0,6 s | **0,7 s** |
    | LCP | 2,2 s | 0,9 s | **0,9 s** |
    | TBT | 5 ms | 0 ms | **0 ms** |
    | CLS | 0,029 | 0 | **0** |
    | Speed Index | 2,4 s | 1,8 s | **1,8 s** |
    | Peso total | 3.067 KiB | 1.215 KiB | **1.216 KiB** |
    | Accesibilidad / Buenas prácticas / SEO | 96 / 78 / 100 | 96 / 100 / 100 | **96 / 100 / 100** |

    Móvil por corrida: rendimiento 79 / 82 / 81; LCP 3,9 / 3,4 / 3,7 s; CLS 0 / 0,145 /
    0. El LCP sigue siendo el poster del video del hero (retraso de renderizado 3,3 s;
    trabajo del hilo principal 3,7 s, de ellos 1,9 s de estilo y layout).

    **CLS de 0,145 en una corrida (la que Lighthouse marcó con CPU más lenta):**
    reproducido retrasando la fuente 3 s a 412 px. La etiqueta «Sede Principal en
    Cali • Cobertura Nacional en Colombia» (`text-xs font-bold`) mide 338 px con Nunito
    y 332 px con la reserva, con 336 px disponibles: con la reserva cabe en una línea y
    al llegar Nunito pasa a dos, y todo el hero baja 18 px. Solo ocurre si la fuente
    llega después del primer pintado y en anchos de ~410 px. Opciones: `font-display:
    optional` para Nunito (sin cambio de fuente tras el primer pintado; en una primera
    visita lenta se vería la reserva) o reservar dos líneas para esa etiqueta por debajo
    de 640 px.

## 12. Operación y privacidad del formulario

La captura de leads está implementada en `src/routes/api.contacto.ts` y usa Supabase
desde el servidor; no cambiar el camino de persistencia sin una decisión explícita. Mantener
la URL y la service-role key exclusivamente en variables de entorno de servidor. La
clave service-role tiene privilegios elevados y no debe aparecer en código cliente,
logs, documentación ni variables `VITE_*`.

Pendiente: verificar esquema/RLS/políticas de acceso de la tabla
`solicitudes_contacto`, validar con el responsable de datos el contenido de la política,
definir retención/borrado y probar la inserción en staging de extremo a extremo. El
anti-spam (Turnstile + honeypot) y la higiene de errores ya están implementados; el rate
limit por IP es en memoria y conviene complementarlo con un mecanismo distribuido.

### Variables de entorno

Solo en servidor (nunca con prefijo `VITE_` ni en el cliente):

- `SUPABASE_URL`: URL del proyecto Supabase usada por `api.contacto.ts`.
- `SUPABASE_SERVICE_ROLE_KEY`: clave service-role de Supabase; privilegios elevados.
  Solo se usa en el servidor para insertar en `solicitudes_contacto`.
- `MAKE_CHAT_WEBHOOK_URL`: webhook HTTPS de Make para `/api/chat` (ver sección 8).
- `TURNSTILE_SECRET_KEY`: clave secreta de Cloudflare Turnstile. Si falta,
  `api.contacto.ts` responde `503` con `contacto_unavailable` antes de `siteverify` y
  Supabase, sin usar claves de prueba; debe configurarse antes de desplegar.
- `TURNSTILE_ALLOWED_HOSTNAMES`: hostnames permitidos para el token de Turnstile,
  separados por comas (p. ej. `telcobras.com,www.telcobras.com`). Si falta en
  producción, `api.contacto.ts` responde `503` (fail-closed); en desarrollo se añaden
  `localhost` y `127.0.0.1`.

Pública de compilación:

- `VITE_TURNSTILE_SITE_KEY`: site key pública del widget (`TurnstileWidget.tsx`). Es
  pública por diseño; si falta, el widget no se carga y el formulario queda deshabilitado
  con un aviso. No se usa ninguna site key de prueba. No confundirla con la secreta.

Local: definir estas variables en `.env.local` (ignorado por Git). En Cloudflare,
guardar las secretas con `wrangler secret put <NOMBRE>`. `.env.example` lista todas las
variables con un comentario (sin valores).

No crear un endpoint público para listar todas las solicitudes sin autenticación y
autorización. Evitar registrar datos personales completos en logs.

## 13. Guía de navegación rápida para otra IA

| Si la tarea trata de... | Empezar por... |
|---|---|
| Metadatos, JSON-LD, orden o composición de página | `src/routes/index.tsx` |
| Navegación global, WhatsApp, shell o errores raíz | `src/routes/__root.tsx` |
| Sitemap, robots y recursos estáticos públicos | `public/sitemap.xml`, `public/robots.txt` |
| Cabeceras de seguridad y CSP activa | `src/server.ts` |
| Escaneo de secretos, hooks y CI | `.gitleaks.toml`, `.githooks/pre-commit`, `.github/workflows/gitleaks.yml` |
| Servicios, pestañas, videos o rotación | `src/components/ServicesSection.tsx` |
| Chat visual, sesión, foco o errores en UI | `src/components/FloatingChatbot.tsx` |
| Contrato y proxy de Make | `src/routes/api.chat.ts` y `README.md` |
| Formulario, mapa, datos de contacto y footer | `src/components/ContactAndFooter.tsx` |
| Widget y validación de Turnstile | `src/components/TurnstileWidget.tsx`, `src/routes/api.contacto.ts` |
| Páginas legales y enlaces del footer | `src/routes/politica-de-privacidad.tsx`, `src/routes/terminos-de-servicio.tsx`, `src/routes/sla.tsx`, `src/components/LegalDocument.tsx` |
| Textos de Términos y SLA (valores del SLA en `SLA_VALUES`) | `src/lib/terms-content.ts`, `src/lib/sla-content.ts` |
| Datos de marca, catálogo de servicios/proyectos | `src/lib/telcobras-data.ts` |
| Proyectos: bento, modal, orden de tarjetas | `src/components/ProjectsSection.tsx` |
| Métricas del hero e iluminación rotativa | `src/components/HeroAndMetrics.tsx` |
| Diferenciales, red sincronizada, video girado | `src/components/WhyUsSection.tsx` |
| Borde iluminado o rotación compartidos | `src/components/BrandGlowBorder.tsx`, `src/hooks/use-rotating-highlight.ts` |
| Estilos globales, Tailwind v4, tokens y animaciones | `src/styles.css` y `src/routes/__root.tsx` |
| CSS: import, `<link>` y hash del build | `src/routes/__root.tsx:14` y `.output/public/assets/styles-*.css` |
| Despliegue: artefacto, assets y wrangler | `.output/` y `.wrangler/deploy/config.json` |
| Pruebas (aún vacías) | `vitest.config.ts`, `playwright.config.ts`, `e2e/`, `*.test.ts(x)` |
| Destino Cloudflare, plugins y entrada SSR | `vite.config.ts` y `src/server.ts` |
| Configuración de rutas | `src/router.tsx`, `src/routes/README.md` |
