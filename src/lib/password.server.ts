import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/*
 * Hash de contraseñas con scrypt de Node (sin dependencias nativas). Solo servidor.
 * También lo importa scripts/crear-usuario.mjs (Node ejecuta este .ts quitando los tipos),
 * así que aquí solo hay sintaxis TypeScript «borrable» y ningún alias de ruta.
 *
 * Formato guardado en usuarios.password_hash:
 *   scrypt$N=32768,r=8,p=3$<sal en base64>$<hash en base64>
 * Lleva el algoritmo, los parámetros, la sal y el hash, de modo que se pueden subir los
 * parámetros en el futuro sin invalidar las cuentas existentes: cada hash se verifica con
 * los parámetros con que se creó.
 */

const ALGORITHM = "scrypt";
// N=2^15, r=8, p=3: ≈ 32 MiB y ≈ 0,15 s por hash; está en la lista de combinaciones
// equivalentes de OWASP (memoria moderada, apta para hosting compartido).
const PARAMS = { N: 32768, r: 8, p: 3 };
const SALT_BYTES = 16;
const KEY_BYTES = 64;
// Tope de memoria de scrypt (128 · N · r ≈ 32 MiB para N=2^15; 64 MiB para N=2^16).
const MAX_MEMORY = 128 * 1024 * 1024;

// Límites aceptados al verificar (evita que un valor manipulado en la base pida
// cantidades absurdas de memoria o CPU).
const MAX_N = 2 ** 16;
const MIN_N = 2 ** 10;

function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, keyLength, options, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveKey(password, salt, KEY_BYTES, { ...PARAMS, maxmem: MAX_MEMORY });
  const { N, r, p } = PARAMS;
  return `${ALGORITHM}$N=${N},r=${r},p=${p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

function parseHash(stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== ALGORITHM) return null;
  const params = Object.fromEntries(
    (parts[1] ?? "").split(",").map((pair) => pair.split("=") as [string, string]),
  );
  const N = Number(params["N"]);
  const r = Number(params["r"]);
  const p = Number(params["p"]);
  const validN = Number.isInteger(N) && N >= MIN_N && N <= MAX_N && (N & (N - 1)) === 0;
  if (
    !validN ||
    !Number.isInteger(r) ||
    r < 1 ||
    r > 16 ||
    !Number.isInteger(p) ||
    p < 1 ||
    p > 16
  ) {
    return null;
  }
  const salt = Buffer.from(parts[2] ?? "", "base64");
  const hash = Buffer.from(parts[3] ?? "", "base64");
  if (salt.length < 8 || hash.length < 16) return null;
  return { N, r, p, salt, hash };
}

/** `true` si la contraseña coincide. Un hash mal formado nunca coincide (no lanza). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parsed = parseHash(stored);
  if (!parsed) return false;
  const { N, r, p, salt, hash } = parsed;
  try {
    const key = await deriveKey(password, salt, hash.length, { N, r, p, maxmem: MAX_MEMORY });
    return key.length === hash.length && timingSafeEqual(key, hash);
  } catch {
    return false;
  }
}

// Hash de una contraseña aleatoria que nadie conoce: se verifica cuando el correo no existe
// (o la cuenta está inactiva/bloqueada) para que el tiempo de respuesta sea parecido.
let dummyHash: Promise<string> | undefined;

export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(password, await dummyHash);
}
