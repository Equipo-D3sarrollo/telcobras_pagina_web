import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PanelShell, focusRing } from "@/components/admin/PanelShell";
import { PANEL_HEAD, requirePanelSession } from "@/lib/admin-guard";
import { LIMITS } from "@/lib/contacto-validation";

export const Route = createFileRoute("/admin/cotizaciones/nueva")({
  beforeLoad: requirePanelSession,
  head: () => PANEL_HEAD("Nueva solicitud"),
  component: NuevaPage,
});

const field = `w-full rounded-xl border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-slate-300 ${focusRing}`;
const label = "mb-1 block text-xs font-bold text-slate-200";
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NuevaPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    empresa: "",
    cargo: "",
    correo: "",
    telefono: "",
    servicio: "",
    mensaje: "",
  });
  const [consentimiento, setConsentimiento] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const set = (name: keyof typeof form) => (e: { currentTarget: { value: string } }) => {
    // El valor se lee ya: dentro de la función de setForm, React habría limpiado currentTarget.
    const { value } = e.currentTarget;
    setForm((current) => ({ ...current, [name]: value }));
  };

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    setError("");
    if (!form.nombre.trim() || !CORREO_REGEX.test(form.correo.trim()) || !form.telefono.trim()) {
      setError("Escribe el nombre, un correo válido y el teléfono del cliente.");
      return;
    }
    if (!consentimiento) {
      setError("Debes confirmar que el cliente autorizó el tratamiento de sus datos personales.");
      return;
    }
    setEnviando(true);
    try {
      const response = await fetch("/api/admin/cotizaciones/nueva", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, consentimiento: true, idioma: "es" }),
      });
      if (response.ok) {
        const { id } = (await response.json()) as { id: number };
        await router.navigate({ to: "/admin/cotizaciones/$id", params: { id: String(id) } });
        return;
      }
      if (response.status === 401) window.location.assign("/admin/login");
      else if (response.status === 400)
        setError("Revisa los datos: alguno no es válido o supera el largo permitido.");
      else if (response.status === 429)
        setError("Demasiadas acciones seguidas. Espera un momento e inténtalo de nuevo.");
      else setError("No se pudo guardar. Inténtalo de nuevo.");
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
    setEnviando(false);
  }

  return (
    <PanelShell user={user}>
      <Link
        to="/admin"
        className={`mb-4 inline-flex min-h-11 items-center text-sm font-bold text-slate-200 hover:text-white ${focusRing}`}
      >
        ← Volver a la lista
      </Link>
      <h1 className="mb-5 text-2xl font-black tracking-tight">Nueva solicitud</h1>

      <form
        onSubmit={enviar}
        noValidate
        method="post"
        className="grid max-w-3xl gap-4 rounded-2xl border border-white/10 bg-[#10284a]/80 p-5 sm:grid-cols-2"
      >
        <div>
          <label htmlFor="n-nombre" className={label}>
            Nombre *
          </label>
          <input
            id="n-nombre"
            required
            maxLength={LIMITS.nombre}
            value={form.nombre}
            onChange={set("nombre")}
            className={field}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="n-empresa" className={label}>
            Empresa
          </label>
          <input
            id="n-empresa"
            maxLength={LIMITS.empresa}
            value={form.empresa}
            onChange={set("empresa")}
            className={field}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="n-cargo" className={label}>
            Cargo
          </label>
          <input
            id="n-cargo"
            maxLength={LIMITS.cargo}
            value={form.cargo}
            onChange={set("cargo")}
            className={field}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="n-servicio" className={label}>
            Servicio
          </label>
          <input
            id="n-servicio"
            maxLength={LIMITS.servicio}
            value={form.servicio}
            onChange={set("servicio")}
            className={field}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="n-correo" className={label}>
            Correo *
          </label>
          <input
            id="n-correo"
            type="email"
            required
            maxLength={LIMITS.correo}
            value={form.correo}
            onChange={set("correo")}
            className={field}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="n-telefono" className={label}>
            Teléfono *
          </label>
          <input
            id="n-telefono"
            type="tel"
            required
            maxLength={LIMITS.telefono}
            value={form.telefono}
            onChange={set("telefono")}
            className={field}
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="n-mensaje" className={label}>
            Mensaje
          </label>
          <textarea
            id="n-mensaje"
            rows={5}
            maxLength={LIMITS.mensaje}
            value={form.mensaje}
            onChange={set("mensaje")}
            className={field}
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {form.mensaje.length} / {LIMITS.mensaje}
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm font-bold">
            <input
              type="checkbox"
              required
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.currentTarget.checked)}
              className={`mt-1 h-5 w-5 shrink-0 accent-[#88BD4C] ${focusRing}`}
            />
            <span>El cliente autorizó el tratamiento de sus datos personales (Ley 1581) *</span>
          </label>
        </div>

        <div role="alert" className="sm:col-span-2">
          {error && (
            <p className="rounded-xl border border-red-300/50 bg-red-500/15 px-3 py-2 text-sm font-bold text-red-100">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={enviando}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#0087C3] to-[#478a1f] px-6 text-sm font-extrabold text-white hover:brightness-110 disabled:opacity-60 ${focusRing}`}
          >
            {enviando ? "Guardando…" : "Guardar solicitud"}
          </button>
          <Link
            to="/admin"
            className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-extrabold hover:bg-white/20 ${focusRing}`}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </PanelShell>
  );
}
