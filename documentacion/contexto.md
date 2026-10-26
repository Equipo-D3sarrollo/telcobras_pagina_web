# Contexto técnico del proyecto TELCOBRAS

Este documento está pensado como punto de entrada para una persona desarrolladora o
una inteligencia artificial que deba continuar el proyecto. Resume la arquitectura,
los módulos, los flujos de datos, las integraciones, las convenciones y los problemas
conocidos. Debe actualizarse cuando cambien la arquitectura o las capacidades descritas.

> Última revisión integral: **22-10-2026**. Se verificaron el pipeline de CSS/Tailwind,
> el build de Nitro/Cloudflare y el estado de Git; ver secciones 7, 9 y 11.

## 1. Instrucciones para quien continúe el proyecto

- Leer este documento y `AGENTS.md` antes de modificar código.
- El proyecto está conectado a AI Studio. No reescribir historia Git ya publicada:
  no hacer force-push, rebase, amend ni squash de commits publicados.
- Revisar `git status` antes de editar. Puede haber cambios locales no relacionados;
  no descartarlos ni incluirlos accidentalmente.
- `src/routeTree.gen.ts` es generado por TanStack Router. No modificarlo manualmente.
- `conexion.php` (raíz) es un ejemplo aislado de conexión a MySQL con PDO. No forma
  parte de la aplicación TanStack/Nitro y el despliegue en Cloudflare no lo ejecuta.
  Mantener sus credenciales solo en variables de entorno del servidor.
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
- La optimización de imágenes para Core Web Vitals está aplicada en los componentes
  principales: la imagen principal del hero usa `loading="eager"` +
  `fetchPriority="high"` y las demás son `loading="lazy"`; todas declaran `width`/`height`
  explícitos (evita CLS) y `decoding="async"`. Las imágenes de proyecto, aliados y
  ubicación se cargan de forma diferida.
- `public/sitemap.xml` está generado con las cuatro URLs públicas (`/`,
  `/politica-de-privacidad`, `/terminos-de-servicio`, `/sla`) bajo
  `https://telcobras.com`, con `<lastmod>` y código HTTP 200. `public/robots.txt`
  declara `Sitemap: https://telcobras.com/sitemap.xml`.
- El componente `CookieBanner` persiste la elección del usuario en `localStorage`
  bajo `telcobras_cookie_consent` y no vuelve a renderizar cuando ya existe la clave.
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
- Tipografía principal: Nunito, cargada desde Google Fonts en el shell raíz.
- `vitest`, `jsdom`, Testing Library, `axe-core` y Playwright están instalados, pero
  sus archivos de configuración y pruebas siguen vacíos (0 bytes); no hay suite
  ejecutable ni script `test`.
- `conexion.php` es un ejemplo independiente en PHP (MySQL con PDO, `mysql:`), ajeno
  al stack React/TanStack. No hay relación con `src/routes/api.chat.ts` ni con el
  formulario de contacto.

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
│   ├── router.tsx                  # Crea router y QueryClient
│   ├── server.ts                   # Adaptador SSR, CSP y normalización de errores
│   ├── start.ts                    # Middleware de servidor y CSRF para server functions
│   └── styles.css                  # Tema, tokens y estilos globales/animaciones
├── conexion.php                    # Ejemplo aislado de conexión a MySQL con PDO (PHP)
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
- `src/components/ContactAndFooter.tsx`: footer semántico, redes sociales, consent
  legal, formulario, mapa, ubicación y enlaces legales.
- `src/components/CookieBanner.tsx`: aceptación/rechazo de cookies y persistencia en
  `localStorage`.
- `src/components/TurnstileWidget.tsx`: widget de Cloudflare Turnstile usado por el
  formulario de contacto (carga explícita del script, callback, reset y errores).
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
- Compone la landing en este orden: `HeaderNav`, `HeroAndMetrics`,
  `AboutAndValues`, `ServicesSection`, `LetyIaAndWhyUs`,
  `ContactAndFooter` y `ScrollToTopButton`.
- El formulario, ubicación y footer están juntos dentro de `ContactAndFooter`.

### `src/routes/__root.tsx`

- Es el shell de todas las rutas: `RootShell` define `<html>`, `<head>` con
  `<HeadContent />`, `<body>` con los children y `<Scripts />`; `RootComponent` monta
  `<Outlet />`, los providers y los controles globales.
- Importa el CSS global con `import appCss from "../styles.css?url"` (línea 14) y lo
  publica en `head.links` como `{ rel: "stylesheet", href: appCss }` (líneas 120-127).
  En el build, `appCss` resuelve a `/assets/styles-<hash>.css`; el mismo hash debe
  aparecer en el bundle cliente y en el SSR. No hay `index.html` ni `src/main.tsx`.
- Monta globalmente `FloatingChatbot` y `WhatsAppFloatingButton` (enlace flotante a
  `wa.me` con el número comercial de `CONTACT`). Ambos viven en este archivo.
- Carga la tipografía Nunito desde Google Fonts: las etiquetas `<link rel="preconnect">`
  a `https://fonts.googleapis.com` y `https://fonts.gstatic.com` (esta última con
  `crossOrigin="anonymous"`), más el `<link rel="stylesheet">` de la familia Nunito y
  `styles.css`. Las `preconnect` se declaran en `head.links` del shell raíz, que es la
  forma de inyectar `<link>` en el `<head>` con TanStack Router; no deben duplicarse
  como JSX dentro del `<body>`. La CSP de `src/server.ts` permite ambos orígenes.
- Tiene los componentes raíz de error (`ErrorComponent`, con `reportVibeError`) y 404.
- El 404 (`NotFoundComponent`) ofrece dos salidas claras: «Ir al inicio» (`<Link to="/">`)
  y «Ver servicios» (`<Link to="/" hash="servicios">`, que produce `/#servicios` y
  desplaza a la sección de servicios). Los textos salen de `errors.home` y
  `errors.services` de `src/lib/translations.ts` (ES/EN).
- El loader raíz obtiene las preferencias de accesibilidad desde la cookie
  `telcobras_a11y` en el servidor y las aplica a los atributos de `<html>`, incluido
  `lang`, antes de renderizar. El idioma predeterminado es `es`.
- `src/components/CookieBanner.tsx` se monta desde el shell global. Guarda la elección
  en `localStorage` bajo `telcobras_cookie_consent` (esenciales siempre activas y una
  preferencia booleana para las no esenciales); si la clave existe, no vuelve a mostrar
  el banner. El control registra la preferencia, pero la carga/ejecución de cookies de
  terceros debe conectarse a esa preferencia si se incorporan esas integraciones.
- Si se añaden rutas, no eliminar `<Outlet />`.

### Preferencias de accesibilidad

- `src/lib/accessibility-preferences.ts` define el esquema, los valores por defecto y la
  validación de las preferencias recibidas desde la cookie.
- `src/lib/accessibility-preferences.server.ts` lee la cookie con las utilidades de
  petición de TanStack Start; el loader de la ruta raíz comparte el resultado con el
  shell SSR y la interfaz.
- `src/components/AccessibilityMenu.tsx` proporciona el estado global y un control
  flotante inferior izquierdo con opciones de apariencia (sistema/claro/oscuro), tamaño
  de texto (100/125/150/200 %), idioma (español/inglés), modo daltonismo y restauración
  de valores predeterminados.
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
- Usa `LOGO_URL` y constantes de contacto de `telcobras-data.ts`.
- El estilo real (glass, links, indicadores) vive en clases de `styles.css`:
  `header-topbar`, `header-topbar-icon`, `header-glass`, `header-glass-panel`,
  `header-nav-link` (y `--block`), `header-cta`.

### `src/components/HeroAndMetrics.tsx`

- Hero de inicio: badge «Sede Principal en Cali • Cobertura Nacional», titular con
  degradado de marca, dos CTA (`#contacto` y `#servicios`) y eslogan «Una nueva forma
  de entender las redes».
- Fondo de video `/video_inicio.mp4`.
- Tarjeta lateral con rotación automática de tres imágenes (`HERO_SLIDES`:
  `HERO_PHOTO`, `TECHNICIAN_PHOTO`, `CALI_PHOTO`) cada 4 segundos y una tarjeta
  superpuesta «Infraestructura de Red Propia».
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
- Referencia `/video_tel.mp4` como fondo. **Estado de recurso a revisar:** al revisar
  `public/`, ese archivo no aparecía allí, aunque existe `video_tel.mp4` en la raíz
  del repositorio. Los recursos estáticos deben residir en `public/`; comprobar y
  copiarlo allí si se desea que el fondo cargue.
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
- Usa `<video autoPlay loop muted playsInline>`; la `key` por ID ayuda a recrear
  el reproductor al cambiar de pestaña. Overlay oscuro (`bg-slate-950/75`) para
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

Reúne tres bloques en un solo componente: `#contacto`, `#ubicacion` y el pie de página.

- Contacto con teléfono, correo, dirección y redes sociales (Facebook, Instagram,
  LinkedIn; los `href` son genéricos `facebook.com`/`instagram.com`/`linkedin.com` sin
  perfil real todavía). Las tarjetas de datos usan `brand-glow-hover` + `BrandGlowBorder`.
- Formulario «Solicitud de Cotización o Diagnóstico». El `<select>` de servicio ofrece
  las opciones del portafolio (Conectividad, Seguridad, Colaboración, Nube híbrida,
  IA integrada, Agentes con IA, Solución integral).
- `#ubicacion`: mapa de Google embebido de la sede en Cali y botón «Cómo llegar» con
  enlace de indicaciones.
- Footer con logo, eslogan, copyright dinámico y enlaces informativos.
- Fondo decorativo: SVG de red (`network-flow`, `contact-node-pulse`) sobre la imagen de
  Cali; se pausa con `data-animations-paused` controlado por `IntersectionObserver`
  (`sectionRef`/`isInView`), con el mismo criterio que `WhyUsSection`.

El formulario hace `POST /api/contacto` y muestra éxito solo si el endpoint responde
con estado HTTP exitoso. El servidor valida el JSON y longitudes, exige
`consentimiento: true` y persiste el registro en Supabase, tabla
`solicitudes_contacto`, usando `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del entorno
de servidor. `conexion.php` continúa siendo un ejemplo aislado de MySQL/PDO, no usado
por la aplicación.

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
alineados para esos campos.

El formulario recopila nombre, empresa, cargo, correo, teléfono, servicio, mensaje y
consentimiento; nombre, correo y teléfono son obligatorios en cliente y servidor.
La ruta interna `/politica-de-privacidad` describe los tratamientos conocidos en la
aplicación. El responsable de datos debe revisar y confirmar especialmente las bases
jurídicas, proveedores/transferencias, retención, acceso y borrado antes de tratarla como
política legal aprobada.

### `src/components/FloatingChatbot.tsx`

- Chat flotante con bienvenida cerrable, botón de robot, historial en memoria mientras
  está montado, mensajes de usuario/asistente, loading indicator (tres puntos) y
  mensajes de error.
- El botón colapsado es un robot animado (`chatbot-robot-vibrate` + `animate-bounce`) y
  la invitación («¡Hola! ¿Necesitas ayuda?») usa `chatbot-invite-animation`.
- La sesión se guarda en `localStorage` bajo `telcobras_session_id`; si falta se crea
  con `crypto.randomUUID()`. Si el acceso a `localStorage` falla, usa un UUID
  temporal y registra el error.
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

- URLs alojadas externamente (`vibe.filesafe.space`): `LOGO_URL`, `HERO_PHOTO`,
  `TECHNICIAN_PHOTO`, `CALI_PHOTO`.
- Paleta de marca (`BRAND_COLORS`: azul `#0087C3`, verde `#88BD4C`, amarillo
  `#F3CB35`, gris `#888D91`, navy `#0A192F`).
- Datos de contacto (`CONTACT`: teléfono, WhatsApp, correo, dirección) y el teléfono
  del chatbot (`CHATBOT_PHONE`).
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
- Define tokens semánticos y fuente Nunito.
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
  (`cloudflare-module`) y `vite.config.ts:11-13` solo activa
  `nitro.cloudflare.nodeCompat`. No existe `nitro.json`; el
  `.output/server/wrangler.json` generado fija `compatibility_date: 2026-10-22`
  (coincide con la fecha de ese build).
- `npm run build` escribe el artefacto canónico en `.output/` (cliente en
  `.output/public/`, servidor en `.output/server/`). `dist/` es un build legado del
  7-10-2026 y no debe desplegarse.
- `.wrangler/deploy/config.json` apunta a `.output/server/wrangler.json`. Ese archivo
  declara `main: index.mjs`, `assets.binding: ASSETS`, `assets.directory: ../public`,
  `compatibility_flags: ["nodejs_compat"]`, `no_bundle: true` y reglas ESModule.
- `.output/server/index.mjs` incluye `public_assets_data_default`, el mapa de assets
  públicos; el CSS aparece como `/assets/styles-<hash>.css` con
  `type: "text/css; charset=utf-8"`. `.output/public/_headers` solo añade
  `cache-control: public, max-age=31536000, immutable` para `/assets/*`; no hay
  `_routes.json` ni `_redirects`.
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
  el recurso en lugar de solo reportarse. La CSP permite Turnstile, Google
  Fonts, el iframe de Google Maps y `vibe.filesafe.space`; en desarrollo añade
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
- `src/router.tsx` construye QueryClient y el router con restauración de scroll.
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
| `logo_aquora.png` | Aliado Aquora |
| `logo_xpertic.png` | Aliado Xpertic |
| `robots.txt` | Reglas básicas para rastreo + referencia al sitemap |
| `sitemap.xml` | Mapa del sitio con las cuatro URLs públicas (`/`, `/politica-de-privacidad`, `/terminos-de-servicio`, `/sla`) bajo `https://telcobras.com`, con `<lastmod>` |

**Versionado:** al auditar el repositorio, todos los recursos de la tabla de `public/`
estaban versionados en Git. `video_tel.mp4` existe en la raíz del repositorio, pero no
en `public/`; el componente Quiénes Somos pide `/video_tel.mp4`, por lo que esa
referencia produce un 404 salvo que se copie el recurso a `public/`.

Los archivos de la carpeta `public/` se sirven desde raíz (por ejemplo,
`public/video_inicio.mp4` se solicita como `/video_inicio.mp4`). También existen
copias originales de algunos medios en la raíz del repositorio; el código de navegador
no debería apuntar a esos archivos raíz.

Las fotos de hero, sede y otras secciones usan URLs externas alojadas en
`vibe.filesafe.space`. Si la entrega debe funcionar sin ese proveedor, habrá que
descargarlas con autorización y migrarlas a `public/`.

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
  `robots.txt`.
- Optimización de imágenes para Core Web Vitals: `loading`/`decoding`/`fetchPriority`
  explícitos y `width`/`height` declarados para evitar CLS y priorizar el LCP.
- `preconnect` a Google Fonts y `fonts.gstatic.com` en el shell global (`head.links`).
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
- `conexion.php`: ejemplo aislado de conexión a MySQL con PDO (no integrado).

### Pendiente/por confirmar

1. **Estado Git al 22-10-2026:** `HEAD` y la rama
   `feature/footer-seguridad-alejandro` están en `680eeb3`; `origin/main` está en
   `b299546` (merge del PR #1 de esa rama) y `origin/feature/...` en `680eeb3`. La
   rama local `main` sigue en `680eeb3`, un commit por detrás de `origin/main`; no
   hace falta reescribir historia. El árbol de trabajo tiene cambios sin commitear
   (hardening de secretos, CSP, estilos, documentación, Turnstile y rutas legales):
   revisar `git status` y no descartarlos. El push directo a
   `Equipo-D3sarrollo/telcobras_pagina_web` seguía limitado por permisos de la cuenta
   en la última comprobación; `origin` (`guidogonzalez21/telcobras-web`) es el remoto
   operativo.
2. **Pruebas y validaciones:** `npm exec eslint -- .` pasa con 0 errores y 6
   advertencias de `react-refresh/only-export-components` en componentes UI
   compartidos; `npx tsc --noEmit` pasa; `gitleaks` revisó 31 commits sin hallazgos.
   Los archivos `src/components/AccessibilityMenu.test.tsx`,
   `src/lib/accessibility-preferences.test.ts`, `e2e/accessibility.spec.ts`,
   `vitest.config.ts` y `playwright.config.ts` siguen vacíos (0 bytes): no hay pruebas
   efectivas ni script `test`. Existe un build en `.output/` (22-10-2026 13:09), pero
   es anterior a la última edición de `src/server.ts` (13:21); no se ejecutó un build
   nuevo en esta revisión por la regla de no levantar servidores/compilar. Reconstruir
   antes de desplegar.
3. **Make:** ejecutar una prueba exitosa de extremo a extremo y revisar salida del módulo
   Webhook response; hay históricos de respuestas upstream inválidas.
4. **Video de Quiénes Somos:** `AboutAndValues.tsx` pide `/video_tel.mp4`, pero solo
   existe en la raíz, no en `public/`; colocar una copia autorizada en `public/` o
   actualizar/eliminar la referencia para evitar 404.
5. **Rotación automática de Servicios:** rota incluso sin interacción y cambia también
   si el visitante seleccionó manualmente una pestaña. Si UX requiere pausar/reiniciar
   el reloj tras interacción o al salir de viewport, implementar explícitamente.
6. **Peso de videos:** revisar compresión, dimensiones, poster, carga diferida y política
   de reproducción móvil, especialmente para `video_agentes.mp4`.
7. **Privacidad y textos legales:** `/politica-de-privacidad` está implementada y el
   formulario exige consentimiento. `/terminos-de-servicio` y `/sla` ya muestran sus
   textos completos, pero están pendientes de aprobación de gerencia y revisión
   jurídica, incluidos los valores de `SLA_VALUES` en `src/lib/sla-content.ts`. Revisar también bases
   jurídicas, proveedores/transferencias, retención, acceso y borrado de la política.
8. **Protección de endpoints HTTP:** `/api/contacto` ya tiene Turnstile y rate limit por
   IP; este último es en memoria y no distribuido, así que con varias instancias de
   Worker el límite efectivo se multiplica. `/api/chat` todavía no tiene limitación de
   tasa y puede disparar llamadas al webhook. Considerar Cloudflare Rate Limiting o un
   almacén compartido y revisar política de origen/CSRF. Mantener los mensajes de error
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
14. **Accesibilidad del movimiento:** el robot y los puntos de carga del chatbot usan
    `animate-bounce` sin `motion-safe:`. `chatbot-robot-vibrate` y `ally-logo-rotation`
    tampoco tienen regla de movimiento reducido; la invitación del chatbot sí tiene un
    tratamiento específico en `styles.css`.
15. **Por confirmar con el cliente:** textos nuevos de los diferenciales, colores por
    tarjeta, si con movimiento reducido la tarjeta activa debe seguir creciendo, y
    categorías/subtítulo de Proyectos.
16. **CSP en modo bloqueante:** la cabecera `Content-Security-Policy` ya se aplica de
    forma permanente desde `src/server.ts`. Vigilar en el primer despliegue en producción
    que no haya violaciones por recursos de terceros no contemplados (por ejemplo, si
    Google Maps incrusta algo adicional o si Turnstile cambia sus dominios) y resolver
    cualquier bloqueo antes de propagarlo al equipo. Siguiente paso de endurecimiento:
    sustituir `'unsafe-inline'` por nonces/hashes en `script-src` y añadir `report-to`
    con un endpoint de recogida de Reports CSP. El build actual de `.output/` es
    anterior a la restauración de la CSP bloqueante; reconstruir antes del despliegue.
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
19. **`.env.example`:** `.gitignore` ya permite versionar `*.example`, pero no existe un
    `.env.example` en el repo. Crear uno con nombres de variables (sin valores) para
    onboarding: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MAKE_CHAT_WEBHOOK_URL`,
    `TURNSTILE_SECRET_KEY`, `VITE_TURNSTILE_SITE_KEY`.

## 12. Operación y privacidad del formulario

La captura de leads está implementada en `src/routes/api.contacto.ts` y usa Supabase
desde el servidor; no cambiarla por el ejemplo PHP sin una decisión explícita. Mantener
la URL y la service-role key exclusivamente en variables de entorno de servidor. La
clave service-role tiene privilegios elevados y no debe aparecer en código cliente,
logs, documentación ni variables `VITE_*`.

En la raíz existe `conexion.php`, un ejemplo de conexión a MySQL con PDO (DSN `mysql:`,
credenciales por variables de entorno `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASS`/
`DB_CHARSET`, `ERRMODE_EXCEPTION`, `EMULATE_PREPARES=false`). Es solo material de
referencia: Cloudflare Workers no ejecuta PHP, así que no reemplaza a D1 ni a un backend
Node del stack actual y no debe usarse como el camino de persistencia del formulario.

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

Pública de compilación:

- `VITE_TURNSTILE_SITE_KEY`: site key pública del widget (`TurnstileWidget.tsx`). Es
  pública por diseño; si falta, el widget no se carga y el formulario queda deshabilitado
  con un aviso. No se usa ninguna site key de prueba. No confundirla con la secreta.

Local: definir estas variables en `.env.local` (ignorado por Git). En Cloudflare,
guardar las secretas con `wrangler secret put <NOMBRE>`. No hay `.env.example`
versionado todavía (ver pendiente 19).

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
| Ejemplo de conexión a MySQL (PHP/PDO) | `conexion.php` |
| Estilos globales, Tailwind v4, tokens y animaciones | `src/styles.css` y `src/routes/__root.tsx` |
| CSS: import, `<link>` y hash del build | `src/routes/__root.tsx:14` y `.output/public/assets/styles-*.css` |
| Despliegue: artefacto, assets y wrangler | `.output/` y `.wrangler/deploy/config.json` |
| Pruebas (aún vacías) | `vitest.config.ts`, `playwright.config.ts`, `e2e/`, `*.test.ts(x)` |
| Destino Cloudflare, plugins y entrada SSR | `vite.config.ts` y `src/server.ts` |
| Configuración de rutas | `src/router.tsx`, `src/routes/README.md` |
