import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { PanelShell, focusRing } from "@/components/admin/PanelShell";
import { listarUsuariosFn } from "@/lib/admin-data.server";
import { PANEL_HEAD, requirePanelSession } from "@/lib/admin-guard";
import { formatFechaCo } from "@/lib/cotizaciones-admin-shared";
import {
  MIN_PASSWORD_LENGTH,
  ROLES,
  ROL_LABEL,
  type Rol,
  type UsuarioLista,
} from "@/lib/usuarios-admin-shared";

export const Route = createFileRoute("/admin/usuarios")({
  beforeLoad: requirePanelSession,
  loader: async () => {
    const result = await listarUsuariosFn();
    if (!result.ok && result.error === "unauthorized") throw redirect({ to: "/admin/login" });
    if (!result.ok && result.error === "forbidden") throw redirect({ to: "/admin" });
    return result;
  },
  head: () => PANEL_HEAD("Usuarios"),
  component: UsuariosPage,
});

const inputClass = `w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300 ${focusRing}`;
const buttonClass = `inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-extrabold ${focusRing}`;

type Feedback = { tono: "ok" | "error"; texto: string } | null;
type ApiResponse = { error?: string; status?: string; passwordTemporal?: string };

async function postJson(url: string, body: unknown): Promise<{ ok: boolean; data: ApiResponse }> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as ApiResponse;
  return { ok: response.ok, data };
}

function UsuariosPage() {
  const { user } = Route.useRouteContext();
  const data = Route.useLoaderData();
  const router = useRouter();

  const [feedback, setFeedback] = useState<Feedback>(null);
  const [temporal, setTemporal] = useState("");
  const [busy, setBusy] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<Rol>("comercial");
  const [password, setPassword] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [edicion, setEdicion] = useState({ nombre: "", correo: "", rol: "comercial" as Rol });

  if (user.rol !== "administrador") return null;

  function aviso(tono: "ok" | "error", texto: string) {
    setFeedback({ tono, texto });
  }

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const result = await postJson("/api/admin/usuarios", { nombre, correo, rol, password });
      if (!result.ok) {
        aviso(
          "error",
          result.data.error === "conflict"
            ? "Ya existe una cuenta con ese correo."
            : "No se pudo crear la cuenta.",
        );
        return;
      }
      setNombre("");
      setCorreo("");
      setRol("comercial");
      setPassword("");
      aviso("ok", "Cuenta creada. La persona deberá cambiar la contraseña al entrar.");
      void router.invalidate();
    } catch {
      aviso("error", "No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  async function ejecutar(usuario: UsuarioLista, accion: string, extra?: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    setTemporal("");
    try {
      const result = await postJson(`/api/admin/usuarios/${usuario.id}`, { accion, ...extra });
      if (!result.ok) {
        aviso(
          "error",
          result.data.error === "conflict"
            ? "Ya existe otra cuenta con ese correo."
            : "No se pudo completar la acción.",
        );
        return;
      }
      if (typeof result.data.passwordTemporal === "string") {
        setTemporal(result.data.passwordTemporal);
        aviso("ok", "Contraseña reiniciada. Cópiala ahora: no se volverá a mostrar.");
      } else {
        aviso("ok", "Cambio guardado.");
      }
      setEditandoId(null);
      void router.invalidate();
    } catch {
      aviso("error", "No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  function empezarEdicion(usuario: UsuarioLista) {
    setEditandoId(usuario.id);
    setEdicion({ nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol });
    setFeedback(null);
  }

  return (
    <PanelShell user={user}>
      <h1 className="text-2xl font-black tracking-tight">Usuarios</h1>
      <p className="mt-1 text-sm text-slate-300">Cuentas con acceso al panel de cotizaciones.</p>

      {feedback && (
        <p
          role={feedback.tono === "error" ? "alert" : "status"}
          className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${feedback.tono === "error" ? "border-red-300/50 bg-red-500/15 text-red-100" : "border-[#88BD4C]/50 bg-[#88BD4C]/15 text-emerald-100"}`}
        >
          {feedback.texto}
        </p>
      )}
      {temporal && (
        <p className="mt-3 rounded-xl border border-amber-300/50 bg-amber-300/15 px-4 py-3 text-sm font-bold text-amber-100">
          Contraseña temporal: <code className="select-all break-all">{temporal}</code>
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <form
          onSubmit={crear}
          aria-label="Crear usuario"
          className="h-fit space-y-4 rounded-2xl border border-white/10 bg-[#10284a]/80 p-5"
        >
          <h2 className="text-lg font-black">Nueva cuenta</h2>
          <div>
            <label htmlFor="u-nombre" className="mb-1 block text-xs font-bold text-slate-200">
              Nombre
            </label>
            <input
              id="u-nombre"
              name="nombre"
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.currentTarget.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="u-correo" className="mb-1 block text-xs font-bold text-slate-200">
              Correo
            </label>
            <input
              id="u-correo"
              name="correo"
              type="email"
              required
              maxLength={200}
              value={correo}
              onChange={(e) => setCorreo(e.currentTarget.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="u-rol" className="mb-1 block text-xs font-bold text-slate-200">
              Rol
            </label>
            <select
              id="u-rol"
              name="rol"
              value={rol}
              onChange={(e) => setRol(e.currentTarget.value as Rol)}
              className={inputClass}
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {ROL_LABEL[item]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="u-password" className="mb-1 block text-xs font-bold text-slate-200">
              Contraseña temporal
            </label>
            <input
              id="u-password"
              name="password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-300">
              Mínimo {MIN_PASSWORD_LENGTH} caracteres. La persona tendrá que cambiarla.
            </p>
          </div>
          <button
            type="submit"
            disabled={busy}
            className={`${buttonClass} w-full bg-[#006BA4] text-white hover:bg-[#005888] disabled:opacity-60`}
          >
            {busy ? "Guardando…" : "Crear cuenta"}
          </button>
        </form>

        {!data.ok ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-300/40 bg-red-500/15 p-6 text-center"
          >
            <p className="font-bold text-red-100">No se pudieron cargar las cuentas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#10284a]/80">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Cuentas del panel</caption>
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Nombre
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Correo
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Rol
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Último acceso
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-white/5 align-top">
                    <td className="px-4 py-3 font-extrabold">
                      {editandoId === usuario.id ? (
                        <input
                          aria-label="Nombre"
                          value={edicion.nombre}
                          maxLength={100}
                          onChange={(e) =>
                            setEdicion({ ...edicion, nombre: e.currentTarget.value })
                          }
                          className={inputClass}
                        />
                      ) : (
                        usuario.nombre
                      )}
                      {usuario.debeCambiarPassword && (
                        <span className="mt-1 block text-xs font-bold text-amber-200">
                          Contraseña temporal
                        </span>
                      )}
                      {usuario.bloqueadoHasta && (
                        <span className="mt-1 block text-xs font-bold text-rose-200">
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {editandoId === usuario.id ? (
                        <input
                          aria-label="Correo"
                          type="email"
                          value={edicion.correo}
                          maxLength={200}
                          onChange={(e) =>
                            setEdicion({ ...edicion, correo: e.currentTarget.value })
                          }
                          className={inputClass}
                        />
                      ) : (
                        usuario.correo
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {editandoId === usuario.id ? (
                        <select
                          aria-label="Rol"
                          value={edicion.rol}
                          onChange={(e) =>
                            setEdicion({ ...edicion, rol: e.currentTarget.value as Rol })
                          }
                          className={inputClass}
                        >
                          {ROLES.map((item) => (
                            <option key={item} value={item}>
                              {ROL_LABEL[item]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        ROL_LABEL[usuario.rol]
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      <span
                        className={
                          usuario.activo ? "font-bold text-emerald-200" : "font-bold text-rose-200"
                        }
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </span>
                      {usuario.ultimoAcceso && (
                        <span className="mt-1 block text-xs text-slate-300">
                          {formatFechaCo(usuario.ultimoAcceso)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300">
                      {usuario.bloqueadoHasta ? formatFechaCo(usuario.bloqueadoHasta) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {editandoId === usuario.id ? (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void ejecutar(usuario, "editar", edicion)}
                              className={`${buttonClass} bg-[#006BA4] text-white disabled:opacity-60`}
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditandoId(null)}
                              className={`${buttonClass} border border-white/30 bg-white/10`}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => empezarEdicion(usuario)}
                              className={`${buttonClass} border border-white/30 bg-white/10 disabled:opacity-60`}
                            >
                              Editar
                            </button>
                            {usuario.bloqueadoHasta && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void ejecutar(usuario, "desbloquear")}
                                className={`${buttonClass} border border-amber-300/40 bg-amber-300/15 text-amber-100 disabled:opacity-60`}
                              >
                                Desbloquear
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void ejecutar(usuario, "reiniciar_password")}
                              className={`${buttonClass} border border-sky-300/40 bg-sky-400/15 text-sky-100 disabled:opacity-60`}
                            >
                              Reiniciar contraseña
                            </button>
                            {usuario.id !== user.id && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void ejecutar(usuario, usuario.activo ? "desactivar" : "activar")
                                }
                                className={`${buttonClass} border ${usuario.activo ? "border-rose-300/40 bg-rose-400/15 text-rose-100" : "border-emerald-300/40 bg-emerald-400/15 text-emerald-100"} disabled:opacity-60`}
                              >
                                {usuario.activo ? "Desactivar" : "Activar"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PanelShell>
  );
}
