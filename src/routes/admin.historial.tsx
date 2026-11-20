import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { PanelShell, focusRing } from "@/components/admin/PanelShell";
import { listarHistorialFn, listarUsuariosFn } from "@/lib/admin-data.server";
import { PANEL_HEAD, requirePanelSession } from "@/lib/admin-guard";
import { respuestaSoloAdmin } from "@/lib/admin-pages-guard.server";
import {
  ACCIONES_AUDITORIA,
  ACCION_LABEL,
  PAGE_SIZE_HISTORIAL,
  formatFechaCo,
  parseHistorialQuery,
  type HistorialQuery,
  type HistorialSearch,
} from "@/lib/cotizaciones-admin-shared";

function sparse(query: HistorialQuery): HistorialSearch {
  return {
    usuario: query.usuario === "todos" ? undefined : query.usuario,
    accion: query.accion === "todas" ? undefined : query.accion,
    desde: query.desde,
    hasta: query.hasta,
    solicitud: query.solicitud,
    page: query.page === 1 ? undefined : query.page,
  };
}

export const Route = createFileRoute("/admin/historial")({
  validateSearch: (search: Record<string, unknown>): HistorialSearch =>
    sparse(parseHistorialQuery(search)),
  beforeLoad: requirePanelSession,
  server: {
    handlers: {
      GET: async ({ request, next }) => {
        const sinAcceso = await respuestaSoloAdmin(
          request,
          "Solo los administradores pueden consultar el historial completo.",
        );
        return sinAcceso ?? next();
      },
    },
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [result, usuarios] = await Promise.all([
      listarHistorialFn({ data: deps }),
      listarUsuariosFn(),
    ]);
    if (
      (!result.ok && result.error === "unauthorized") ||
      (!usuarios.ok && usuarios.error === "unauthorized")
    ) {
      throw redirect({ to: "/admin/login" });
    }
    return { result, usuarios: usuarios.ok ? usuarios.usuarios : [] };
  },
  head: () => PANEL_HEAD("Historial"),
  component: HistorialPage,
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
          Solo los administradores pueden consultar el historial completo.
        </p>
        <Link to="/admin" className={`${buttonClass} mt-5 border border-white/30 bg-white/10`}>
          Volver a Cotizaciones
        </Link>
      </div>
    </PanelShell>
  );
}

function HistorialPage() {
  const { user } = Route.useRouteContext();
  const search = Route.useSearch();
  const { result, usuarios } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const query = parseHistorialQuery(search);

  const [usuario, setUsuario] = useState(String(query.usuario));
  const [accion, setAccion] = useState(query.accion === "todas" ? "" : query.accion);
  const [desde, setDesde] = useState(query.desde ?? "");
  const [hasta, setHasta] = useState(query.hasta ?? "");
  const [solicitud, setSolicitud] = useState(query.solicitud?.toString() ?? "");

  function aplicar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigate({
      search: sparse(
        parseHistorialQuery({
          usuario,
          accion,
          desde,
          hasta,
          solicitud,
          page: 1,
        }),
      ),
    });
  }

  function limpiar() {
    setUsuario("todos");
    setAccion("");
    setDesde("");
    setHasta("");
    setSolicitud("");
    void navigate({ search: sparse(parseHistorialQuery({})) });
  }

  if (!result.ok) {
    if (result.error === "forbidden") return <SinAcceso user={user} />;
    return (
      <PanelShell user={user}>
        <div
          role="alert"
          className="rounded-2xl border border-red-300/40 bg-red-500/15 p-8 text-center"
        >
          <p className="font-bold text-red-100">No se pudo cargar el historial.</p>
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

  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE_HISTORIAL));
  const link = (patch: HistorialSearch) =>
    sparse(parseHistorialQuery({ ...query, page: 1, ...patch }));
  const disabled = "pointer-events-none opacity-40";
  const hasFilters =
    query.usuario !== "todos" ||
    query.accion !== "todas" ||
    Boolean(query.desde || query.hasta || query.solicitud);

  return (
    <PanelShell user={user}>
      <div className="mb-5">
        <h1 className="text-2xl font-black tracking-tight">Historial</h1>
        <p className="mt-1 text-sm text-slate-300">
          Registro completo de acciones del panel. Consultarlo no genera nuevos registros.
        </p>
      </div>

      <form
        onSubmit={aplicar}
        aria-label="Filtros del historial"
        className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#10284a]/80 p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div>
          <label htmlFor="h-usuario" className="mb-1 block text-xs font-bold text-slate-200">
            Usuario
          </label>
          <select
            id="h-usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.currentTarget.value)}
            className={inputClass}
          >
            <option value="todos">Todos</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
            {typeof query.usuario === "number" && !usuarios.some((u) => u.id === query.usuario) && (
              <option value={query.usuario}>Usuario #{query.usuario}</option>
            )}
          </select>
        </div>
        <div>
          <label htmlFor="h-accion" className="mb-1 block text-xs font-bold text-slate-200">
            Acción
          </label>
          <select
            id="h-accion"
            value={accion}
            onChange={(e) => setAccion(e.currentTarget.value)}
            className={inputClass}
          >
            <option value="">Todas</option>
            {ACCIONES_AUDITORIA.map((item) => (
              <option key={item} value={item}>
                {ACCION_LABEL[item] ?? item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="h-desde" className="mb-1 block text-xs font-bold text-slate-200">
            Desde
          </label>
          <input
            id="h-desde"
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.currentTarget.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="h-hasta" className="mb-1 block text-xs font-bold text-slate-200">
            Hasta
          </label>
          <input
            id="h-hasta"
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.currentTarget.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="h-solicitud" className="mb-1 block text-xs font-bold text-slate-200">
            N.º de solicitud
          </label>
          <input
            id="h-solicitud"
            type="number"
            min={1}
            inputMode="numeric"
            value={solicitud}
            onChange={(e) => setSolicitud(e.currentTarget.value)}
            className={inputClass}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5 lg:justify-end">
          <button
            type="submit"
            className={`${buttonClass} bg-[#006BA4] text-white hover:bg-[#005888]`}
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={limpiar}
            className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20`}
          >
            Limpiar
          </button>
        </div>
      </form>

      {result.filas.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#10284a]/80 p-10 text-center">
          <p className="text-lg font-black">
            {hasFilters ? "No hay registros con estos filtros" : "Aún no hay registros"}
          </p>
        </div>
      ) : (
        <>
          <p className="sr-only" role="status">
            {result.total} registros, página {query.page}
          </p>

          <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-[#10284a]/80 md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Historial de acciones del panel</caption>
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Fecha
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Usuario
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acción
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Solicitud
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Detalle
                  </th>
                  <th scope="col" className="px-4 py-3">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.filas.map((fila) => (
                  <tr key={fila.id} className="border-b border-white/5">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-200">
                      {formatFechaCo(fila.creado_en)}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{fila.usuario}</td>
                    <td className="px-4 py-3 font-bold">
                      {ACCION_LABEL[fila.accion] ?? fila.accion}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {fila.con_enlace && fila.cotizacion_id !== null ? (
                        <Link
                          to="/admin/cotizaciones/$id"
                          params={{ id: String(fila.cotizacion_id) }}
                          className={`hover:underline ${focusRing}`}
                        >
                          {fila.solicitud}
                        </Link>
                      ) : fila.solicitud.startsWith("eliminada ") ? (
                        <span className="text-slate-300">Solicitud {fila.solicitud}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="max-w-md break-words px-4 py-3 text-slate-200">
                      {fila.detalle ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                      {fila.ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {result.filas.map((fila) => (
              <li key={fila.id} className="rounded-2xl border border-white/10 bg-[#10284a]/80 p-4">
                <p className="flex flex-wrap justify-between gap-2 text-xs text-slate-300">
                  <span>{formatFechaCo(fila.creado_en)}</span>
                  <span>{ACCION_LABEL[fila.accion] ?? fila.accion}</span>
                </p>
                <p className="mt-1 font-extrabold">{fila.usuario}</p>
                <p className="mt-1 text-sm text-slate-200">
                  {fila.con_enlace && fila.cotizacion_id !== null ? (
                    <Link
                      to="/admin/cotizaciones/$id"
                      params={{ id: String(fila.cotizacion_id) }}
                      className={`hover:underline ${focusRing}`}
                    >
                      {fila.solicitud}
                    </Link>
                  ) : fila.solicitud.startsWith("eliminada ") ? (
                    `Solicitud ${fila.solicitud}`
                  ) : (
                    "—"
                  )}
                </p>
                {fila.detalle && (
                  <p className="mt-1 break-words text-sm text-slate-200">{fila.detalle}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">IP: {fila.ip ?? "—"}</p>
              </li>
            ))}
          </ul>

          <nav
            aria-label="Paginación"
            className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <p className="text-slate-300">
              {result.total} registros · Página {query.page} de {pages}
            </p>
            <div className="flex gap-2">
              <Link
                to="/admin/historial"
                search={link({ page: query.page - 1 })}
                aria-disabled={query.page <= 1}
                tabIndex={query.page <= 1 ? -1 : undefined}
                className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20 ${query.page <= 1 ? disabled : ""}`}
              >
                Anterior
              </Link>
              <Link
                to="/admin/historial"
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
