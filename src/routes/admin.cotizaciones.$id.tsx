import { useState } from "react";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { EstadoBadge, PanelShell, focusRing } from "@/components/admin/PanelShell";
import { obtenerCotizacionFn } from "@/lib/admin-data.server";
import { PANEL_HEAD, requirePanelSession } from "@/lib/admin-guard";
import {
  ACCION_LABEL,
  ESTADOS,
  ESTADO_LABEL,
  NOTAS_MAX,
  ORIGEN_LABEL,
  formatFechaCo,
  type DetalleCotizacion,
  type EntradaHistorial,
  type Estado,
} from "@/lib/cotizaciones-admin-shared";

export const Route = createFileRoute("/admin/cotizaciones/$id")({
  beforeLoad: requirePanelSession,
  loader: async ({ params }) => {
    const result = await obtenerCotizacionFn({ data: params.id });
    if (!result.ok) {
      if (result.error === "unauthorized") throw redirect({ to: "/admin/login" });
      if (result.error === "not_found") throw notFound();
    }
    return result;
  },
  head: () => PANEL_HEAD("Solicitud"),
  notFoundComponent: SolicitudNoEncontrada,
  component: DetallePage,
});

const field = `w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300 ${focusRing}`;
const button = `inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;
const card = "rounded-2xl border border-white/10 bg-[#10284a]/80 p-5";

function SolicitudNoEncontrada() {
  const { user } = Route.useRouteContext();
  return (
    <PanelShell user={user}>
      <div className={`${card} mx-auto max-w-lg text-center`}>
        <h1 className="text-2xl font-black">Solicitud no encontrada</h1>
        <p className="mt-2 text-sm text-slate-300">Esta solicitud no existe o fue eliminada.</p>
        <Link
          to="/admin"
          className={`${button} mt-5 border border-white/30 bg-white/10 hover:bg-white/20`}
        >
          Volver a la lista
        </Link>
      </div>
    </PanelShell>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-300">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-bold text-white">{children}</dd>
    </div>
  );
}

function DetallePage() {
  const { user } = Route.useRouteContext();
  const data = Route.useLoaderData();

  if (!data.ok) {
    return (
      <PanelShell user={user}>
        <div role="alert" className={`${card} mx-auto max-w-lg text-center`}>
          <p className="font-bold text-red-100">No se pudo cargar la solicitud.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`${button} mt-4 border border-white/30 bg-white/10`}
          >
            Reintentar
          </button>
        </div>
      </PanelShell>
    );
  }
  return <Detalle user={user} detalle={data.detalle} rol={data.rol} usuarioId={data.usuarioId} />;
}

type Guardado = {
  estado: Estado;
  responsable_id: number | null;
  responsable: string | null;
  notas: string;
  actualizado_en: string;
  historial: EntradaHistorial[];
};

function Detalle({
  user,
  detalle,
  rol,
  usuarioId,
}: {
  user: { nombre: string; rol: "administrador" | "comercial" };
  detalle: DetalleCotizacion;
  rol: "administrador" | "comercial";
  usuarioId: number;
}) {
  const esAdmin = rol === "administrador";
  const [guardado, setGuardado] = useState<Guardado>({
    estado: detalle.estado,
    responsable_id: detalle.responsable_id,
    responsable: detalle.responsable,
    notas: detalle.notas,
    actualizado_en: detalle.actualizado_en,
    historial: detalle.historial,
  });
  const [estado, setEstado] = useState<Estado>(detalle.estado);
  const [notas, setNotas] = useState(detalle.notas);
  const [responsable, setResponsable] = useState(detalle.responsable_id?.toString() ?? "");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState("");
  const [error, setError] = useState("");
  const [conflicto, setConflicto] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function enviar(cambios: Record<string, unknown>) {
    setOk("");
    setError("");
    setConflicto(false);
    if (Object.keys(cambios).length === 0) {
      setOk("No hay cambios para guardar.");
      return;
    }
    setEnviando(true);
    try {
      const response = await fetch(`/api/admin/cotizaciones/${detalle.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actualizado_en: guardado.actualizado_en, ...cambios }),
      });
      if (response.ok) {
        const result = (await response.json()) as Guardado;
        setGuardado(result);
        setEstado(result.estado);
        setNotas(result.notas);
        setResponsable(result.responsable_id?.toString() ?? "");
        setOk("Cambios guardados.");
      } else if (response.status === 409) {
        setConflicto(true);
        setError("Otra persona modificó esta solicitud; recarga para ver los cambios.");
      } else if (response.status === 401) {
        window.location.assign("/admin/login");
      } else if (response.status === 403) {
        setError("No tienes permiso para hacer ese cambio.");
      } else if (response.status === 404) {
        setError("Esta solicitud ya no existe.");
      } else if (response.status === 429) {
        setError("Demasiadas acciones seguidas. Espera un momento e inténtalo de nuevo.");
      } else {
        setError("No se pudo guardar. Inténtalo de nuevo.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
    setEnviando(false);
  }

  function guardar() {
    const cambios: Record<string, unknown> = {};
    if (estado !== guardado.estado) cambios["estado"] = estado;
    if (notas !== guardado.notas) cambios["notas"] = notas;
    if (esAdmin && responsable !== (guardado.responsable_id?.toString() ?? "")) {
      cambios["responsable_id"] = responsable === "" ? null : Number(responsable);
    }
    void enviar(cambios);
  }

  /** Envía la solicitud a la papelera (solo administrador) respetando la concurrencia. */
  async function eliminar() {
    if (eliminando) return;
    setEliminando(true);
    setOk("");
    setError("");
    setConflicto(false);
    try {
      const response = await fetch(`/api/admin/cotizaciones/${detalle.id}/papelera`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ accion: "eliminar", actualizado_en: guardado.actualizado_en }),
      });
      if (response.ok) {
        window.location.assign("/admin");
        return;
      }
      if (response.status === 409) {
        setConflicto(true);
        setError("Otra persona modificó esta solicitud; recarga para ver los cambios.");
      } else if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      } else if (response.status === 403) {
        setError("No tienes permiso para eliminar solicitudes.");
      } else if (response.status === 404) {
        setError("Esta solicitud ya no existe.");
      } else {
        setError("No se pudo enviar a la papelera. Inténtalo de nuevo.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
    setEliminando(false);
    setConfirmandoEliminar(false);
  }

  const mailto = `mailto:${encodeURIComponent(detalle.correo).replace(/%40/g, "@")}`;
  const tel = `tel:${detalle.telefono.replace(/[^\d+]/g, "")}`;

  return (
    <PanelShell user={user}>
      <Link
        to="/admin"
        className={`mb-4 inline-flex min-h-11 items-center text-sm font-bold text-slate-200 hover:text-white ${focusRing}`}
      >
        ← Volver a la lista
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight">
          Solicitud #{detalle.id} · {detalle.nombre}
        </h1>
        <EstadoBadge estado={guardado.estado} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section aria-labelledby="h-cliente" className={card}>
            <h2 id="h-cliente" className="mb-4 text-lg font-black">
              Cliente
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Dato label="Nombre">{detalle.nombre}</Dato>
              <Dato label="Empresa">{detalle.empresa || "—"}</Dato>
              <Dato label="Cargo">{detalle.cargo || "—"}</Dato>
              <Dato label="Servicio">{detalle.servicio || "—"}</Dato>
              <Dato label="Correo">
                <a href={mailto} className={`underline hover:text-[#F3CB35] ${focusRing}`}>
                  {detalle.correo}
                </a>
              </Dato>
              <Dato label="Teléfono">
                <a href={tel} className={`underline hover:text-[#F3CB35] ${focusRing}`}>
                  {detalle.telefono}
                </a>
              </Dato>
            </dl>
          </section>

          <section aria-labelledby="h-mensaje" className={card}>
            <h2 id="h-mensaje" className="mb-3 text-lg font-black">
              Mensaje
            </h2>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-100">
              {detalle.mensaje || "El cliente no dejó un mensaje."}
            </p>
            <dl className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
              <Dato label="Autorización de datos (Ley 1581)">
                {formatFechaCo(detalle.consentimiento_fecha)}
              </Dato>
              <Dato label="Origen">{ORIGEN_LABEL[detalle.origen]}</Dato>
              <Dato label="Idioma">{detalle.idioma.toUpperCase()}</Dato>
              <Dato label="Recibida">{formatFechaCo(detalle.creado_en)}</Dato>
            </dl>
          </section>

          <section aria-labelledby="h-historial" className={card}>
            <h2 id="h-historial" className="mb-3 text-lg font-black">
              Historial
            </h2>
            {guardado.historial.length === 0 ? (
              <p className="text-sm text-slate-300">Sin movimientos.</p>
            ) : (
              <ol className="space-y-3">
                {guardado.historial.map((h, i) => (
                  <li
                    key={`${h.creado_en}-${i}`}
                    className="border-l-2 border-white/20 pl-3 text-sm"
                  >
                    <p className="font-bold">
                      {ACCION_LABEL[h.accion] ?? h.accion}
                      <span className="font-normal text-slate-300">
                        {" "}
                        · {h.usuario ?? (h.accion === "crear" ? "Formulario web" : "Sistema")}
                      </span>
                    </p>
                    {h.detalle && <p className="text-slate-200">{h.detalle}</p>}
                    <p className="text-xs text-slate-400">{formatFechaCo(h.creado_en)}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <section aria-labelledby="h-gestion" className={`${card} h-fit space-y-4`}>
          <h2 id="h-gestion" className="text-lg font-black">
            Gestión
          </h2>

          <div>
            <label htmlFor="d-estado" className="mb-1 block text-xs font-bold text-slate-200">
              Estado
            </label>
            <select
              id="d-estado"
              value={estado}
              onChange={(e) => setEstado(e.currentTarget.value as Estado)}
              className={field}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_LABEL[e]}
                </option>
              ))}
            </select>
          </div>

          <div>
            {esAdmin ? (
              <>
                <label htmlFor="d-resp" className="mb-1 block text-xs font-bold text-slate-200">
                  Responsable
                </label>
                <select
                  id="d-resp"
                  value={responsable}
                  onChange={(e) => setResponsable(e.currentTarget.value)}
                  className={field}
                >
                  <option value="">Sin asignar</option>
                  {detalle.usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <p className="mb-1 text-xs font-bold text-slate-200">Responsable</p>
                <p className="text-sm font-bold">
                  {guardado.responsable_id === usuarioId
                    ? "Asignada a ti"
                    : (guardado.responsable ?? "Sin asignar")}
                </p>
                {guardado.responsable_id === null && (
                  <button
                    type="button"
                    disabled={enviando}
                    onClick={() => void enviar({ responsable_id: usuarioId })}
                    className={`${button} mt-2 border border-white/30 bg-white/10 hover:bg-white/20`}
                  >
                    Tomar
                  </button>
                )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="d-notas" className="mb-1 block text-xs font-bold text-slate-200">
              Notas internas (el cliente no las ve)
            </label>
            <textarea
              id="d-notas"
              rows={6}
              maxLength={NOTAS_MAX}
              value={notas}
              onChange={(e) => setNotas(e.currentTarget.value)}
              className={field}
            />
            <p className="mt-1 text-right text-xs text-slate-400">
              {notas.length} / {NOTAS_MAX}
            </p>
          </div>

          <button
            type="button"
            disabled={enviando}
            onClick={guardar}
            className={`${button} w-full bg-gradient-to-r from-[#0087C3] to-[#478a1f] text-white hover:brightness-110`}
          >
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>

          {esAdmin && (
            <div className="rounded-xl border border-rose-300/30 bg-rose-500/10 p-3">
              {!confirmandoEliminar ? (
                <button
                  type="button"
                  onClick={() => {
                    setOk("");
                    setError("");
                    setConflicto(false);
                    setConfirmandoEliminar(true);
                  }}
                  className={`${button} w-full border border-rose-300/60 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25`}
                >
                  Eliminar
                </button>
              ) : (
                <div role="group" aria-label="Confirmar eliminación">
                  <p className="mb-2 text-sm font-bold text-rose-100">
                    ¿Enviar la solicitud #{detalle.id} a la papelera? Podrás restaurarla después.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={eliminando}
                      onClick={() => void eliminar()}
                      className={`${button} border border-rose-300/60 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60`}
                    >
                      {eliminando ? "Eliminando…" : "Confirmar eliminación"}
                    </button>
                    <button
                      type="button"
                      disabled={eliminando}
                      onClick={() => setConfirmandoEliminar(false)}
                      className={`${button} border border-white/30 bg-white/10 hover:bg-white/20`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div aria-live="polite">
            {ok && (
              <p className="rounded-xl border border-emerald-300/40 bg-emerald-400/15 px-3 py-2 text-sm font-bold text-emerald-100">
                {ok}
              </p>
            )}
          </div>
          <div role="alert">
            {error && (
              <div className="rounded-xl border border-red-300/50 bg-red-500/15 px-3 py-2 text-sm font-bold text-red-100">
                <p>{error}</p>
                {conflicto && (
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className={`${button} mt-2 border border-white/30 bg-white/10`}
                  >
                    Recargar
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </PanelShell>
  );
}
