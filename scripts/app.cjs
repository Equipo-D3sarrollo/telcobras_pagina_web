"use strict";

/**
 * Arranque para "Setup Node.js App" de cPanel con Passenger.
 *
 * Passenger ejecuta `node app.js` desde la raíz de la aplicación y asigna el puerto en
 * process.env.PORT. NO lo sobrescribimos: el servidor real (.output/server/index.mjs,
 * generado por Nitro con el preset node-server) lee PORT directamente y escucha ahí.
 *
 * CommonJS a propósito: el package.json del paquete no declara "type": "module",
 * así que `require` funciona en la versión de Node que ofrezca el hosting.
 */
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const entry = path.join(__dirname, ".output", "server", "index.mjs");

import(pathToFileURL(entry).href).catch((error) => {
  console.error("[telcobras] No se pudo iniciar el servidor:", error);
  process.exit(1);
});
