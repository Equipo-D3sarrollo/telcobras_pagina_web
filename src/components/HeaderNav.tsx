import { useState } from "react";
import { LOGO_IMAGE, CONTACT } from "@/lib/telcobras-data";
import { ResponsivePicture } from "./ResponsivePicture";
import { MapPin, Clock, Phone, Mail, ArrowRight, Menu, X } from "lucide-react";
import { useTranslations } from "@/lib/accessibility-preferences-context";

export function HeaderNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const translations = useTranslations();
  const t = translations.navigation;

  const navLinks = [
    { href: "#inicio" },
    { href: "#nosotros" },
    { href: "#servicios" },
    { href: "#inteligencia-artificial" },
    { href: "#proyectos" },
    { href: "#por-que" },
    { href: "#ubicacion" },
    { href: "#contacto" },
  ];

  return (
    <header className="sticky top-0 z-50 shadow-[0_8px_30px_-20px_rgba(10,25,47,0.45)]">
      <div className="header-topbar px-4 text-slate-300 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-10 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-[0.6875rem] sm:text-xs">
          <div className="flex min-w-0 items-center gap-x-5 gap-y-1">
            <span className="hidden items-center gap-2 text-slate-200 sm:flex">
              <MapPin className="header-topbar-icon h-3.5 w-3.5 shrink-0 text-[#88BD4C]" />
              {translations.contact.shortAddress}
            </span>
            <span className="flex items-center gap-2 text-slate-200">
              <Clock className="header-topbar-icon h-3.5 w-3.5 shrink-0 text-[#F3CB35]" />
              <span className="hidden sm:inline">{t.support}</span> 24/7
              <span className="hidden md:inline">| {t.noc}</span>
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
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 py-2 sm:min-h-20 sm:px-6 lg:px-8">
          <a href="#inicio" className="flex items-center shrink-0 pr-4">
            <ResponsivePicture
              image={LOGO_IMAGE}
              sizes="151px"
              alt={translations.contact.logoAlt}
              width={151}
              height={48}
              className="h-[40px] w-auto max-w-[40vw] object-contain sm:h-[48px]"
            />
          </a>

          <nav
            aria-label={t.mainLabel}
            className="header-desktop-nav hidden items-center gap-0.5 p-1 lg:flex"
          >
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                className="header-nav-link whitespace-nowrap rounded-lg px-1.5 py-2.5 text-[0.8125rem] xl:px-2 xl:text-[0.875rem] font-semibold text-foreground transition-colors duration-300 hover:text-[var(--brand-link)] focus-visible:text-[var(--brand-link)] focus-visible:outline-2 focus-visible:outline-offset-1"
              >
                {t.links[index]}
              </a>
            ))}
          </nav>

          <div className="header-desktop-cta hidden shrink-0 pl-1 xl:flex">
            <a
              href="#contacto"
              className="header-cta group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-extrabold text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F]"
            >
              {t.quote}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none" />
            </a>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="header-mobile-toggle rounded-xl p-2 text-foreground transition-colors hover:bg-accent hover:text-[var(--brand-link)] focus-visible:outline-2 focus-visible:outline-offset-2 lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="header-mobile-menu header-glass-panel absolute inset-x-0 top-full max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 pb-6 pt-3 shadow-xl shadow-slate-900/10 lg:hidden"
          id="mobile-navigation"
        >
          <nav aria-label={t.mobileLabel} className="mx-auto max-w-7xl space-y-1">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="header-nav-link header-nav-link--block block rounded-xl px-4 py-3.5 text-base font-semibold text-foreground transition-colors duration-300 hover:text-[var(--brand-link)] focus-visible:text-[var(--brand-link)] focus-visible:outline-2 focus-visible:outline-offset-1"
              >
                {t.links[index]}
              </a>
            ))}
            <div className="pt-3">
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="header-cta group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-extrabold text-white hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F]"
              >
                {t.quote}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-focus-visible:translate-x-1 motion-reduce:transform-none" />
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
