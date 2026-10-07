import { useState } from "react";
import { LOGO_URL, CONTACT } from "@/lib/telcobras-data";
import { MapPin, Clock, Phone, Mail, ArrowRight, Menu, X } from "lucide-react";

export function HeaderNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Inicio", href: "#inicio" },
    { name: "Quiénes Somos", href: "#nosotros" },
    { name: "Servicios", href: "#servicios" },
    { name: "Inteligencia Artificial", href: "#inteligencia-artificial" },
    { name: "Proyectos", href: "#proyectos" },
    { name: "¿Por qué TELCOBRAS?", href: "#por-que" },
    { name: "Ubicación", href: "#ubicacion" },
    { name: "Contacto", href: "#contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_8px_30px_-20px_rgba(10,25,47,0.45)] backdrop-blur-xl">
      <div className="bg-[#0A192F] px-4 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-10 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-[11px] sm:text-xs">
          <div className="flex min-w-0 items-center gap-x-5 gap-y-1">
            <span className="hidden items-center gap-2 text-slate-200 sm:flex">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#88BD4C]" />
              Carrera 83A # 20 - 20, Cali, Colombia
            </span>
            <span className="flex items-center gap-2 text-slate-200">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#F3CB35]" />
              <span className="hidden sm:inline">Soporte Técnico</span> 24/7
              <span className="hidden md:inline">| NOC Especializado</span>
            </span>
          </div>
          <div className="flex items-center gap-3 font-semibold sm:gap-5">
            <a
              href={CONTACT.phoneHref}
              className="flex items-center gap-2 whitespace-nowrap transition-colors hover:text-white"
            >
              <Phone className="h-3.5 w-3.5 text-[#2491CC]" />
              {CONTACT.phoneDisplay}
            </a>
            <a
              href={CONTACT.emailHref}
              className="hidden items-center gap-2 whitespace-nowrap transition-colors hover:text-white sm:flex"
            >
              <Mail className="h-3.5 w-3.5 text-[#2491CC]" />
              {CONTACT.emailDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex items-center shrink-0 pr-4">
            <img
              src={LOGO_URL}
              alt="TELCOBRAS S.A.S. Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </a>

          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-1 bg-white p-1 xl:flex"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="whitespace-nowrap rounded-xl px-2.5 py-2 text-[11px] font-black text-black transition-all hover:bg-[#88BD4C] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0A192F] xl:px-2.5 2xl:px-3 2xl:text-xs"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 pl-1 xl:flex">
            <a
              href="#contacto"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#2491CC] px-4 py-2.5 text-sm font-extrabold text-white shadow-md shadow-[#2491CC]/25 transition-all hover:-translate-y-0.5 hover:bg-[#42A9DC] hover:text-white hover:shadow-lg"
            >
              Solicita una cotización
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2.5 text-black transition-colors hover:bg-[#88BD4C] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F] xl:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="absolute inset-x-0 top-full bg-white px-4 pb-6 pt-3 shadow-xl shadow-slate-900/10 xl:hidden"
          id="mobile-navigation"
        >
          <nav aria-label="Navegación móvil" className="mx-auto max-w-7xl space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-xl px-4 py-3.5 text-base font-extrabold text-black transition-colors hover:bg-[#88BD4C] hover:text-white"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-3">
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2491CC] px-5 py-3.5 text-base font-extrabold text-white shadow-md shadow-[#2491CC]/25 transition-colors hover:bg-[#42A9DC] hover:text-white"
              >
                Solicita una cotización
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
