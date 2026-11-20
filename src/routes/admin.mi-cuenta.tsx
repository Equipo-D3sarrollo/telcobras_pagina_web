import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { PanelShell, focusRing } from "@/components/admin/PanelShell";
import { PANEL_HEAD, requirePasswordChangeSession } from "@/lib/admin-guard";
import { MIN_PASSWORD_LENGTH } from "@/lib/usuarios-admin-shared";

export const Route = createFileRoute("/admin/mi-cuenta")({
  beforeLoad: requirePasswordChangeSession,
  head: () => PANEL_HEAD("Mi cuenta"),
  component: MiCuentaPage,
});

const fieldClass = `w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-base text-white placeholder:text-slate-300 ${focusRing}`;

function MiCuentaPage() {
  const { user } = Route.useRouteContext();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (nueva !== repetir) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/mi-cuenta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actual, nueva }),
      });
      if (response.ok) {
        window.location.assign("/admin");
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(
        body.error === "invalid_credentials"
          ? "La contraseña actual no es correcta."
          : response.status === 429
            ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
            : "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
      );
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
    setNueva("");
    setRepetir("");
    setIsSaving(false);
  }

  return (
    <PanelShell user={user}>
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-black tracking-tight">Mi cuenta</h1>
        {user.debe_cambiar_password === 1 && (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-300/50 bg-amber-300/15 px-4 py-3 text-sm font-bold text-amber-100"
          >
            Tu contraseña es temporal. Cámbiala para acceder al resto del panel.
          </p>
        )}
        <p className="mt-2 text-sm text-slate-300">
          Cambia tu contraseña sin salir del panel. Usa al menos {MIN_PASSWORD_LENGTH} caracteres.
        </p>

        <form
          method="post"
          onSubmit={handleSubmit}
          className="mt-6 space-y-5 rounded-2xl border border-white/10 bg-[#10284a]/80 p-6"
        >
          <div>
            <label
              htmlFor="password-actual"
              className="mb-1.5 block text-sm font-bold text-slate-200"
            >
              Contraseña actual
            </label>
            <input
              id="password-actual"
              name="actual"
              type="password"
              autoComplete="current-password"
              required
              value={actual}
              onChange={(event) => setActual(event.currentTarget.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label
              htmlFor="password-nueva"
              className="mb-1.5 block text-sm font-bold text-slate-200"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="password-nueva"
                name="nueva"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={nueva}
                onChange={(event) => setNueva(event.currentTarget.value)}
                className={`${fieldClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShow((visible) => !visible)}
                aria-label={show ? "Ocultar contraseñas" : "Mostrar contraseñas"}
                aria-pressed={show}
                className={`absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-slate-200 hover:text-white ${focusRing}`}
              >
                {show ? (
                  <EyeOff aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Eye aria-hidden="true" className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="password-repetir"
              className="mb-1.5 block text-sm font-bold text-slate-200"
            >
              Repite la nueva contraseña
            </label>
            <input
              id="password-repetir"
              name="repetir"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={repetir}
              onChange={(event) => setRepetir(event.currentTarget.value)}
              className={fieldClass}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-300/50 bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#0087C3] to-[#478a1f] px-6 text-sm font-extrabold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            {isSaving ? "Guardando…" : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </PanelShell>
  );
}
