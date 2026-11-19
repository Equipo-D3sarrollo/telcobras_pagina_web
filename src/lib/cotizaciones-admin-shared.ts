/*
 * Tipos, listas permitidas y validación de entradas del panel de cotizaciones. Sin código de
 * servidor: lo importan tanto las páginas como la capa de servidor, que vuelve a validar
 * todo lo que recibe (nunca se confía en lo que manda el navegador).
 */

export const ESTADOS = ["nueva", "en_revision", "cotizada", "ganada", "perdida"] as const;
export type Estado = (typeof ESTADOS)[number];

export const ESTADO_LABEL: Record<Estado, string> = {
  nueva: "Nueva",
  en_revision: "En revisión",
  cotizada: "Cotizada",
  ganada: "Ganada",
  perdida: "Perdida",
};

// Orden permitido: la clave es lo que viaja en la URL; la columna SQL la fija el servidor.
export const ORDENES = ["fecha", "id", "nombre", "estado"] as const;
export type Orden = (typeof ORDENES)[number];
export type Dir = "asc" | "desc";

export const PAGE_SIZE = 20;
const MAX_PAGE = 100_000;
export const MAX_BUSQUEDA = 100;
export const MAX_SERVICIO = 120;
export const NOTAS_MAX = 5000;

export const FILTROS_RESPONSABLE = ["todos", "mios", "sin_asignar"] as const;
export type FiltroResponsableBase = (typeof FILTROS_RESPONSABLE)[number];
/** «todos»/«mios»/«sin_asignar» o el id de un usuario (solo administradores). */
export type FiltroResponsable = FiltroResponsableBase | number;

export type ListQuery = {
  q: string | undefined;
  estado: Estado | undefined;
  servicio: string | undefined;
  responsable: FiltroResponsable;
  desde: string | undefined;
  hasta: string | undefined;
  orden: Orden;
  dir: Dir;
  page: number;
};

function isIsoDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Los mismos campos, todos opcionales (lo que de verdad viaja en la URL). */
export type ListSearch = { [K in keyof ListQuery]?: ListQuery[K] | undefined };

/** Solo los valores fijos o un id entero positivo; cualquier otra cosa vuelve a «todos». */
export function parseResponsable(value: unknown): FiltroResponsable {
  if (typeof value === "string" && FILTROS_RESPONSABLE.some((item) => item === value)) {
    return value as FiltroResponsableBase;
  }
  return parseId(value) ?? "todos";
}

/** Un comercial puede usar «mios» y «sin_asignar», nunca el id de otra persona. */
export function responsablePermitido(valor: FiltroResponsable, rol: Rol): boolean {
  return typeof valor !== "number" || rol === "administrador";
}

/** Convierte lo que llega de la URL en una consulta válida; lo inválido se descarta. */
export function parseListQuery(input: unknown): ListQuery {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim().slice(0, max);
    return trimmed.length > 0 ? trimmed : undefined;
  };
  // Solo enteros escritos con dígitos («1e3» o «0x10» no valen).
  const rawPage = raw["page"];
  const page =
    typeof rawPage === "number"
      ? rawPage
      : typeof rawPage === "string" && /^\d{1,9}$/.test(rawPage)
        ? Number(rawPage)
        : NaN;
  return {
    q: text(raw["q"], MAX_BUSQUEDA),
    estado: ESTADOS.find((estado) => estado === raw["estado"]),
    servicio: text(raw["servicio"], MAX_SERVICIO),
    responsable: parseResponsable(raw["responsable"]),
    desde: isIsoDay(raw["desde"]) ? raw["desde"] : undefined,
    hasta: isIsoDay(raw["hasta"]) ? raw["hasta"] : undefined,
    orden: ORDENES.find((orden) => orden === raw["orden"]) ?? "fecha",
    dir: raw["dir"] === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

/** Escapa % y _ (y el propio carácter de escape «!») para usar el texto en un LIKE. */
export function escapeLike(value: string): string {
  return value.replace(/[!%_]/g, (char) => `!${char}`);
}

export function parseId(input: unknown): number | null {
  const value =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>)["id"] : input;
  const id = typeof value === "string" && /^\d{1,10}$/.test(value) ? Number(value) : value;
  return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= 4_294_967_295
    ? id
    : null;
}

export type UpdateInput = {
  actualizado_en: string;
  estado?: Estado;
  responsable_id?: number | null;
  notas?: string;
};

/** Valida el cuerpo de «guardar cambios»; `null` si algo no es válido. */
export function parseUpdateInput(value: unknown): UpdateInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw["actualizado_en"] !== "string" || Number.isNaN(Date.parse(raw["actualizado_en"])))
    return null;
  const result: UpdateInput = { actualizado_en: raw["actualizado_en"] };

  if ("estado" in raw) {
    const estado = ESTADOS.find((item) => item === raw["estado"]);
    if (!estado) return null;
    result.estado = estado;
  }
  if ("responsable_id" in raw) {
    const id = raw["responsable_id"];
    if (id !== null && !(typeof id === "number" && Number.isInteger(id) && id > 0)) return null;
    result.responsable_id = id;
  }
  if ("notas" in raw) {
    if (typeof raw["notas"] !== "string" || raw["notas"].length > NOTAS_MAX) return null;
    result.notas = raw["notas"];
  }
  return result;
}

// ---------------------------------------------------------------------------
// Formas de los datos que viajan al navegador (fechas en ISO 8601)
// ---------------------------------------------------------------------------

export type Rol = "administrador" | "comercial";

export type FilaCotizacion = {
  id: number;
  creado_en: string;
  nombre: string;
  empresa: string;
  servicio: string;
  estado: Estado;
  responsable: string | null;
};

export type ListaCotizaciones = {
  filas: FilaCotizacion[];
  total: number;
  conteos: Record<Estado, number>;
  servicios: string[];
  /** Usuarios activos para el filtro por responsable; vacío para comerciales. */
  responsables: { id: number; nombre: string }[];
};

export type EntradaHistorial = {
  creado_en: string;
  accion: string;
  detalle: string | null;
  usuario: string | null;
};

export type DetalleCotizacion = {
  id: number;
  nombre: string;
  empresa: string;
  cargo: string;
  correo: string;
  telefono: string;
  servicio: string;
  mensaje: string;
  consentimiento_fecha: string;
  origen: "formulario_web" | "manual" | "migracion_supabase";
  idioma: string;
  estado: Estado;
  responsable_id: number | null;
  responsable: string | null;
  notas: string;
  creado_en: string;
  actualizado_en: string;
  historial: EntradaHistorial[];
  /** Solo para administradores: usuarios activos a los que se puede asignar. */
  usuarios: { id: number; nombre: string }[];
};

export const ACCION_LABEL: Record<string, string> = {
  crear: "Creada",
  ver: "Consultada",
  cambiar_estado: "Cambio de estado",
  asignar: "Asignación",
  editar: "Notas editadas",
};

export const ORIGEN_LABEL = {
  formulario_web: "Formulario web",
  manual: "Creada a mano",
  migracion_supabase: "Migrada de Supabase",
} as const;

const fechaCo = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  dateStyle: "medium",
  timeStyle: "short",
});

/** Fecha y hora en formato es-CO, hora de Colombia. */
export function formatFechaCo(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : fechaCo.format(date);
}
