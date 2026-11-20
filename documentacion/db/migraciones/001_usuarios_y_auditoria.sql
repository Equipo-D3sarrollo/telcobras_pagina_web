-- =====================================================================
-- TELCOBRAS S.A.S. · Migración 001 · Gestión de usuarios y "Mi cuenta" (fase 5B)
-- Motor: MariaDB 10.4+ / MySQL 8 · Juego de caracteres: utf8mb4
--
-- QUÉ HACE
--   1. Agrega a `usuarios` la columna `debe_cambiar_password` (0 = normal,
--      1 = el usuario debe cambiar su contraseña antes de usar el panel;
--      se activa al crear una cuenta o reiniciar la contraseña con una temporal).
--   2. Amplía el ENUM `auditoria.accion` CONSERVANDO los 11 valores actuales
--      (en el mismo orden) y agregando al final los de la gestión de usuarios:
--      crear_usuario, editar_usuario, activar_usuario, desactivar_usuario,
--      desbloquear_usuario, reiniciar_password y cambiar_password.
--
-- CÓMO EJECUTARLA (necesita un usuario con permiso ALTER: el usuario de la
-- aplicación NO lo tiene; en XAMPP usa «root» en phpMyAdmin)
--   1. En phpMyAdmin, seleccionar la base de datos del panel en el panel izquierdo.
--   2. Pestaña «Importar» > elegir este archivo > «Continuar».
--   3. Al terminar se muestran dos resultados: la columna nueva en `usuarios`
--      y el ENUM completo (18 valores) en `auditoria`.
--
-- POR QUÉ NO HAY PREPARE / SQL DINÁMICO / information_schema / DATABASE()
--   Se ejecuta todo con sentencias simples sobre la base YA SELECCIONADA.
--   No se usa PREPARE/EXECUTE, ni SQL dinámico, ni information_schema, ni
--   DATABASE(), ni USE, ni el nombre de la base: en phpMyAdmin de XAMPP
--   (MariaDB 10.4) la consulta de control a information_schema devolvió
--   #1044 «Access denied ... information_schema», la importación se abortó
--   en el bloque PREPARE y no se aplicó ningún cambio de esquema. Además,
--   DATABASE() puede dejar de apuntar a la base elegida y en cPanel el nombre
--   de la base lleva prefijo, así que escribirlo también rompería la importación.
--
-- NO IDEMPOTENTE (antes sí lo era; ya no)
--   Si la columna ya existe, este paso dará «Duplicate column name
--   'debe_cambiar_password'» y se puede ignorar; no borra ni modifica datos.
--   El paso 2 se puede repetir sin tocar las filas existentes: los valores
--   nuevos se agregan al final del ENUM, por lo que los valores actuales
--   conservan su posición. Aun así requiere permiso ALTER.
--
-- INSTALACIONES NUEVAS: telcobras_cotizaciones.sql ya incluye estos cambios;
-- no hace falta ejecutar esta migración después de importarlo.
-- =====================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
-- 1. usuarios.debe_cambiar_password
-- ---------------------------------------------------------------------
ALTER TABLE usuarios
  ADD COLUMN debe_cambiar_password TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = debe cambiar la contraseña antes de usar el panel (contraseña temporal)'
    AFTER activo;

-- ---------------------------------------------------------------------
-- 2. auditoria.accion: 11 valores actuales + 7 al final
--    (agregar al final evita reescribir los datos existentes)
-- ---------------------------------------------------------------------
ALTER TABLE auditoria
  MODIFY COLUMN accion ENUM(
    'login','login_fallido','logout','crear','ver','editar','cambiar_estado',
    'asignar','eliminar','restaurar','exportar',
    'crear_usuario','editar_usuario','activar_usuario','desactivar_usuario',
    'desbloquear_usuario','reiniciar_password','cambiar_password'
  ) NOT NULL;

-- ---------------------------------------------------------------------
-- 3. Verificación (solo lectura, sobre la base seleccionada)
-- ---------------------------------------------------------------------
SHOW COLUMNS FROM usuarios LIKE 'debe_cambiar_password';
SHOW COLUMNS FROM auditoria LIKE 'accion';
