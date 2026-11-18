import { createPool, type Pool } from "mysql2/promise";

/*
 * Pool de conexiones a MySQL/MariaDB (cPanel o XAMPP local). Solo servidor: el sufijo
 * `.server.ts` hace que TanStack Start impida importarlo desde código del cliente.
 * Las credenciales llegan por variables de entorno (DB_HOST, DB_PORT, DB_NAME, DB_USER,
 * DB_PASSWORD); nunca se muestran ni se registran.
 */

const REQUIRED_VARS = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"] as const;
const DEFAULT_PORT = 3306;

/** Falta o es inválida la configuración de la base: el mensaje solo nombra variables. */
export class DbConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DbConfigError";
  }
}

function readConfig() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new DbConfigError(
      `Faltan variables de entorno de la base de datos: ${missing.join(", ")}`,
    );
  }

  const portText = process.env["DB_PORT"]?.trim();
  const port = portText ? Number(portText) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new DbConfigError("DB_PORT debe ser un número de puerto válido (1-65535)");
  }

  return {
    host: process.env["DB_HOST"]!.trim(),
    port,
    database: process.env["DB_NAME"]!.trim(),
    user: process.env["DB_USER"]!.trim(),
    password: process.env["DB_PASSWORD"]!,
  };
}

// Una sola instancia por proceso; en desarrollo se guarda en globalThis para que la
// recarga de módulos (HMR) no abra un pool nuevo cada vez.
const globalForDb = globalThis as typeof globalThis & { __telcobrasDbPool?: Pool };

export function getPool(): Pool {
  if (!globalForDb.__telcobrasDbPool) {
    globalForDb.__telcobrasDbPool = createPool({
      ...readConfig(),
      charset: "utf8mb4",
      timezone: "-05:00",
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 20,
      connectTimeout: 10_000,
      enableKeepAlive: true,
      idleTimeout: 60_000,
    });
  }
  return globalForDb.__telcobrasDbPool;
}
