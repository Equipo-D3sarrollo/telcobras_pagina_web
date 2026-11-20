# Guía de publicación en cPanel (Latinoam Hosting)

Esta guía es para el día de la publicación. Está escrita para quien no usa terminal en el
servidor: todo se hace desde **cPanel** y desde **phpMyAdmin** en el navegador. La única
terminal que se usa es la del **propio ordenador de desarrollo**, para generar el ZIP y el
INSERT del primer administrador.

Antes de empezar, leer también `documentacion/contexto.md` (sección 12) y la sección de
variables de entorno. **No hacer `git push` desde el servidor ni desde AI Studio sin que
fallen las comprobaciones previas.**

---

## 0. Resumen de lo que se va a subir

El paquete `deploy/telcobras-web-cpanel.zip` contiene:

- `.output/` completo: el sitio ya compilado (servidor Nitro + archivos públicos).
- `app.js`: el archivo que arranca Passenger. Usa CommonJS, carga
  `.output/server/index.mjs` con `import()` dinámico y **respeta el puerto `PORT` que
  asigna Passenger** (no lo cambia; Nitro lo lee directamente).
- `package.json` mínimo de ejecución: solo `node app.js`. **No hay que ejecutar
  `npm install` en el servidor**: `.output/server/node_modules/` ya incluye la única
  dependencia que Nitro dejó fuera del bundle (`tslib`). No queda ninguna otra
  dependencia sin incluir.

El ZIP se genera con:

```powershell
npm run empaquetar
```

Ese comando ejecuta el build de producción y sobrescribe `deploy/telcobras-web-cpanel.zip`.
`deploy/*.zip` está en `.gitignore`: el ZIP **no se sube a Git**, se sube por el gestor de
archivos de cPanel.

### Versión de Node en producción

**Mínimo comprobado: Node 20.19.0.** No usar una versión inferior.

Cómo se comprobó (19-11-2026): se descomprimió el ZIP en una carpeta temporal, se arrancó
con `node app.js` y se probaron `/`, `/admin/login` y `GET /api/contacto` (405) con
`node@20.19.0` (funciona) y con `node@20.18.0` (no arranca). Coincide con los requisitos
declarados por las librerías que se ejecutan: Nitro 3 (`^20.19.0 || >=22.12.0`), h3 2
(`>=20.19.0`), srvx (`>=20.16.0`) y nodemailer 10 (`>=20.0.0`).

**Recomendación:** si Latinoam Hosting ofrece Node 22 LTS, elegir 22.x. Es la opción más
segura a largo plazo. El paquete funciona con 20.19.0, pero 22.x recibe soporte más tiempo.
`@tanstack/react-start` declara `>=22.12.0` para desarrollo/compilación; en el ZIP no se
instala porque su código ya va dentro de `.output/`.

---

## a) Datos que hay que pedir antes

Pedir a gerencia y al hosting, y anotarlos en un lugar seguro (no en este documento):

1. **Dominio definitivo:** `telcobras.com` (o `www.telcobras.com`; elegir uno). El sitio
   tiene los `canonical`, el `sitemap.xml` y los enlaces absolutos escritos para
   `https://telcobras.com` **sin www**. Salvo indicación contraria, elegir la versión sin
   www.
2. **Acceso a cPanel** del cliente (usuario, contraseña y código 2FA si aplica).
3. **Acceso a la zona DNS** (en cPanel o en Cloudflare, según dónde esté el DNS
   autoritativo). No cambiar nada de correo.
4. **Datos de la base MySQL nueva** que se vaya a crear: nombre (con prefijo de cPanel),
   usuario (con prefijo), contraseña y host (`localhost`).
5. **Credenciales SMTP reales** de contabilidad: host, puerto, si usa TLS/SSL, usuario,
   contraseña, correo de envío y correo de destino de las cotizaciones.
6. **Site key y secret key de Cloudflare Turnstile** para `telcobras.com` y
   `www.telcobras.com` (crear el widget en Cloudflare si aún no existe).
7. **Ventana de cambio** acordada con gerencia (fuera de horario laboral) y una persona de
   contacto del hosting por si hay que reiniciar la app.
8. **Nombre, correo, rol y contraseña temporal** del primer administrador del panel.

---

## b) Base de datos

1. En cPanel entrar en **Bases de datos MySQL » Bases de datos MySQL**.
2. Crear la base, por ejemplo `telcobras_cotizaciones`. cPanel le antepone el prefijo de la
   cuenta: puede quedar `micuenta_telcobras_cotizaciones`. Ese es el nombre real.
3. Crear el usuario, por ejemplo `telcobras_app` (también con prefijo) y una contraseña
   larga. Guardarla solo en el gestor de secretos.
4. En **Añadir usuario a la base de datos**, marcar **solamente** `SELECT`, `INSERT`,
   `UPDATE` y `DELETE`. No dar `ALTER`, `DROP` ni `CREATE`.
5. Entrar en **phpMyAdmin**, seleccionar la base creada, pestaña **Importar**, elegir
   `documentacion/db/telcobras_cotizaciones.sql` y pulsar **Continuar**.
6. Comprobar que aparecen las tablas `usuarios`, `cotizaciones`, `sesiones` y `auditoria`.
   La columna `cotizaciones.aviso_correo_enviado` ya viene en el archivo: **no hay que
   ejecutar migraciones** en una instalación nueva.

---

## c) Crear la primera cuenta de administrador

La aplicación no tiene registro público: la primera cuenta se crea a mano. Se hace desde
el ordenador de desarrollo, **sin conectar a la base**:

```powershell
npm run usuario:sql
```

El script pide nombre, correo, rol (`administrador`) y contraseña dos veces (la contraseña
no se ve al escribir; mínimo 12 caracteres). Usa el mismo hash scrypt que el login y las
mismas validaciones que `npm run usuario:crear`. Imprime **solo un `INSERT INTO usuarios`**
por pantalla. No guarda la contraseña ni el SQL en ningún archivo y no se conecta a MySQL.

Después:

1. Copiar ese `INSERT`.
2. En phpMyAdmin, seleccionar la base y abrir la pestaña **SQL**.
3. Pegar el `INSERT` y pulsar **Continuar**. Debe decir «1 fila afectada».
4. En la pestaña `usuarios`, comprobar que aparece la cuenta con
   `debe_cambiar_password = 1`: la primera vez que se entre en `/admin` habrá que cambiar
   la contraseña desde «Mi cuenta».

Si el hosting no permite crear cuentas por SQL, la alternativa con terminal y acceso a la
base sería `npm run usuario:crear`, pero necesita `DB_*` en `.env.local`.

---

## d) Setup Node.js App

1. En cPanel entrar en **Setup Node.js App** y pulsar **Create Application**.
2. Rellenar:
   - **Node.js version:** 22.x si está disponible; si no, 20.19.0 o superior (ver arriba).
   - **Application mode:** `Production`.
   - **Application root:** por ejemplo `telcobras_web` (carpeta dentro de `home`). Anotar
     la ruta completa que muestra cPanel.
   - **Application URL:** el dominio o subdominio elegido. Para la primera prueba usar un
     subdominio, por ejemplo `pruebas.telcobras.com` (ver sección g).
   - **Application startup file:** `app.js`.
   - **Passenger log file:** dejar el que proponga cPanel o `passenger.log`.
3. Pulsar **Create**. cPanel crea la carpeta del application root.
4. Subir el ZIP con **Administrador de archivos** a esa carpeta y descomprimirlo **en la
   raíz de la aplicación**. Quedan tres entradas: `.output/`, `app.js` y `package.json`.
   `app.js` debe estar al mismo nivel que `.output/`.
   - Ojo: el administrador de archivos a veces crea una carpeta con el nombre del ZIP al
     descomprimir. Si pasa, mover los tres elementos a la raíz.
   - No ejecutar `npm install`.
5. En la misma pantalla **Setup Node.js App**, pulsar **Edit** y añadir **todas** las
   variables de entorno de la tabla siguiente. Después **Save** y **Restart**.

### Variables de entorno (lista completa)

| Variable | Valor de ejemplo | ¿Secreta? | Para qué sirve |
|---|---|---|---|
| `NODE_ENV` | `production` | No | Modo de producción. |
| `DB_HOST` | `localhost` | No | Servidor MySQL de cPanel. |
| `DB_PORT` | `3306` | No | Puerto MySQL. |
| `DB_NAME` | `micuenta_telcobras_cotizaciones` | No | Nombre real de la base, con prefijo. |
| `DB_USER` | `micuenta_telcobras_app` | No | Usuario real, con prefijo. |
| `DB_PASSWORD` | (la del paso b) | **SÍ** | Contraseña de la base. |
| `TRUST_PROXY` | `1` | No | Necesario en cPanel: sin esto el límite de envíos y el login ven la IP del proxy en vez de la del cliente. |
| `TURNSTILE_SECRET_KEY` | (la de Cloudflare) | **SÍ** | Verifica el token en el servidor. Sin ella el formulario responde 503. |
| `TURNSTILE_ALLOWED_HOSTNAMES` | `telcobras.com,www.telcobras.com` | No | Hostnames aceptados por Turnstile. Sin esto el formulario responde 503. |
| `SMTP_HOST` | `smtp.ejemplo.com` | No | Servidor SMTP de contabilidad. |
| `SMTP_PORT` | `465` | No | 465 con SSL; si el proveedor usa 587, poner `SMTP_SECURE=false`. |
| `SMTP_SECURE` | `true` | No | `true` para 465, `false` para 587. |
| `SMTP_USER` | (usuario SMTP) | Semi | No es una contraseña, pero tampoco publicarlo. |
| `SMTP_PASSWORD` | (la del hosting) | **SÍ** | Contraseña SMTP. |
| `MAIL_FROM` | `TELCOBRAS Web <notificaciones@telcobras.com>` | No | Remitente del aviso. |
| `MAIL_TO_COTIZACIONES` | `contabilidad@telcobras.com` | No | Destinatario del aviso. |
| `PUBLIC_SITE_URL` | `https://telcobras.com` | No | Arma el enlace al panel que va en el correo. |
| `MAKE_CHAT_WEBHOOK_URL` | (vacío) | Semi | Solo si se enciende el chatbot; hoy está apagado, así que puede quedar vacía. |
| `PORT` | **no configurar** | — | Lo asigna Passenger. La app lo respeta. No poner `NITRO_PORT` ni `HOST`. |

#### `VITE_TURNSTILE_SITE_KEY` (importante)

Esta **no sirve añadirla en cPanel**: Vite la sustituye dentro del JavaScript del
navegador **al compilar**. Para que el widget aparezca hay que generar el ZIP con la site
key ya definida en el ordenador de desarrollo:

```powershell
# En .env.local (no versionado):
# VITE_TURNSTILE_SITE_KEY=0xXXXXXXXXXXXXXXXX

npm run empaquetar
```

Después se sube ese ZIP. Si se cambia la site key en cPanel sin regenerar el ZIP, el
formulario seguirá usando la clave antigua y Turnstile fallará. La *secret key* sí se pone
en cPanel (tabla anterior).

**Regla de oro:** las tres variables secretas (`DB_PASSWORD`, `TURNSTILE_SECRET_KEY`,
`SMTP_PASSWORD`) solo en cPanel; nunca en el repositorio, en el ZIP, en capturas ni en
esta guía.

---

## e) HTTPS y redirecciones

1. En cPanel entrar en **SSL/TLS » AutoSSL** (o instalar el certificado Let's Encrypt que
   ofrezca el hosting) y emitirlo para `telcobras.com` y `www.telcobras.com`.
2. Marcar **Force HTTPS (Redirect HTTP to HTTPS)** si el hosting lo ofrece.
3. Redirigir `www` a la versión elegida (sin www, porque el sitio está escrito para
   `https://telcobras.com`). En el `.htaccess` de la raíz pública se puede usar:

   ```apache
   RewriteEngine On
   RewriteCond %{HTTP_HOST} ^www\. [NC]
   RewriteRule ^(.*)$ https://telcobras.com/$1 [R=301,L]
   ```

4. **Para evitar bucles con el proxy:** no añadir una segunda regla de HTTPS en la app ni
   en Cloudflare si ya la puso cPanel. Si Cloudflare está delante, configurar SSL en modo
   **Full** y hacer las redirecciones solo en Cloudflare (reglas *Redirect Rules*) o solo
   en cPanel, nunca en los dos sitios. Si el proxy envía `X-Forwarded-Proto`, la condición
   de HTTPS debe tenerlo en cuenta:

   ```apache
   RewriteCond %{HTTPS} off
   RewriteCond %{HTTP:X-Forwarded-Proto} !https
   RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
   ```

5. Probar con `curl -I http://telcobras.com` y `curl -I https://www.telcobras.com`: debe
   haber **una sola** redirección 301 a `https://telcobras.com/...`, nunca un bucle.

---

## f) Cloudflare Turnstile

1. Entrar en Cloudflare » **Turnstile** y abrir el widget de TELCOBRAS.
2. En **Allowed hostnames** añadir `telcobras.com` y `www.telcobras.com` (y el subdominio
   de prueba si se usa). Quitar hostnames antiguos que ya no se usen.
3. Copiar la **site key** y la **secret key** definitivas. La site key va en `.env.local`
   antes de `npm run empaquetar`; la secret key va en cPanel
   (`TURNSTILE_SECRET_KEY`).
4. Comprobar con las claves de prueba de Cloudflare solo en el subdominio de prueba; en
   producción la app rechaza las claves de prueba con un 403.

---

## g) Publicar primero en un subdominio de prueba

Si el hosting lo permite, crear primero la app en `pruebas.telcobras.com` (o similar):

1. Repetir la sección d) con ese subdominio y su propio `Application root`.
2. Usar la base de datos nueva y las mismas variables; `PUBLIC_SITE_URL` apunta al
   subdominio durante la prueba (`https://pruebas.telcobras.com`).
3. Añadir el subdominio a Turnstile (sección f).
4. Hacer el checklist de la sección i) completo, incluido un formulario real y su correo.
5. Cuando todo funcione, repetir la configuración en el dominio definitivo. No hace falta
   regenerar el ZIP si la site key no cambió.

---

## h) Pasar del sitio Joomla al nuevo

**Antes de tocar nada:**

1. **Copia de seguridad completa de Joomla y su base.** En cPanel usar *Backups* o
   *Backup Wizard*; descargar el `.tar.gz` de la carpeta `public_html` (o donde esté
   Joomla) y el `.sql` de su base. Comprobar que los archivos se descargan y abren.
2. **No tocar los registros MX, SPF, DKIM ni DMARC.** El cambio es solo web: registros
   `A`/`AAAA`/`CNAME` del dominio o del `www`. Si el DNS está en Cloudflare, cambiar allí.
3. Hacer el cambio **fuera de horario laboral**, con la ventana acordada y aviso previo.
4. Dejar la copia de Joomla y la base a mano durante al menos 15 días.

**Plan para volver atrás:**

1. Apuntar otra vez el registro `A`/`CNAME` a la IP del hosting anterior (o al valor que
   tenía Joomla). Si está en Cloudflare, desactivar el proxy naranja mientras se
   restaura.
2. Restaurar el archivo `.tar.gz` de Joomla en su carpeta y el `.sql` en su base desde
   phpMyAdmin (Importar).
3. Volver a comprobar que el correo sigue entrando (no se tocaron MX, pero conviene
   verificarlo).
4. Las redirecciones de las URLs de Joomla ya están implementadas en la aplicación nueva
   (`/index.php...` → 301, `/administrator` → 404), así que no hace falta mantener Joomla
   publicado por ese motivo.

---

## i) Checklist justo después de publicar

Marcar cada punto con la hora y quien lo comprobó:

- [ ] `https://telcobras.com/` carga la portada completa (imágenes, videos, fuentes) y no
      sale contenido mezclado ni avisos de certificado.
- [ ] `curl -I http://telcobras.com` y `curl -I https://www.telcobras.com` dan **una**
      301 a la versión elegida, sin bucle.
- [ ] Formulario real: enviar una cotización de prueba → 200 en la página, **1 fila nueva**
      en `cotizaciones` (con `origen = 'formulario_web'`, tildes correctas) y **1 fila** en
      `auditoria`; comprobar que llegó el correo a contabilidad y que
      `aviso_correo_enviado = 1`. Borrar la fila de prueba después.
- [ ] Sin SMTP (si aún no está configurado): el formulario sigue guardando, la columna
      queda en 0 y el log muestra una sola advertencia sin datos.
- [ ] `/admin/login` carga; entrar con la cuenta creada en la sección c), cambiar la
      contraseña temporal y comprobar que el detalle de una cotización muestra «Aviso por
      correo: enviado / pendiente».
- [ ] Redirecciones Joomla: `/index.php?option=com_sppagebuilder&view=page&id=98` → 301 a
      `/#nosotros`; `/administrator` → 404 sin `Location`.
- [ ] Cabeceras de seguridad presentes: `content-security-policy`, `x-content-type-options`,
      `referrer-policy`, `permissions-policy`, `x-frame-options`. En HTTPS también
      `strict-transport-security`. En `/admin/*`, `x-robots-tag: noindex, nofollow`.
- [ ] Páginas legales `/politica-de-privacidad`, `/terminos-de-servicio` y `/sla` cargan
      completas en español e inglés.
- [ ] Probar en el móvil: menú, formulario, Turnstile y botones flotantes; sin desplazamiento
      horizontal.
- [ ] Logs de la app sin errores nuevos (sección j).

---

## j) Copias de seguridad y qué hacer si algo falla

**Copias automáticas de la base:**

- En cPanel, configurar **Backups » Backup Settings** para que haga copias de las bases
  (diaria o semanal, según el plan) y guardar también una copia fuera del hosting.
- Antes de cualquier cambio en la base (por ejemplo, importar una migración), descargar un
  `.sql` manual desde phpMyAdmin » Exportar.
- Probar de vez en cuando que el `.sql` se puede importar en una base vacía: una copia que
  no se ha probado no es una copia.

**Si algo falla:**

1. **Ver los logs:** en **Setup Node.js App**, pulsar el icono de los logs de la
   aplicación (`passenger.log` / stderr). También están en `Logs » Error Log` de cPanel.
   Buscar mensajes de `mysql2` (`ECONNREFUSED`, `ER_ACCESS_DENIED_ERROR`), de SMTP
   (`[cotizaciones/mail]`) o de Turnstile (`[api/contacto]`).
2. **Reiniciar la app:** en **Setup Node.js App**, pulsar **Restart**. Es lo primero que
   hay que probar si después de cambiar variables la aplicación sigue con la configuración
   antigua.
3. **Si no arranca:** comprobar que la versión de Node es 20.19.0 o superior, que
   `app.js` está en la raíz junto a `.output/` y que no se ejecutó `npm install` (no debe
   existir un `node_modules` en la raíz).
4. **Si el formulario responde 503:** revisar `DB_*` y `TURNSTILE_SECRET_KEY`/
   `TURNSTILE_ALLOWED_HOSTNAMES`. Son las causas habituales del fail-closed.
5. **Si no llega el correo:** revisar `SMTP_*` y `MAIL_TO_COTIZACIONES`; el aviso es
   asíncrono y no bloquea el formulario, así que hay que mirar el log, no la respuesta web.
6. **Si hay un bucle de redirecciones:** desactivar temporalmente la regla de `.htaccess`
   o de Cloudflare que se añadió última y dejar solo una capa gestionando HTTPS/www.
7. Si no se puede arreglar en 15 minutos, ejecutar el plan de vuelta atrás de la sección h)
   y avisar a gerencia.
