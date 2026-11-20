import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { PanelShell, focusRing } from "@/components/admin/PanelShell";
import { listarPapeleraFn } from "@/lib/admin-data.server";
import { PANEL_HEAD, requirePanelSession } from "@/lib/admin-guard";
import { respuestaSoloAdmin } from "@/lib/admin-pages-guard.server";
import {
  MAX_BUSQUEDA,
  PAGE_SIZE,
  formatFechaCo,
  parsePapeleraQuery,
  type PapeleraQuery,
  type PapeleraSearch,
} from "@/lib/cotizaciones-admin-shared";

function sparse(query: PapeleraQuery): PapeleraSearch {
  return { q: query.q, page: query.page === 1 ? undefined : query.page };
}

export const Route = createFileRoute("/admin/papelera")({
  validateSearch: (search: Record<string, unknown>): PapeleraSearch =>
    sparse(parsePapeleraQuery(search)),
  beforeLoad: requirePanelSession,
  server: {
    handlers: {
      GET: async ({ request, next }) => {
        const sinAcceso = await respuestaSoloAdmin(
          request,
          "Solo los administradores pueden consultar la papelera.",
        );
        return sinAcceso ?? next();
      },
    },
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const result = await listarPapeleraFn({ data: deps });
    if (!result.ok && result.error === "unauthorized") throw redirect({ to: "/admin/login" });
    return result;
  },
  head: () => PANEL_HEAD("Papelera"),
  component: PapeleraPage,
});

const inputClass = `w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300 ${focusRing}`;
const buttonClass = `inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-extrabold ${focusRing}`;

function SinAcceso({ user }: { user: { nombre: string; rol: "administrador" | "comercial" } }) {
  return (
    <PanelShell user={user}>
      <div
        role="alert"
        className="rounded-2xl border border-amber-300/40 bg-amber-400/10 p-8 text-center"
      >
        <h1 className="text-xl font-black">Acceso restringido</h1>
        <p className="mt-2 text-sm text-slate-200">
          Solo los administradores pueden consultar la papelera.
        </p>
        <Link to="/admin" className={`${buttonClass} mt-5 border border-white/30 bg-white/10`}>
          Volver a Cotizaciones
        </Link>
      </div>
    </PanelShell>
  );
}

function PapeleraPage() {
  const { user } = Route.useRouteContext();
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const query = parsePapeleraQuery(search);

  const [q, setQ] = useState(query.q ?? "");
  const [confirmando, setConfirmando] = useState<{
    id: number;
    actualizado_en: string;
  } | null>(null);
  const [numero, setNumero] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");

  async function ejecutar(
    id: number,
    accion: "restaurar" | "definitivo",
    actualizado_en: string,
    confirmacion?: number,
  ) {
    if (procesando) return;
    setProcesando(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/cotizaciones/${id}/papelera`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accion,
          actualizado_en,
          ...(confirmacion === undefined ? {} : { confirmacion }),
        }),
      });
      if (response.ok) {
        setConfirmando(null);
        setNumero("");
        await router.invalidate();
        return;
      }
      if (response.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      if (response.status === 403) setError("No tienes permiso para realizar esta acción.");
      else if (response.status === 409)
        setError("La solicitud cambió; recarga la página e inténtalo de nuevo.");
      else if (response.status === 400) setError("El número confirmado no es correcto.");
      else setError("No se pudo completar la acción. Inténtalo de nuevo.");
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
    setProcesando(false);
  }

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigate({ search: sparse(parsePapeleraQuery({ q, page: 1 })) });
  }

  if (!data.ok) {
    if (data.error === "forbidden") return <SinAcceso user={user} />;
    return (
      <PanelShell user={user}>
        <div
          role="alert"
          className="rounded-2xl border border-red-300/40 bg-red-500/15 p-8 text-center"
        >
          <p className="font-bold text-red-100">No se pudo cargar la papelera.</p>
          <button
            type="button"
            onClick={() => void router.invalidate()}
            className={`${buttonClass} mt-4 border border-white/30 bg-white/10`}
          >
            Reintentar
          </button>
        </div>
      </PanelShell>
    );
  }

  const pages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const link = (patch: PapeleraSearch) =>
    sparse(parsePapeleraQuery({ ...query, page: 1, ...patch }));
  const disabled = "pointer-events-none opacity-40";

  return (
    <PanelShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight">Papelera</h1>
        <p className="mt-1 text-sm text-slate-300">
          Solicitudes enviadas a la papelera. Puedes restaurarlas o borrarlas definitivamente.
        </p>
      </div>

      <form
        onSubmit={buscar}
        aria-label="Buscar en la papelera"
        className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-[#10284a]/80 p-4"
      >
        <div className="min-w-0 flex-1">
          <label htmlFor="p-q" className="mb-1 block text-xs font-bold text-slate-200">
            Buscar (número, nombre, empresa o servicio)
          </label>
          <input
            id="p-q"
            type="search"
            maxLength={MAX_BUSQUEDA}
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className={`${buttonClass} bg-[#006BA4] text-white hover:bg-[#005888]`}
        >
          Buscar
        </button>
      </form>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-300/50 bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100"
        >
          {error}
        </p>
      )}

      {confirmando && (
        <div
          role="group"
          aria-label="Confirmar eliminación definitiva"
          className="mb-5 rounded-2xl border border-rose-300/50 bg-rose-500/15 p-4"
        >
          <p className="font-black text-rose-50">Eliminación definitiva</p>
          <p className="mt-1 text-sm text-rose-100">
            Esta acción no se puede deshacer. Escribe el número de la solicitud (
            <strong>#{confirmando.id}</strong>) para confirmar.
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="p-numero" className="mb-1 block text-xs font-bold text-rose-100">
                Número de la solicitud
              </label>
              <input
                id="p-numero"
                inputMode="numeric"
                autoComplete="off"
                value={numero}
                onChange={(e) => setNumero(e.currentTarget.value)}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              disabled={procesando || Number(numero) !== confirmando.id}
              onClick={() =>
                void ejecutar(
                  confirmando.id,
                  "definitivo",
                  confirmando.actualizado_en,
                  Number(numero),
                )
              }
              className={`${buttonClass} bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40`}
            >
              {procesando ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
            <button
              type="button"
              disabled={procesando}
              onClick={() => {
                setConfirmando(null);
                setNumero("");
              }}
              className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {data.filas.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#10284a]/80 p-10 text-center">
          <p className="text-lg font-black">
            {query.q ? "No hay resultados con esa búsqueda" : "La papelera está vacía"}
          </p>
        </div>
      ) : (
        <>
          <p className="sr-only" role="status">
            {data.total} solicitudes eliminadas, página {query.page}
          </p>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-[#10284a]/80 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Solicitudes en la papelera</caption>
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Fecha de creación
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Nombre
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Empresa
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Servicio
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Eliminada el
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Por quién
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.filas.map((fila) => (
                  <tr key={fila.id} className="border-b border-white/5">
                    <td className="px-4 py-3 font-bold text-slate-300">{fila.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-200">
                      {formatFechaCo(fila.creado_en)}
                    </td>
                    <td className="px-4 py-3 font-extrabold">{fila.nombre}</td>
                    <td className="px-4 py-3 text-slate-200">{fila.empresa || "—"}</td>
                    <td className="px-4 py-3 text-slate-200">{fila.servicio || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-200">
                      {formatFechaCo(fila.eliminado_en)}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{fila.eliminado_por ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={procesando}
                          onClick={() => void ejecutar(fila.id, "restaurar", fila.actualizado_en)}
                          className={`min-h-9 rounded-lg border border-[#88BD4C]/60 bg-[#88BD4C]/15 px-3 text-xs font-extrabold hover:bg-[#88BD4C]/25 disabled:opacity-50 ${focusRing}`}
                        >
                          Restaurar
                        </button>
                        <button
                          type="button"
                          disabled={procesando}
                          onClick={() => {
                            setError("");
                            setNumero("");
                            setConfirmando({
                              id: fila.id,
                              actualizado_en: fila.actualizado_en,
                            });
                          }}
                          className={`min-h-9 rounded-lg border border-rose-300/50 bg-rose-500/15 px-3 text-xs font-extrabold text-rose-100 hover:bg-rose-500/25 disabled:opacity-50 ${focusRing}`}
                        >
                          Eliminar definitivamente
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {data.filas.map((fila) => (
              <li key={fila.id} className="rounded-2xl border border-white/10 bg-[#10284a]/80 p-4">
                <p className="font-extrabold">
                  <span className="text-slate-300">#{fila.id} </span>
                  {fila.nombre}
                </p>
                <p className="mt-1 text-sm text-slate-200">
                  {[fila.empresa, fila.servicio].filter(Boolean).join(" · ") || "—"}
                </p>
                <p className="mt-2 text-xs text-slate-300">
                  Eliminada el {formatFechaCo(fila.eliminado_en)} · {fila.eliminado_por ?? "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => void ejecutar(fila.id, "restaurar", fila.actualizado_en)}
                    className={`min-h-10 rounded-lg border border-[#88BD4C]/60 bg-[#88BD4C]/15 px-3 text-xs font-extrabold disabled:opacity-50 ${focusRing}`}
                  >
                    Restaurar
                  </button>
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => {
                      setError("");
                      setNumero("");
                      setConfirmando({ id: fila.id, actualizado_en: fila.actualizado_en });
                    }}
                    className={`min-h-10 rounded-lg border border-rose-300/50 bg-rose-500/15 px-3 text-xs font-extrabold text-rose-100 disabled:opacity-50 ${focusRing}`}
                  >
                    Eliminar definitivamente
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <nav
            aria-label="Paginación"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <p className="text-slate-300">
              {data.total} resultados · Página {query.page} de {pages}
            </p>
            <div className="flex gap-2">
              <Link
                to="/admin/papelera"
                search={link({ page: query.page - 1 })}
                aria-disabled={query.page <= 1}
                tabIndex={query.page <= 1 ? -1 : undefined}
                className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20 ${query.page <= 1 ? disabled : ""}`}
              >
                Anterior
              </Link>
              <Link
                to="/admin/papelera"
                search={link({ page: query.page + 1 })}
                aria-disabled={query.page >= pages}
                tabIndex={query.page >= pages ? -1 : undefined}
                className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20 ${query.page >= pages ? disabled : ""}`}
              >
                Siguiente
              </Link>
            </div>
          </nav>
        </>
      )}
    </PanelShell>
  );
}
