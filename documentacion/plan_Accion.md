Plan por fases
Fase 0 — Definir alcance y criterios de aceptación
Antes de modificar componentes, acordar:

Si la preferencia inicial del tema será claro, oscuro o el ajuste del sistema.
Qué niveles concretos tendrá el selector de fuente y si la preferencia de tema del sistema será una opción seleccionable.
Si el control de escala de contenido será propio o se apoyará en el zoom nativo del navegador.
Si «modo daltonismo» se presentará al usuario como Refuerzo visual u otro nombre claro y preciso.
Quién aprueba las traducciones en inglés y si el agente de ventas de Make debe responder también en ese idioma.
Resultado: requisitos cerrados y pruebas de aceptación definidas antes de diseñar.

Fase 1 — Base de preferencias y acceso al panel
Añadir el control de accesibilidad a la navegación principal y móvil, sin hacerlo competir con los botones flotantes del chatbot y WhatsApp.
Crear una fuente única de preferencias: apariencia, tamaño de texto, escala —si se aprueba—, refuerzo visual e idioma.
Guardar las opciones de forma persistente y validar sus valores al leerlos.
Evitar un destello del tema predeterminado antes de aplicar la preferencia guardada. Para el idioma, considerar también el renderizado del servidor: debe generarse lang="es" o lang="en" de acuerdo con la elección, no corregirlo únicamente después de hidratar la página.
Usar controles semánticos con etiquetas explícitas, foco visible, estados accesibles y operación completa por teclado. Incluir una opción de restablecimiento.
Archivos principales: nuevo proveedor o hook de preferencias; __root.tsx; HeaderNav.tsx; styles.css.

Fase 2 — Tema claro y oscuro
Revisar y ampliar los tokens semánticos del CSS para fondos, texto, paneles, controles, bordes, foco y estados.
Migrar progresivamente las superficies y los textos que actualmente dependen de colores escritos directamente en los componentes. El trabajo debe cubrir también formulario, mapa, chatbot, tarjetas, botones, navegación, avisos y diálogos.
Definir qué elementos de marca mantienen su color y cuáles necesitan variantes con contraste adecuado. El tema no debe alterar el significado de la información ni depender únicamente del color.
Aplicar la selección de tema de forma uniforme a todas las secciones; configurar también color-scheme para los controles nativos cuando corresponda.
Prueba de aceptación: en ambas apariencias se leen y usan todos los controles; la navegación con teclado mantiene un indicador de foco visible; no aparecen combinaciones de texto y fondo ilegibles en hover, activo, error y deshabilitado.

Fase 3 — Tamaño de fuente y escala del contenido
Probar el sitio con tamaño de texto de hasta 200 % sin pérdida de información o funcionalidad.
Hacer que textos, botones, campos, mensajes, pestañas y modales admitan ampliación; revisar truncamientos, alturas fijas y etiquetas largas.
Verificar el reflujo a un ancho equivalente a 320 píxeles CSS, incluida la vista móvil y ventanas ampliadas.
Evaluar expresamente la escala de contenido antes de implementarla. Si hace falta un control propio, definir si ajustará la escala de toda la interfaz o solo texto, qué límites tendrá y cómo se comportarán los elementos flotantes. No usar transform: scale() como atajo: puede crear contenido visualmente grande pero difícil de alcanzar o recortado.
Prueba de aceptación: contenido legible con texto al 200 % y uso normal a 400 % de zoom del navegador, sin desplazamiento horizontal para el contenido principal. Los mapas y diagramas pueden requerir tratamiento específico.

Fase 4 — Refuerzo para visión cromática
Revisar dónde el color indica un estado, diferencia de servicio, acción, selección o error.
Complementar la señal cromática con etiquetas, iconos, formas, patrones o texto visible y accesible.
Añadir el control de refuerzo visual para elevar la diferenciación de estados, resaltar enlaces y asegurar contraste apropiado sin recolorear indiscriminadamente imágenes, videos ni ilustraciones.
Comprobar especialmente las pestañas y tarjetas de servicios, los gráficos o diagramas, los errores del formulario, los mensajes del chatbot y los elementos que usan colores de marca.
Prueba de aceptación: la información sigue siendo comprensible en escala de grises y con simulaciones de deficiencias cromáticas; ningún estado depende exclusivamente del tono.

Fase 5 — Traducción completa a español e inglés
Definir catálogos tipados de traducciones, separados por áreas —navegación, contenido, formulario, errores, accesibilidad y chatbot— para que las cadenas no queden dispersas entre componentes.
Traducir todo el contenido aprobado: títulos, secciones, servicios, proyectos, botones, etiquetas, placeholders, confirmaciones, consentimiento, mensajes de validación y errores, alt, nombres accesibles, metadatos y página 404/error.
Revisar el texto en inglés con la persona responsable del producto; no dejar traducciones parciales ni usar textos en inglés como sustitutos no aprobados.
Actualizar lang en el documento y marcar correctamente fragmentos que permanezcan en otro idioma.
Localizar fechas y números si se presentan.
Acordar el contrato con Make: si el agente debe contestar en inglés, el servidor necesitará comunicar el idioma preferido al escenario y este deberá procesarlo. También habrá que verificar que el formato de respuesta siga siendo compatible con el proxy actual.
Comprobar que cambiar de idioma no borre lo que la persona ya escribió en el formulario o en el chat.
Prueba de aceptación: se puede recorrer la interfaz completa en ambos idiomas; los mensajes dinámicos y el atributo lang coinciden con el idioma seleccionado; no quedan controles o avisos importantes en el idioma incorrecto.

Fase 6 — Validación integral
Ejecutar análisis automatizado de accesibilidad y revisión manual con teclado y lector de pantalla.
Revisar contraste en ambas apariencias y en estados activos, de foco y de error.
Probar móvil, escritorio y ampliación, además de prefers-reduced-motion, porque el sitio tiene animaciones y fondos de video.
Añadir pruebas de regresión para persistencia de preferencias, cambio de tema, niveles de texto, idioma y controles accesibles.
Cerrar los errores de TypeScript y lint existentes —o acordar explícitamente un baseline— antes de considerar la validación final aprobada.