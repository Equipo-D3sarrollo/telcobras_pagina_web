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
export const PAGE_SIZE_HISTORIAL = 50;
export const MAX_EXPORTAR = 10_000;
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

// Valores permitidos en auditoria.accion (los del ENUM del esquema SQL).
export const ACCIONES_AUDITORIA = [
  "login",
  "login_fallido",
  "logout",
  "crear",
  "ver",
  "editar",
  "cambiar_estado",
  "asignar",
  "eliminar",
  "restaurar",
  "exportar",
  "crear_usuario",
  "editar_usuario",
  "activar_usuario",
  "desactivar_usuario",
  "desbloquear_usuario",
  "reiniciar_password",
  "cambiar_password",
] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

export type HistorialQuery = {
  usuario: number | "todos";
  accion: AccionAuditoria | "todas";
  desde: string | undefined;
  hasta: string | undefined;
  solicitud: number | undefined;
  page: number;
};

export type HistorialSearch = { [K in keyof HistorialQuery]?: HistorialQuery[K] | undefined };

/** Igual que la lista: solo valores de las listas permitidas y un id positivo. */
export function parseHistorialQuery(input: unknown): HistorialQuery {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const rawPage = raw["page"];
  const page =
    typeof rawPage === "number"
      ? rawPage
      : typeof rawPage === "string" && /^\d{1,9}$/.test(rawPage)
        ? Number(rawPage)
        : NaN;
  return {
    usuario: parseId(raw["usuario"]) ?? "todos",
    accion: ACCIONES_AUDITORIA.find((item) => item === raw["accion"]) ?? "todas",
    desde: isIsoDay(raw["desde"]) ? raw["desde"] : undefined,
    hasta: isIsoDay(raw["hasta"]) ? raw["hasta"] : undefined,
    solicitud: parseId(raw["solicitud"]) ?? undefined,
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

/** Tras una eliminación definitiva la FK deja cotizacion_id a NULL; el #id vive en el detalle. */
export function solicitudEliminada(detalle: string | null): number | null {
  const match = /eliminación definitiva de la solicitud #(\d+)/i.exec(detalle ?? "");
  return match ? Number(match[1]) : null;
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

export type FilaPapelera = {
  id: number;
  creado_en: string;
  nombre: string;
  empresa: string;
  servicio: string;
  eliminado_en: string;
  eliminado_por: string | null;
  actualizado_en: string;
};

export type ListaPapelera = { filas: FilaPapelera[]; total: number };

export type FilaHistorial = {
  id: number;
  creado_en: string;
  usuario: string;
  accion: string;
  cotizacion_id: number | null;
  /** Etiqueta de la solicitud: «#123», «eliminada #123» o «—». */
  solicitud: string;
  /** Solo se renderiza un enlace si la fila de cotización sigue existiendo. */
  con_enlace: boolean;
  detalle: string | null;
  ip: string | null;
};

export type ListaHistorial = { filas: FilaHistorial[]; total: number };

export type PapeleraQuery = { q: string | undefined; page: number };
export type PapeleraSearch = { [K in keyof PapeleraQuery]?: PapeleraQuery[K] | undefined };

/** Consulta de la papelera: búsqueda corta y página válida. */
export function parsePapeleraQuery(input: unknown): PapeleraQuery {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const q = typeof raw["q"] === "string" ? raw["q"].trim().slice(0, MAX_BUSQUEDA) : "";
  const rawPage = raw["page"];
  const page =
    typeof rawPage === "number"
      ? rawPage
      : typeof rawPage === "string" && /^\d{1,9}$/.test(rawPage)
        ? Number(rawPage)
        : NaN;
  return {
    q: q.length > 0 ? q : undefined,
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
  };
}

/** Cuerpo de las acciones de papelera: token de concurrencia y, si aplica, el número confirmado. */
export type PapeleraInput = { actualizado_en: string; confirmacion?: number };

/** Valida el token de concurrencia (y el número de doble confirmación, si viene). */
export function parsePapeleraInput(value: unknown): PapeleraInput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw["actualizado_en"] !== "string" || Number.isNaN(Date.parse(raw["actualizado_en"])))
    return null;
  const result: PapeleraInput = { actualizado_en: raw["actualizado_en"] };
  if ("confirmacion" in raw) {
    const confirmacion = parseId(raw["confirmacion"]);
    if (confirmacion === null) return null;
    result.confirmacion = confirmacion;
  }
  return result;
}

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
  eliminar: "Eliminada",
  restaurar: "Restaurada",
  exportar: "Exportación",
  crear_usuario: "Usuario creado",
  editar_usuario: "Usuario editado",
  activar_usuario: "Usuario activado",
  desactivar_usuario: "Usuario desactivado",
  desbloquear_usuario: "Usuario desbloqueado",
  reiniciar_password: "Contraseña reiniciada",
  cambiar_password: "Contraseña cambiada",
  login: "Inicio de sesión",
  login_fallido: "Inicio de sesión fallido",
  logout: "Cierre de sesión",
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

const fechaCsv = new Intl.DateTimeFormat("es-CO", {
  timeZone: "America/Bogota",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** «dd/mm/aaaa hh:mm» en hora de Colombia para el CSV de Excel. */
export function formatFechaCsv(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = fechaCsv.formatToParts(date);
  const parte = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const hora = parte("hour") === "24" ? "00" : parte("hour");
  return `${parte("day")}/${parte("month")}/${parte("year")} ${hora}:${parte("minute")}`;
}

/** Fecha de Colombia en «aaaa-mm-dd» para el nombre del archivo. */
export function fechaArchivoCsv(now: Date = new Date()): string {
  return new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Celda CSV siempre entre comillas: así las comas, los punto y coma y los saltos de línea no
 * rompen columnas. Excel ejecuta fórmulas si la celda empieza por estos caracteres; se antepone
 * una comilla simple. Nunca se incluyen datos personales en la auditoría.
 */
export function celdaCsv(valor: string | number | null | undefined): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  const seguro = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/\r\n?/g, "\n").replace(/"/g, '""')}"`;
}

/** Resumen de filtros para la auditoría: nunca copia el texto de búsqueda del usuario. */
export function describirFiltrosCsv(query: ListQuery): string {
  const partes: string[] = [];
  if (query.q) partes.push("búsqueda aplicada");
  if (query.estado) partes.push(`estado: ${query.estado}`);
  if (query.servicio) partes.push(`servicio: ${query.servicio}`);
  if (query.responsable !== "todos") {
    partes.push(
      `responsable: ${query.responsable === "mios" ? "míos" : query.responsable === "sin_asignar" ? "sin asignar" : `#${query.responsable}`}`,
    );
  }
  if (query.desde) partes.push(`desde: ${query.desde}`);
  if (query.hasta) partes.push(`hasta: ${query.hasta}`);
  return partes.length > 0 ? partes.join("; ") : "sin filtros";
}
