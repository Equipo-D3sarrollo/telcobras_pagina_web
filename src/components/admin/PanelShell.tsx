import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { BrandIsotipo } from "../BrandIsotipo";
import { ESTADO_LABEL, type Estado, type Rol } from "@/lib/cotizaciones-admin-shared";

const ROL_LABEL: Record<Rol, string> = { administrador: "Administrador", comercial: "Comercial" };

const BADGE: Record<Estado, string> = {
  nueva: "border-sky-300/50 bg-sky-400/20 text-sky-100",
  en_revision: "border-amber-300/50 bg-amber-300/20 text-amber-100",
  cotizada: "border-indigo-300/50 bg-indigo-400/25 text-indigo-100",
  ganada: "border-emerald-300/50 bg-emerald-400/20 text-emerald-100",
  perdida: "border-rose-300/50 bg-rose-400/20 text-rose-100",
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${BADGE[estado]}`}
    >
      {ESTADO_LABEL[estado]}
    </span>
  );
}

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]";

/** Marco común del panel: encabezado con la marca, la persona, la navegación y «Cerrar sesión». */
export function PanelShell({
  user,
  children,
}: {
  user: { nombre: string; rol: Rol };
  children: ReactNode;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    if (isClosing) return;
    setIsClosing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/logout", { method: "POST" });
      if (response.ok) {
        window.location.assign("/admin/login");
        return;
      }
      setError("No se pudo cerrar la sesión. Inténtalo de nuevo.");
    } catch {
      setError("No se pudo conectar con el servidor. Inténtalo de nuevo.");
    }
    setIsClosing(false);
  }

  return (
    <div className="min-h-screen bg-[#0A192F] text-white">
      <a
        href="#contenido"
        className={`sr-only rounded-lg bg-white px-4 py-2 font-bold text-[#0A192F] focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 ${focusRing}`}
      >
        Saltar al contenido
      </a>
      <header className="border-b border-white/10 bg-[#10284a]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandIsotipo className="h-8 w-[1.2rem]" />
            <span className="text-base font-black tracking-tight">TELCOBRAS · Panel</span>
          </div>

          <nav
            aria-label="Principal"
            className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto"
          >
            <Link
              to="/admin"
              activeOptions={{ exact: false }}
              className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-extrabold text-slate-200 hover:bg-white/10 [&.active]:bg-white/15 [&.active]:text-white ${focusRing}`}
              activeProps={{ "aria-current": "page" }}
            >
              Cotizaciones
            </Link>
            {user.rol === "administrador" && (
              <Link
                to="/admin/usuarios"
                className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-extrabold text-slate-200 hover:bg-white/10 [&.active]:bg-white/15 [&.active]:text-white ${focusRing}`}
                activeProps={{ "aria-current": "page" }}
              >
                Usuarios
              </Link>
            )}
            <Link
              to="/admin/mi-cuenta"
              className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-extrabold text-slate-200 hover:bg-white/10 [&.active]:bg-white/15 [&.active]:text-white ${focusRing}`}
              activeProps={{ "aria-current": "page" }}
            >
              Mi cuenta
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-extrabold">{user.nombre}</p>
              <p className="text-xs text-slate-300">{ROL_LABEL[user.rol]}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isClosing}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-sm font-extrabold hover:bg-white/20 disabled:opacity-60 ${focusRing}`}
            >
              <LogOut aria-hidden="true" className="h-4 w-4" />
              {isClosing ? "Cerrando…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="bg-red-500/20 px-4 py-2 text-center text-sm font-bold text-red-100"
          >
            {error}
          </p>
        )}
      </header>
      <main id="contenido" className="mx-auto max-w-7xl px-4 py-6">
        {children}
      </main>
    </div>
  );
}
