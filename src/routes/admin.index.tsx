import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { getAdminSession } from "@/lib/admin-session.server";

const ROL_LABEL = { administrador: "Administrador", comercial: "Comercial" } as const;

export const Route = createFileRoute("/admin/")({
  // La sesión se verifica en el servidor (SSR y navegación del cliente); sin sesión válida
  // se redirige al login antes de renderizar nada del panel.
  beforeLoad: async () => {
    const user = await getAdminSession();
    if (!user) throw redirect({ to: "/admin/login" });
    return { user };
  },
  head: () => ({
    meta: [
      { title: "Panel de cotizaciones | TELCOBRAS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminHomePage,
});

function AdminHomePage() {
  const { user } = Route.useRouteContext();
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
    <main className="flex min-h-screen items-center justify-center bg-[#0A192F] px-4 py-12 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#10284a]/90 p-8 text-center shadow-2xl shadow-black/40">
        <h1 className="text-3xl font-black tracking-tight">Hola, {user.nombre}</h1>
        <p className="mt-2 text-base text-slate-200">Rol: {ROL_LABEL[user.rol]}</p>
        <p className="mt-6 text-sm text-slate-300">
          La lista de cotizaciones estará disponible próximamente.
        </p>
        {error && (
          <p role="alert" className="mt-4 text-sm font-bold text-red-200">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isClosing}
          className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {isClosing ? "Cerrando…" : "Cerrar sesión"}
        </button>
      </div>
    </main>
  );
}
