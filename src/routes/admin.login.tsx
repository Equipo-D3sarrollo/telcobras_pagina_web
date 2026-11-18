import { useRef, useState, type FormEvent } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { ResponsivePicture } from "@/components/ResponsivePicture";
import { getAdminSession } from "@/lib/admin-session.server";
import { LOGO_IMAGE } from "@/lib/telcobras-data";

const GENERIC_ERROR = "Correo o contraseña incorrectos";

export const Route = createFileRoute("/admin/login")({
  // Con sesión vigente (verificada en el servidor) no se muestra el formulario.
  beforeLoad: async () => {
    if (await getAdminSession()) throw redirect({ to: "/admin" });
  },
  head: () => ({
    meta: [
      { title: "Acceso al panel | TELCOBRAS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });
      if (response.ok) {
        // Carga completa: la página siguiente se renderiza en el servidor con la cookie nueva.
        window.location.assign("/admin");
        return;
      }
      setError(
        response.status === 429
          ? "Demasiados intentos. Espera unos minutos e inténtalo de nuevo."
          : response.status === 503
            ? "El servicio no está disponible por ahora. Inténtalo más tarde."
            : GENERIC_ERROR,
      );
    } catch {
      setError("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    }
    setPassword("");
    setIsSubmitting(false);
    passwordRef.current?.focus();
  }

  const fieldClass =
    "w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-base text-white placeholder:text-slate-300 outline-none transition focus:border-[#88BD4C] focus:ring-2 focus:ring-[#88BD4C]/40";

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#0A192F] px-4 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgb(0 135 195 / 28%), transparent 45%), radial-gradient(circle at 85% 80%, rgb(136 189 76 / 20%), transparent 45%)",
        }}
      />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#10284a]/90 p-7 text-white shadow-2xl shadow-black/40 sm:p-9">
        <div className="mx-auto mb-6 w-fit rounded-2xl bg-[#ffffff] px-4 py-2.5">
          <ResponsivePicture
            image={LOGO_IMAGE}
            sizes="151px"
            width={480}
            height={153}
            alt="TELCOBRAS"
            className="h-12 w-auto"
          />
        </div>
        <h1 className="text-center text-2xl font-black tracking-tight">Panel de cotizaciones</h1>
        <p className="mt-1 text-center text-sm text-slate-300">
          Acceso solo para personal autorizado
        </p>

        <form method="post" noValidate onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label htmlFor="admin-correo" className="mb-1.5 block text-sm font-bold text-slate-200">
              Correo
            </label>
            <input
              id="admin-correo"
              name="correo"
              type="email"
              autoComplete="username"
              required
              value={correo}
              onChange={(event) => setCorreo(event.currentTarget.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "admin-login-error" : undefined}
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-bold text-slate-200"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="admin-password"
                name="password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "admin-login-error" : undefined}
                className={`${fieldClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-slate-200 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Eye aria-hidden="true" className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div aria-live="assertive">
            {error && (
              <p
                id="admin-login-error"
                role="alert"
                className="rounded-xl border border-red-300/50 bg-red-500/15 px-4 py-3 text-sm font-bold text-red-100"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#0087C3] to-[#478a1f] px-6 py-3 text-base font-extrabold text-white shadow-lg transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
