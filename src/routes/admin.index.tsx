import { useState, type FormEvent } from "react";
import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { EstadoBadge, PanelShell, focusRing } from "@/components/admin/PanelShell";
import { listarCotizacionesFn } from "@/lib/admin-data.server";
import { PANEL_HEAD, requirePanelSession } from "@/lib/admin-guard";
import {
  ESTADOS,
  ESTADO_LABEL,
  MAX_BUSQUEDA,
  PAGE_SIZE,
  formatFechaCo,
  parseListQuery,
  type ListQuery,
  type ListSearch,
  type Orden,
} from "@/lib/cotizaciones-admin-shared";

// En la URL solo viajan los valores que no son los de por defecto (enlaces cortos y compartibles).
function sparse(query: ListQuery): ListSearch {
  return {
    q: query.q,
    estado: query.estado,
    servicio: query.servicio,
    desde: query.desde,
    hasta: query.hasta,
    orden: query.orden === "fecha" ? undefined : query.orden,
    dir: query.dir === "desc" ? undefined : query.dir,
    page: query.page === 1 ? undefined : query.page,
  };
}

export const Route = createFileRoute("/admin/")({
  validateSearch: (search: Record<string, unknown>): ListSearch => sparse(parseListQuery(search)),
  beforeLoad: requirePanelSession,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const result = await listarCotizacionesFn({ data: deps });
    if (!result.ok && result.error === "unauthorized") throw redirect({ to: "/admin/login" });
    return result;
  },
  head: () => PANEL_HEAD("Cotizaciones"),
  component: ListaPage,
});

const inputClass = `w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300 ${focusRing}`;
const buttonClass = `inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-extrabold ${focusRing}`;

function ListaPage() {
  const { user } = Route.useRouteContext();
  const search = Route.useSearch();
  const data = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const query = parseListQuery(search);

  const [q, setQ] = useState(query.q ?? "");
  const [estado, setEstado] = useState(query.estado ?? "");
  const [servicio, setServicio] = useState(query.servicio ?? "");
  const [desde, setDesde] = useState(query.desde ?? "");
  const [hasta, setHasta] = useState(query.hasta ?? "");

  const link = (patch: ListSearch) => sparse(parseListQuery({ ...query, page: 1, ...patch }));

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void navigate({
      search: sparse(parseListQuery({ ...query, q, estado, servicio, desde, hasta, page: 1 })),
    });
  }

  function clearFilters() {
    setQ("");
    setEstado("");
    setServicio("");
    setDesde("");
    setHasta("");
    void navigate({ search: sparse(parseListQuery({ orden: query.orden, dir: query.dir })) });
  }

  const sortLink = (orden: Orden) =>
    link({ orden, dir: query.orden === orden && query.dir === "desc" ? "asc" : "desc" });
  const ariaSort = (orden: Orden) =>
    query.orden === orden ? (query.dir === "asc" ? "ascending" : "descending") : "none";

  const hasFilters = Boolean(
    query.q || query.estado || query.servicio || query.desde || query.hasta,
  );

  return (
    <PanelShell user={user}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Cotizaciones</h1>
        <Link
          to="/admin/cotizaciones/nueva"
          className={`${buttonClass} bg-gradient-to-r from-[#0087C3] to-[#478a1f] text-white hover:brightness-110`}
        >
          Nueva solicitud
        </Link>
      </div>

      {!data.ok ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-300/40 bg-red-500/15 p-6 text-center"
        >
          <p className="font-bold text-red-100">No se pudieron cargar las solicitudes.</p>
          <button
            type="button"
            onClick={() => void router.invalidate()}
            className={`${buttonClass} mt-4 border border-white/30 bg-white/10 hover:bg-white/20`}
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <nav
            aria-label="Estados"
            className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
          >
            <Link
              to="/admin"
              search={link({ estado: undefined })}
              aria-current={query.estado ? undefined : "true"}
              className={`rounded-xl border p-3 text-left ${focusRing} ${query.estado ? "border-white/15 bg-white/5 hover:bg-white/10" : "border-[#88BD4C] bg-white/15"}`}
            >
              <span className="block text-2xl font-black">
                {ESTADOS.reduce((sum, e) => sum + data.conteos[e], 0)}
              </span>
              <span className="text-xs font-bold text-slate-200">Todas</span>
            </Link>
            {ESTADOS.map((e) => (
              <Link
                key={e}
                to="/admin"
                search={link({ estado: e })}
                aria-current={query.estado === e ? "true" : undefined}
                className={`rounded-xl border p-3 text-left ${focusRing} ${query.estado === e ? "border-[#88BD4C] bg-white/15" : "border-white/15 bg-white/5 hover:bg-white/10"}`}
              >
                <span className="block text-2xl font-black">{data.conteos[e]}</span>
                <span className="text-xs font-bold text-slate-200">{ESTADO_LABEL[e]}</span>
              </Link>
            ))}
          </nav>

          <form
            onSubmit={applyFilters}
            aria-label="Filtros"
            className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-[#10284a]/80 p-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="f-q" className="mb-1 block text-xs font-bold text-slate-200">
                Buscar (nombre, empresa o correo)
              </label>
              <input
                id="f-q"
                name="q"
                type="search"
                maxLength={MAX_BUSQUEDA}
                value={q}
                onChange={(e) => setQ(e.currentTarget.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="f-estado" className="mb-1 block text-xs font-bold text-slate-200">
                Estado
              </label>
              <select
                id="f-estado"
                name="estado"
                value={estado}
                onChange={(e) => setEstado(e.currentTarget.value as typeof estado)}
                className={inputClass}
              >
                <option value="">Todos</option>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_LABEL[e]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-servicio" className="mb-1 block text-xs font-bold text-slate-200">
                Servicio
              </label>
              <select
                id="f-servicio"
                name="servicio"
                value={servicio}
                onChange={(e) => setServicio(e.currentTarget.value)}
                className={inputClass}
              >
                <option value="">Todos</option>
                {(servicio && !data.servicios.includes(servicio)
                  ? [servicio, ...data.servicios]
                  : data.servicios
                ).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-desde" className="mb-1 block text-xs font-bold text-slate-200">
                Desde
              </label>
              <input
                id="f-desde"
                name="desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.currentTarget.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="f-hasta" className="mb-1 block text-xs font-bold text-slate-200">
                Hasta
              </label>
              <input
                id="f-hasta"
                name="hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.currentTarget.value)}
                className={inputClass}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2 lg:col-span-6 lg:justify-end">
              <button
                type="submit"
                className={`${buttonClass} bg-[#006BA4] text-white hover:bg-[#005888]`}
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20`}
              >
                Limpiar
              </button>
            </div>
          </form>

          {data.filas.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#10284a]/80 p-10 text-center">
              <p className="text-lg font-black">
                {hasFilters ? "No hay solicitudes con estos filtros" : "Aún no hay solicitudes"}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {hasFilters
                  ? "Prueba con otra búsqueda o quita algún filtro."
                  : "Cuando alguien envíe el formulario del sitio, aparecerá aquí."}
              </p>
            </div>
          ) : (
            <>
              <p className="sr-only" role="status">
                {data.total} solicitudes, página {query.page}
              </p>

              {/* Escritorio: tabla */}
              <div className="hidden overflow-x-auto rounded-2xl border border-white/10 bg-[#10284a]/80 md:block">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Solicitudes de cotización</caption>
                  <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-300">
                    <tr>
                      {(
                        [
                          ["id", "#"],
                          ["fecha", "Fecha"],
                          ["nombre", "Nombre"],
                        ] as [Orden, string][]
                      ).map(([orden, label]) => (
                        <th
                          key={orden}
                          scope="col"
                          aria-sort={ariaSort(orden)}
                          className="px-4 py-3"
                        >
                          <Link
                            to="/admin"
                            search={sortLink(orden)}
                            className={`font-extrabold hover:text-white ${focusRing}`}
                          >
                            {label}
                            {query.orden === orden ? (query.dir === "asc" ? " ↑" : " ↓") : ""}
                          </Link>
                        </th>
                      ))}
                      <th scope="col" className="px-4 py-3">
                        Empresa
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Servicio
                      </th>
                      <th scope="col" aria-sort={ariaSort("estado")} className="px-4 py-3">
                        <Link
                          to="/admin"
                          search={sortLink("estado")}
                          className={`font-extrabold hover:text-white ${focusRing}`}
                        >
                          Estado
                          {query.orden === "estado" ? (query.dir === "asc" ? " ↑" : " ↓") : ""}
                        </Link>
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Responsable
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.filas.map((fila) => (
                      <tr
                        key={fila.id}
                        className="cursor-pointer border-b border-white/5 hover:bg-white/5"
                        onClick={() =>
                          void router.navigate({
                            to: "/admin/cotizaciones/$id",
                            params: { id: String(fila.id) },
                          })
                        }
                      >
                        <td className="px-4 py-3 font-bold text-slate-300">{fila.id}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-200">
                          {formatFechaCo(fila.creado_en)}
                        </td>
                        <td className="px-4 py-3 font-extrabold">
                          <Link
                            to="/admin/cotizaciones/$id"
                            params={{ id: String(fila.id) }}
                            className={`hover:underline ${focusRing}`}
                          >
                            {fila.nombre}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-200">{fila.empresa || "—"}</td>
                        <td className="px-4 py-3 text-slate-200">{fila.servicio || "—"}</td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={fila.estado} />
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          {fila.responsable ?? "Sin asignar"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Celular: tarjetas */}
              <ul className="space-y-3 md:hidden">
                {data.filas.map((fila) => (
                  <li key={fila.id}>
                    <Link
                      to="/admin/cotizaciones/$id"
                      params={{ id: String(fila.id) }}
                      className={`block rounded-2xl border border-white/10 bg-[#10284a]/80 p-4 ${focusRing}`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="min-w-0 font-extrabold">
                          <span className="text-slate-300">#{fila.id} </span>
                          {fila.nombre}
                        </span>
                        <EstadoBadge estado={fila.estado} />
                      </span>
                      <span className="mt-1 block text-sm text-slate-200">
                        {[fila.empresa, fila.servicio].filter(Boolean).join(" · ") || "—"}
                      </span>
                      <span className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-300">
                        <span>{formatFechaCo(fila.creado_en)}</span>
                        <span>{fila.responsable ?? "Sin asignar"}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <Paginacion
                page={query.page}
                total={data.total}
                prev={link({ page: query.page - 1 })}
                next={link({ page: query.page + 1 })}
              />
            </>
          )}
        </>
      )}
    </PanelShell>
  );
}

function Paginacion({
  page,
  total,
  prev,
  next,
}: {
  page: number;
  total: number;
  prev: ListSearch;
  next: ListSearch;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const disabled = "pointer-events-none opacity-40";
  return (
    <nav
      aria-label="Paginación"
      className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-slate-300">
        {total > 0 && from <= total ? `${from}–${to} de ${total}` : `${total} resultados`} · Página{" "}
        {page} de {pages}
      </p>
      <div className="flex gap-2">
        <Link
          to="/admin"
          search={prev}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20 ${page <= 1 ? disabled : ""}`}
        >
          Anterior
        </Link>
        <Link
          to="/admin"
          search={next}
          aria-disabled={page >= pages}
          tabIndex={page >= pages ? -1 : undefined}
          className={`${buttonClass} border border-white/30 bg-white/10 hover:bg-white/20 ${page >= pages ? disabled : ""}`}
        >
          Siguiente
        </Link>
      </div>
    </nav>
  );
}
