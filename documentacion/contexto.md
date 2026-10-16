# Contexto técnico del proyecto TELCOBRAS

Este documento está pensado como punto de entrada para una persona desarrolladora o
una inteligencia artificial que deba continuar el proyecto. Resume la arquitectura,
los módulos, los flujos de datos, las integraciones, las convenciones y los problemas
conocidos. Debe actualizarse cuando cambien la arquitectura o las capacidades descritas.

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
  corresponda. El proyecto no define actualmente un script de pruebas automatizadas.
- Mantener la interfaz, mensajes y documentación del producto principalmente en español.
- No ejecutar `npm run build` con el servidor de desarrollo activo: en Windows Vite
  vigila `.output/` y se cae con `EBUSY`. Detener el servidor, compilar y volver a
  levantarlo.
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

## 3. Stack y ejecución

- React 19 y TypeScript.
- TanStack Start y TanStack Router (rutas basadas en archivos).
- Vite 8 como servidor de desarrollo y compilador.
- Tailwind CSS 4, `tw-animate-css`, Radix UI y `lucide-react`.
- TanStack Query está configurado en el contexto del router.
- Nitro genera el despliegue para Cloudflare; `nodeCompat` está habilitado.
- Tipografía principal: Nunito, cargada desde Google Fonts en el shell raíz.
- `conexion.php` es un ejemplo independiente en PHP (MySQL con PDO, `mysql:`), ajeno
  al stack React/TanStack. No hay relación con `src/routes/api.chat.ts` ni con el
  formulario de contacto.

### Comandos del proyecto

```powershell
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm exec eslint -- src/components/NombreComponente.tsx
```

`npm run dev` muestra en consola la URL local disponible, habitualmente
`http://localhost:8080/`. No abrir un HTML local directamente: la aplicación requiere
el servidor de desarrollo. `npm run build` compila cliente y servidor y genera
artefactos en `.output/`.

No hay script `test` en `package.json` ni se encontró una suite de pruebas del producto.
Usar lint, build y comprobaciones manuales/navegador hasta que se agreguen pruebas.

## 4. Estructura del repositorio

```text
.
├── documentacion/
│   └── contexto.md                 # Esta guía de traspaso
├── public/                         # Recursos estáticos servidos desde /
├── src/
│   ├── components/                 # Secciones y controles de la interfaz
│   │   └── ui/                     # Primitivas reutilizables estilo shadcn/Radix
│   ├── hooks/                      # Hooks compartidos (móvil, rotación de resaltado)
│   ├── lib/                        # Datos, preferencias, utilidades y manejo de errores
│   ├── routes/                     # Rutas TanStack Start
│   ├── routeTree.gen.ts            # Generado automáticamente; no editar
│   ├── router.tsx                  # Crea router y QueryClient
│   ├── server.ts                   # Adaptador SSR y normalización de errores
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

`node_modules/`, `dist/` y `.output/` son dependencias/artefactos generados. No editar
ni versionar esos directorios. `*.local` está ignorado por Git; `.env.local` puede
contener configuración privada, así que no debe abrirse ni reproducirse en informes.

## 5. Composición de la aplicación y rutas

### `src/routes/index.tsx`

- Define la ruta `/` y metadatos SEO/Open Graph.
- Compone la landing en este orden: `HeaderNav`, `HeroAndMetrics`,
  `AboutAndValues`, `ServicesSection`, `LetyIaAndWhyUs`,
  `ContactAndFooter` y `ScrollToTopButton`.
- El formulario, ubicación y footer están juntos dentro de `ContactAndFooter`.

### `src/routes/__root.tsx`

- Es el shell de todas las rutas: define `<html>`, metadatos, hojas de estilo,
  `<Scripts />` y `<Outlet />`.
- Monta globalmente `FloatingChatbot` y `WhatsAppFloatingButton` (enlace flotante a
  `wa.me` con el número comercial de `CONTACT`). Ambos viven en este archivo.
- Carga la tipografía Nunito desde Google Fonts (`preconnect` + `stylesheet`) además
  de `styles.css`.
- Tiene los componentes raíz de error (`ErrorComponent`, con `reportVibeError`) y 404.
- El loader raíz obtiene las preferencias de accesibilidad desde la cookie
  `telcobras_a11y` en el servidor y las aplica a los atributos de `<html>`, incluido
  `lang`, antes de renderizar. El idioma predeterminado es `es`.
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
- Esta fase no traduce integralmente la página ni el chatbot al inglés; esa traducción
  continúa pendiente de su fase específica.

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

**Limitación funcional importante:** el formulario todavía no persiste ni envía datos.
`handleSubmit` solo revisa nombre/correo/teléfono en el cliente, establece
`formSubmitted` y muestra toast de éxito. No hace `fetch`, no hay endpoint de contacto.
Existe un `conexion.php` de ejemplo (PHP + MySQL/PDO) en la raíz, pero no está conectado
a este formulario ni a la aplicación. Antes de implementar almacenamiento, decidir
D1/PostgreSQL/Firebase, consentimiento de tratamiento de datos, retención, anti-spam y
canal de notificación. El formulario recopila nombre, empresa, cargo, correo, teléfono,
servicio y mensaje; nombre, correo y teléfono son obligatorios en UI.

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
- Los mensajes de error del backend se traducen a mensajes en español (mapa por código
  de error, incluido `agent_response_unavailable`).
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

- Importa Tailwind y define variables de color/tema mediante OKLCH.
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
  No duplicar plugins manualmente.
- El destino Nitro es Cloudflare y activa `nodeCompat`.
- `src/server.ts` importa dinámicamente la entrada SSR y reemplaza determinadas
  respuestas JSON 500 genéricas de H3 por la página de error del proyecto.
- `src/start.ts` instala middleware de captura de errores y protección CSRF para
  server functions; el filtro solo cubre handlers `serverFn`.
- El endpoint HTTP `/api/chat` tiene su propia validación y controles; no confundir
  la protección CSRF de server functions con validación del endpoint de chat.
- `src/router.tsx` construye QueryClient y el router con restauración de scroll.
- `tsconfig.json` está en modo estricto y define alias `@/*` → `src/*`.
- `components.json` refleja la configuración de componentes tipo shadcn.
- El `README.md` del repositorio cubre el arranque y el contrato/configuración de chat;
  esta guía complementa, no sustituye, la documentación de deploy vigente del proveedor.

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
| `robots.txt` | Reglas básicas para rastreo |

**Versionado:** ya están en Git `public/video_inicio.mp4`,
`public/video_conectividad.mp4`, `public/video_seguridad.mp4`,
`public/video_agentes.mp4` y `public/robots.txt`. Siguen sin versionar
`public/video_colaboracion.mp4`, `public/video_nuve.mp4`, `public/logo_aquora.png` y
`public/logo_xpertic.png` (también hay copias sin versionar de los logos en la raíz).
El código ya los usa: si se suben los componentes sin ellos, la rama conectada a AI
Studio muestra videos y logos rotos (404).

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

0. **Commit pendiente:** hay cambios locales sin commitear (revisar `git status`).
   Sin versionar: `ProjectsSection.tsx`, `WhyUsSection.tsx`, `BrandGlowBorder.tsx`,
   `use-rotating-highlight.ts`, `conexion.php`, `documentacion/` y los recursos de
   `public/` citados arriba. Hay modificaciones sin commitear en `ContactAndFooter`,
   `FloatingChatbot`, `HeaderNav`, `HeroAndMetrics`, `LetyIaAndWhyUs`, `ServicesSection`,
   `ScrollToTopButton`, `telcobras-data.ts` y `styles.css`. Revisar antes
   `src/tailwind.config.vibe.json`, que regenera el plugin `vibe-tagger` al arrancar el
   servidor.

1. **Formulario y base de datos:** aún no hay persistencia ni endpoint. El éxito visual
   del formulario es local; no tratarlo como recepción real. `conexion.php` es solo un
   ejemplo de referencia (PHP/PDO) y no está enlazado al formulario ni al despliegue.
2. **Make:** ejecutar una prueba exitosa de extremo a extremo y revisar salida del módulo
   Webhook response; hay históricos de respuestas upstream inválidas.
3. **Video de Quiénes Somos:** `AboutAndValues.tsx` pide `/video_tel.mp4`, pero el listado
   de `public/` no lo incluye. Verificar la disponibilidad en navegador y colocar el
   archivo en `public/` si corresponde.
4. **Rotación automática de Servicios:** rota incluso sin interacción y cambia también
   si el visitante seleccionó manualmente una pestaña. Si UX requiere pausar/reiniciar
   el reloj tras interacción o al salir de viewport, implementar explícitamente.
5. **Peso de videos:** revisar compresión, dimensiones, poster, carga diferida y política
   de reproducción móvil, especialmente para `video_agentes.mp4`.
6. **Privacidad:** antes de persistir leads, definir consentimiento informado, política
   de tratamiento, retención, acceso y borrado con el responsable de datos.
7. **Formulario:** los enlaces «Términos de Servicio» y «Política de Tratamiento de
   Datos» actualmente conducen a `#contacto`, no a documentos legales independientes.
8. **Integración real de proyectos/fotos/redes:** comprobar enlaces sociales e imágenes
   externas antes de publicar en producción.
9. **Tarjetas invisibles antes de hidratar:** las tarjetas de `#por-que` se renderizan
   con `opacity-0` (y las de `#proyectos` con `motion-safe:opacity-0`, es decir, solo
   sin movimiento reducido) y aparecen cuando el JavaScript hidrata y el observer las
   revela. En modo dev eso tarda unos 10 s; con conexión lenta se vería un
   hueco. Propuesta: renderizarlas visibles y aplicar la animación solo tras el montaje.
10. **Accesibilidad del chatbot:** el robot flotante usa `animate-bounce` sin
    `motion-safe:` y las animaciones `chatbot-robot-vibrate` y `ally-logo-rotation` no
    tienen regla de movimiento reducido.
11. **Por confirmar con el cliente:** textos nuevos de los diferenciales, colores por
    tarjeta, si con movimiento reducido la tarjeta activa debe seguir creciendo, y
    categorías/subtítulo de Proyectos.

## 12. Recomendación para implementar persistencia del formulario

El frontend actual está listo como formulario visual, no como captura de leads.
Si el proyecto permanece en Cloudflare, evaluar Cloudflare D1 como opción SQL con
integración directa con Workers. Firebase/Firestore es viable si TELCOBRAS ya usa el
ecosistema Firebase, pero mantener las escrituras detrás de un endpoint servidor;
no dar acceso de escritura indiscriminado al navegador.

En la raíz existe `conexion.php`, un ejemplo de conexión a MySQL con PDO (DSN `mysql:`,
credenciales por variables de entorno `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASS`/
`DB_CHARSET`, `ERRMODE_EXCEPTION`, `EMULATE_PREPARES=false`). Es solo material de
referencia: Cloudflare Workers no ejecuta PHP, así que no reemplaza a D1 ni a un backend
Node del stack actual y no debe usarse como el camino de persistencia del formulario.

Secuencia recomendada:

1. Confirmar proveedor/entorno objetivo (Cloudflare D1, Firebase/Firestore u otro).
2. Acordar campos, estado de seguimiento, retención y acceso.
3. Crear migración/esquema y binding/credenciales solo en servidor.
4. Crear un `POST /api/contacto` con validación de tipos, longitudes y valores permitidos.
5. Insertar con consultas parametrizadas o SDK servidor y devolver éxito solo tras persistir.
6. Conectar `ContactAndFooter.tsx` con loading/error/success y prevenir doble envío.
7. Añadir consentimiento y protección anti-spam/limitación de tasa.
8. Añadir notificación a ventas/CRM/Make solo después de guardar, con gestión de fallos.
9. Probar en entorno staging y verificar que el registro existe realmente.

No crear un endpoint público para listar todas las solicitudes sin autenticación y
autorización. Evitar registrar datos personales completos en logs.

## 13. Guía de navegación rápida para otra IA

| Si la tarea trata de... | Empezar por... |
|---|---|
| Metadatos, orden o composición de página | `src/routes/index.tsx` |
| Navegación global, WhatsApp, shell o errores raíz | `src/routes/__root.tsx` |
| Servicios, pestañas, videos o rotación | `src/components/ServicesSection.tsx` |
| Chat visual, sesión, foco o errores en UI | `src/components/FloatingChatbot.tsx` |
| Contrato y proxy de Make | `src/routes/api.chat.ts` y `README.md` |
| Formulario, mapa, datos de contacto y footer | `src/components/ContactAndFooter.tsx` |
| Datos de marca, catálogo de servicios/proyectos | `src/lib/telcobras-data.ts` |
| Proyectos: bento, modal, orden de tarjetas | `src/components/ProjectsSection.tsx` |
| Métricas del hero e iluminación rotativa | `src/components/HeroAndMetrics.tsx` |
| Diferenciales, red sincronizada, video girado | `src/components/WhyUsSection.tsx` |
| Borde iluminado o rotación compartidos | `src/components/BrandGlowBorder.tsx`, `src/hooks/use-rotating-highlight.ts` |
| Ejemplo de conexión a MySQL (PHP/PDO) | `conexion.php` |
| Estilos globales, tokens y animaciones | `src/styles.css` |
| Destino Cloudflare, plugins y entrada SSR | `vite.config.ts` y `src/server.ts` |
| Configuración de rutas | `src/router.tsx`, `src/routes/README.md` |
