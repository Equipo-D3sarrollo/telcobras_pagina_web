// Genera deploy/telcobras-web-cpanel.zip listo para cPanel (Setup Node.js App + Passenger).
//
// Uso: npm run empaquetar
// 1) ejecuta el build de producción;
// 2) mete en el zip .output/ completo, app.js (CommonJS) y un package.json mínimo;
// 3) no instala dependencias en destino: .output/server/node_modules ya trae tslib, la
//    única dependencia que Nitro dejó sin empaquetar (verificado en el build).
//
// El ZIP se escribe con zlib de Node (sin dependencias nuevas ni comandos zip externos).
import { spawnSync } from "node:child_process";
import { deflateRawSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const SALIDA = path.join(RAIZ, "deploy", "telcobras-web-cpanel.zip");

// Mínimo comprobado ejecutando el paquete con node@20.19.0 (ver GUIA_PUBLICACION_CPANEL.md).
const NODE_MINIMO = ">=20.19.0";

const PAQUETE_EJECUCION = {
  name: "telcobras-web-cpanel",
  version: "1.0.0",
  private: true,
  description: "TELCOBRAS Web - artefacto de produccion para cPanel con Passenger",
  main: "app.js",
  scripts: { start: "node app.js" },
  engines: { node: NODE_MINIMO },
};

// ---------- ZIP mínimo (formato definido por PKWARE, método 8 = deflate) ----------

const TABLA_CRC = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  TABLA_CRC[n] = c >>> 0;
}

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABLA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function fechaDos(fecha) {
  return {
    hora: (fecha.getHours() << 11) | (fecha.getMinutes() << 5) | (fecha.getSeconds() >> 1),
    dia:
      ((Math.max(1980, fecha.getFullYear()) - 1980) << 9) |
      ((fecha.getMonth() + 1) << 5) |
      fecha.getDate(),
  };
}

function crearZip(archivos) {
  const local = [];
  const central = [];
  const { hora, dia } = fechaDos(new Date());
  let offset = 0;

  for (const archivo of archivos) {
    const nombre = Buffer.from(archivo.ruta, "utf8");
    const datos = archivo.datos;
    const comprimidos = deflateRawSync(datos, { level: 6 });
    const crc = crc32(datos);

    const cabecera = Buffer.alloc(30);
    cabecera.writeUInt32LE(0x04034b50, 0);
    cabecera.writeUInt16LE(20, 4); // versión necesaria
    cabecera.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    cabecera.writeUInt16LE(8, 8); // deflate
    cabecera.writeUInt16LE(hora, 10);
    cabecera.writeUInt16LE(dia, 12);
    cabecera.writeUInt32LE(crc, 14);
    cabecera.writeUInt32LE(comprimidos.length, 18);
    cabecera.writeUInt32LE(datos.length, 22);
    cabecera.writeUInt16LE(nombre.length, 26);
    cabecera.writeUInt16LE(0, 28);
    local.push(cabecera, nombre, comprimidos);

    const entrada = Buffer.alloc(46);
    entrada.writeUInt32LE(0x02014b50, 0);
    entrada.writeUInt16LE(20, 4);
    entrada.writeUInt16LE(20, 6);
    entrada.writeUInt16LE(0x0800, 8);
    entrada.writeUInt16LE(8, 10);
    entrada.writeUInt16LE(hora, 12);
    entrada.writeUInt16LE(dia, 14);
    entrada.writeUInt32LE(crc, 16);
    entrada.writeUInt32LE(comprimidos.length, 20);
    entrada.writeUInt32LE(datos.length, 24);
    entrada.writeUInt16LE(nombre.length, 28);
    entrada.writeUInt16LE(0, 30); // extra
    entrada.writeUInt16LE(0, 32); // comentario
    entrada.writeUInt16LE(0, 34); // disco
    entrada.writeUInt16LE(0, 36); // atributos internos
    entrada.writeUInt32LE(0, 38); // atributos externos
    entrada.writeUInt32LE(offset, 42);
    central.push(entrada, nombre);

    offset += cabecera.length + nombre.length + comprimidos.length;
  }

  const tamanoCentral = central.reduce((suma, buffer) => suma + buffer.length, 0);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0);
  fin.writeUInt16LE(archivos.length, 8);
  fin.writeUInt16LE(archivos.length, 10);
  fin.writeUInt32LE(tamanoCentral, 12);
  fin.writeUInt32LE(offset, 16);
  fin.writeUInt16LE(0, 20);

  return Buffer.concat([...local, ...central, fin]);
}

function archivosDe(carpeta, prefijo) {
  const resultado = [];
  for (const entrada of readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) {
      resultado.push(...archivosDe(ruta, `${prefijo}${entrada.name}/`));
    } else if (entrada.isFile()) {
      resultado.push({ ruta: `${prefijo}${entrada.name}`, datos: readFileSync(ruta) });
    }
  }
  return resultado;
}

// ---------- Empaquetado ----------

// Se llama a Vite con el mismo Node que ejecuta el script: evita depender de `npm` en el PATH
// y del flag `shell` (obsoleto en Node 20+ cuando se pasan argumentos).
const vite = path.join(RAIZ, "node_modules", "vite", "bin", "vite.js");
console.log("[empaquetar] Ejecutando el build de producción…");
const build = spawnSync(process.execPath, [vite, "build"], {
  cwd: RAIZ,
  stdio: "inherit",
});
if (build.status !== 0) {
  console.error("[empaquetar] El build falló; no se generó el ZIP.");
  process.exit(build.status ?? 1);
}

const entradaNitro = path.join(RAIZ, ".output", "server", "index.mjs");
const carpetaPublica = path.join(RAIZ, ".output", "public");
if (!existsSync(entradaNitro) || !existsSync(carpetaPublica)) {
  console.error("[empaquetar] Falta .output/server/index.mjs o .output/public tras el build.");
  process.exit(1);
}

const archivos = [
  ...archivosDe(path.join(RAIZ, ".output"), ".output/"),
  {
    ruta: "app.js",
    datos: readFileSync(path.join(RAIZ, "scripts", "app.cjs")),
  },
  {
    ruta: "package.json",
    datos: Buffer.from(`${JSON.stringify(PAQUETE_EJECUCION, null, 2)}\n`, "utf8"),
  },
];

mkdirSync(path.dirname(SALIDA), { recursive: true });
const zip = crearZip(archivos);
writeFileSync(SALIDA, zip);

console.log(`[empaquetar] ZIP generado: ${path.relative(RAIZ, SALIDA)}`);
console.log(
  `[empaquetar] ${archivos.length} archivos, ${(zip.length / 1024 / 1024).toFixed(1)} MB. Node mínimo: ${NODE_MINIMO}.`,
);
console.log("[empaquetar] Sin npm install en destino: .output/server/node_modules incluye tslib.");
