-- =====================================================================
-- TELCOBRAS S.A.S. · Base de datos del panel de cotizaciones
-- Motor: MySQL 5.7+ / MariaDB 10.3+ (cPanel · phpMyAdmin)
-- Juego de caracteres: utf8mb4 (tildes, ñ y emojis)
--
-- CÓMO USARLO
-- 1. En cPanel > "Bases de datos MySQL": crear la base, crear un usuario
--    con contraseña fuerte y darle permisos SOLO sobre esa base
--    (SELECT, INSERT, UPDATE, DELETE). cPanel antepone un prefijo al
--    nombre (ej. "cuenta_cotizaciones"); eso es normal.
-- 2. En phpMyAdmin: seleccionar la base (panel izquierdo) > pestaña
--    "Importar" > elegir este archivo > "Continuar".
-- 3. NO se crean usuarios del panel aquí: las contraseñas deben guardarse
--    cifradas, así que las cuentas se crean con el script del proyecto.
--
-- CAMBIOS POSTERIORES: si la base ya estaba instalada, las modificaciones del esquema
-- se aplican con los archivos de la carpeta migraciones/ (en orden). Este archivo ya
-- incluye todas las migraciones hasta la 001 (gestión de usuarios): en una instalación
-- nueva NO hace falta ejecutarlas.
--
-- Datos personales (Ley 1581 de 2012): acceso solo para el personal
-- autorizado; todo cambio queda en la tabla `auditoria`.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '-05:00';

-- ---------------------------------------------------------------------
-- Usuarios del panel (/admin): 1 administrador y 2 comerciales
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre            VARCHAR(100) NOT NULL,
  correo            VARCHAR(200) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL COMMENT 'Hash argon2id/bcrypt. Nunca texto plano.',
  rol               ENUM('administrador','comercial') NOT NULL DEFAULT 'comercial',
  activo            TINYINT(1) NOT NULL DEFAULT 1,
  debe_cambiar_password TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = debe cambiar la contraseña antes de usar el panel (contraseña temporal)',
  intentos_fallidos SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  bloqueado_hasta   DATETIME NULL COMMENT 'Bloqueo temporal tras varios intentos fallidos',
  ultimo_acceso     DATETIME NULL,
  creado_en         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Cuentas del panel. Sin registro público: las crea el administrador.';

-- ---------------------------------------------------------------------
-- Solicitudes de cotización (formulario del sitio + creadas a mano)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cotizaciones (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- Datos del formulario (mismos límites que valida /api/contacto)
  nombre                  VARCHAR(100)  NOT NULL,
  empresa                 VARCHAR(100)  NOT NULL DEFAULT '',
  cargo                   VARCHAR(100)  NOT NULL DEFAULT '',
  correo                  VARCHAR(200)  NOT NULL,
  telefono                VARCHAR(20)   NOT NULL,
  servicio                VARCHAR(120)  NOT NULL DEFAULT '',
  mensaje                 TEXT          NULL COMMENT 'Hasta 2000 caracteres',
  consentimiento          TINYINT(1)    NOT NULL DEFAULT 1 COMMENT 'Autorización de tratamiento de datos (Ley 1581)',
  consentimiento_fecha    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  origen                  ENUM('formulario_web','manual','migracion_supabase') NOT NULL DEFAULT 'formulario_web',
  idioma                  CHAR(2)       NOT NULL DEFAULT 'es',
  -- Gestión comercial
  estado                  ENUM('nueva','en_revision','cotizada','ganada','perdida') NOT NULL DEFAULT 'nueva',
  responsable_id          INT UNSIGNED  NULL COMMENT 'Comercial asignado',
  notas                   TEXT          NULL COMMENT 'Notas internas; el cliente no las ve',
  aviso_correo_enviado    TINYINT(1)    NOT NULL DEFAULT 0 COMMENT 'Se envió aviso a contabilidad@telcobras.com',
  -- Fechas y papelera
  creado_en               DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  eliminado_en            DATETIME      NULL COMMENT 'Papelera: si tiene fecha, no se muestra en la lista',
  eliminado_por           INT UNSIGNED  NULL,
  PRIMARY KEY (id),
  KEY idx_cotizaciones_estado (estado, creado_en),
  KEY idx_cotizaciones_creado (creado_en),
  KEY idx_cotizaciones_responsable (responsable_id),
  KEY idx_cotizaciones_correo (correo),
  KEY idx_cotizaciones_eliminado (eliminado_en),
  CONSTRAINT fk_cotizaciones_responsable FOREIGN KEY (responsable_id)
    REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_cotizaciones_eliminado_por FOREIGN KEY (eliminado_por)
    REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Solicitudes de cotización del sitio web';

-- ---------------------------------------------------------------------
-- Sesiones del panel (se guarda solo el HASH del token, no el token)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sesiones (
  id            CHAR(64)     NOT NULL COMMENT 'SHA-256 del token de la cookie',
  usuario_id    INT UNSIGNED NOT NULL,
  creada_en     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_en     DATETIME     NOT NULL,
  ip            VARCHAR(45)  NULL,
  user_agent    VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_sesiones_usuario (usuario_id),
  KEY idx_sesiones_expira (expira_en),
  CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Sesiones activas del panel; vencen solas';

-- ---------------------------------------------------------------------
-- Auditoría: quién hizo qué y cuándo (Ley 1581)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS auditoria (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id      INT UNSIGNED NULL COMMENT 'NULL = acción del sistema (ej. formulario web)',
  accion          ENUM('login','login_fallido','logout','crear','ver','editar','cambiar_estado',
                       'asignar','eliminar','restaurar','exportar',
                       'crear_usuario','editar_usuario','activar_usuario','desactivar_usuario',
                       'desbloquear_usuario','reiniciar_password','cambiar_password') NOT NULL,
  cotizacion_id   INT UNSIGNED NULL,
  detalle         VARCHAR(500) NULL COMMENT 'Ej. "estado: nueva -> cotizada". Sin datos personales completos.',
  ip              VARCHAR(45)  NULL,
  creado_en       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_auditoria_cotizacion (cotizacion_id, creado_en),
  KEY idx_auditoria_usuario (usuario_id, creado_en),
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_auditoria_cotizacion FOREIGN KEY (cotizacion_id)
    REFERENCES cotizaciones (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Historial de acciones en el panel';
