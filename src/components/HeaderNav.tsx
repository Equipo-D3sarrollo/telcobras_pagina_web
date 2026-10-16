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
    <header className="sticky top-0 z-50 shadow-[0_8px_30px_-20px_rgba(10,25,47,0.45)]">
      <div className="header-topbar px-4 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-10 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-[11px] sm:text-xs">
          <div className="flex min-w-0 items-center gap-x-5 gap-y-1">
            <span className="hidden items-center gap-2 text-slate-200 sm:flex">
              <MapPin className="header-topbar-icon h-3.5 w-3.5 shrink-0 text-[#88BD4C]" />
              Carrera 83A # 20 - 20, Cali, Colombia
            </span>
            <span className="flex items-center gap-2 text-slate-200">
              <Clock className="header-topbar-icon h-3.5 w-3.5 shrink-0 text-[#F3CB35]" />
              <span className="hidden sm:inline">Soporte Técnico</span> 24/7
              <span className="hidden md:inline">| NOC Especializado</span>
            </span>
          </div>
          <div className="flex items-center gap-3 font-semibold sm:gap-5">
            <a
              href={CONTACT.phoneHref}
              className="flex items-center gap-2 whitespace-nowrap transition-colors hover:text-white"
            >
              <Phone className="header-topbar-icon h-3.5 w-3.5 text-[#2491CC]" />
              {CONTACT.phoneDisplay}
            </a>
            <a
              href={CONTACT.emailHref}
              className="hidden items-center gap-2 whitespace-nowrap transition-colors hover:text-white sm:flex"
            >
              <Mail className="header-topbar-icon h-3.5 w-3.5 text-[#2491CC]" />
              {CONTACT.emailDisplay}
            </a>
          </div>
        </div>
      </div>

      <div className="header-glass">
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
            className="hidden items-center gap-0.5 p-1 xl:flex"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="header-nav-link whitespace-nowrap rounded-lg px-2 py-2.5 text-[14px] font-semibold text-[#0A192F] transition-colors duration-300 hover:text-[#0A5F8F] focus-visible:text-[#0A5F8F] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0A5F8F]"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden shrink-0 pl-1 xl:flex">
            <a
              href="#contacto"
              className="header-cta group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-extrabold text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F]"
            >
              Solicita una cotización
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2.5 text-[#0A192F] transition-colors hover:bg-[#0087C3]/10 hover:text-[#0A5F8F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5F8F] xl:hidden"
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
          className="header-glass-panel absolute inset-x-0 top-full px-4 pb-6 pt-3 shadow-xl shadow-slate-900/10 xl:hidden"
          id="mobile-navigation"
        >
          <nav aria-label="Navegación móvil" className="mx-auto max-w-7xl space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="header-nav-link header-nav-link--block block rounded-xl px-4 py-3.5 text-base font-semibold text-[#0A192F] transition-colors duration-300 hover:text-[#0A5F8F] focus-visible:text-[#0A5F8F] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0A5F8F]"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-3">
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="header-cta group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-extrabold text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F]"
              >
                Solicita una cotización
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
