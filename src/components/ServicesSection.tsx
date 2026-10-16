import { useEffect, useState } from "react";
import { SERVICIOS_DATA } from "@/lib/telcobras-data";
import type { CSSProperties } from "react";
import { Wifi, ShieldCheck, Users, Cloud, Bot, CheckCircle2, Zap } from "lucide-react";
import { BrandGlowBorder } from "@/components/BrandGlowBorder";
import { useTranslations } from "@/lib/accessibility-preferences-context";

const ICONS_MAP = {
  conectividad: Wifi,
  seguridad: ShieldCheck,
  colaboracion: Users,
  nube: Cloud,
  "agentes-ia": Bot,
};

/* Acento visual por servicio (solo decoración; no reemplaza SERVICIOS_DATA). */
const SERVICE_COLORS: Record<string, string> = {
  conectividad: "#0087C3",
  seguridad: "#88BD4C",
  colaboracion: "#F3CB35",
  nube: "#1a6f9c",
  "agentes-ia": "#6A9D32",
};

const serviceColorStyle = (id: string) =>
  ({ "--service-color": SERVICE_COLORS[id] ?? "#0087C3" }) as CSSProperties;

export function ServicesSection() {
  const t = useTranslations().services;
  const [activeTab, setActiveTab] = useState(0);
  const currentService = SERVICIOS_DATA[activeTab];
  if (!currentService) {
    throw new Error("SERVICIOS_DATA must contain a service for the active tab.");
  }
  const CurrentIcon = ICONS_MAP[currentService.id as keyof typeof ICONS_MAP] || Wifi;
  const translatedService = t.cards[currentService.id as keyof typeof t.cards];

  useEffect(() => {
    const rotationInterval = window.setInterval(() => {
      setActiveTab((currentTab) => (currentTab + 1) % SERVICIOS_DATA.length);
    }, 30_000);

    return () => window.clearInterval(rotationInterval);
  }, []);

  return (
    <section id="servicios" className="py-20 md:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-sky-100 text-[#0087C3] text-xs font-extrabold uppercase tracking-wider">
            {t.badge}
          </span>
          <h2 className="bg-gradient-to-r from-[var(--brand-gradient-blue)] via-[var(--brand-gradient-green)] to-[var(--brand-gradient-yellow)] bg-clip-text text-3xl sm:text-4xl md:text-5xl font-black text-transparent tracking-tight">
            {t.title}
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">{t.description}</p>
        </div>

        {/* Tab Buttons */}
        <div className="services-tabs mx-auto mb-10 max-w-4xl snap-x snap-mandatory overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/60 p-1.5 shadow-[0_10px_30px_-18px_rgba(10,25,47,0.35)] backdrop-blur-md">
          <div className="relative grid min-w-[36rem] grid-cols-5 md:min-w-0">
            <span
              aria-hidden="true"
              className="services-tab-indicator"
              style={{ transform: `translateX(${activeTab * 100}%)` }}
            />
            {SERVICIOS_DATA.map((s, idx) => {
              const TabIcon = ICONS_MAP[s.id as keyof typeof ICONS_MAP] || Wifi;
              const translated = t.cards[s.id as keyof typeof t.cards];
              const isActive = activeTab === idx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  aria-pressed={isActive}
                  aria-controls="servicios-panel"
                  style={serviceColorStyle(s.id)}
                  className={`services-tab relative z-[1] flex snap-start items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-extrabold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F] sm:text-sm ${
                    isActive
                      ? "text-white"
                      : "text-slate-700 hover:bg-white/70 hover:text-[#0A192F]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`text-[0.625rem] font-bold tabular-nums transition-colors duration-300 ${
                      isActive ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <TabIcon
                    aria-hidden="true"
                    className="services-tab-icon h-4 w-4 shrink-0 text-[var(--service-color)]"
                  />
                  {translated.title.split(" ")[0]}
                  {isActive && (
                    <CheckCircle2 aria-hidden="true" className="services-tab-selected h-4 w-4" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Detail Card */}
        <div
          id="servicios-panel"
          style={serviceColorStyle(currentService.id)}
          className="services-panel brand-glow-always bg-gradient-to-br from-slate-900 via-[#0A192F] to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-slate-800"
        >
          {["conectividad", "seguridad", "colaboracion", "nube", "agentes-ia"].includes(
            currentService.id,
          ) && (
            <>
              <video
                aria-hidden="true"
                autoPlay
                className="services-panel-video absolute inset-0 h-full w-full object-cover"
                key={currentService.id}
                loop
                muted
                playsInline
                tabIndex={-1}
              >
                <source
                  src={
                    currentService.id === "conectividad"
                      ? "/video_conectividad.mp4"
                      : currentService.id === "seguridad"
                        ? "/video_seguridad.mp4"
                        : currentService.id === "colaboracion"
                          ? "/video_colaboracion.mp4"
                          : currentService.id === "nube"
                            ? "/video_nuve.mp4"
                            : "/video_agentes.mp4"
                  }
                  type="video/mp4"
                />
              </video>
              <div aria-hidden="true" className="absolute inset-0 bg-slate-950/75" />
            </>
          )}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 z-[1] w-52 h-52 opacity-20 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: SERVICE_COLORS[currentService.id] ?? currentService.color }}
          />

          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-[2]">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div
                  className="p-3.5 rounded-2xl text-white shadow-md"
                  style={{
                    backgroundColor: SERVICE_COLORS[currentService.id] ?? currentService.color,
                  }}
                >
                  <CurrentIcon className="w-8 h-8" />
                </div>
                <span className="services-accent-chip px-3 py-1 rounded-full text-xs font-bold text-slate-200 border">
                  {translatedService.badge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                {translatedService.title}
              </h3>
              <span
                aria-hidden="true"
                className="services-accent-line -mt-3 block h-1 w-16 rounded-full"
              />

              <p className="text-[#88BD4C] font-extrabold text-base sm:text-lg">
                {translatedService.tagline}
              </p>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {translatedService.description}
              </p>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  {t.capabilities}
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {translatedService.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#88BD4C] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4">
                <a
                  href="#contacto"
                  className="px-6 py-3 rounded-full text-xs font-extrabold text-slate-900 bg-[#F3CB35] hover:bg-[#e2bb2d] shadow-md transition-all"
                >
                  {t.quoteService.replace(
                    "{service}",
                    translatedService.title.split(/\s+/, 1).join(""),
                  )}
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="services-accent-border p-6 rounded-2xl bg-white/5 backdrop-blur-md border space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#F3CB35]" /> {t.differentiator}
                </h4>

                <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    <strong className="text-white block">{t.availabilityTitle}</strong>{" "}
                    {t.availabilityDescription}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    <strong className="text-white block">{t.supportTitle}</strong>{" "}
                    {t.supportDescription}
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    <strong className="text-white block">{t.installationTitle}</strong>{" "}
                    {t.installationDescription}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <BrandGlowBorder light={false} />
        </div>

        {/* 5 Cards Overview Grid */}
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <defs>
            <linearGradient
              id="servicios-icon-gradient"
              gradientUnits="userSpaceOnUse"
              x1="2"
              y1="2"
              x2="22"
              y2="22"
            >
              <stop offset="0%" stopColor="#0087C3" />
              <stop offset="55%" stopColor="#88BD4C" />
              <stop offset="100%" stopColor="#F3CB35" />
            </linearGradient>
          </defs>
        </svg>
        <div className="services-card-grid mt-12 grid grid-cols-2 gap-4 md:grid-cols-6 lg:grid-cols-5">
          {SERVICIOS_DATA.map((serv, index) => {
            const CardIcon = ICONS_MAP[serv.id as keyof typeof ICONS_MAP] || Wifi;
            const isActive = activeTab === index;
            return (
              <button
                key={serv.id}
                type="button"
                onClick={() => setActiveTab(index)}
                aria-pressed={isActive}
                aria-controls="servicios-panel"
                data-active={isActive ? "true" : undefined}
                style={serviceColorStyle(serv.id)}
                className={`services-card brand-glow-hover relative flex cursor-pointer flex-col rounded-2xl border p-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0A192F] ${
                  index < 3 ? "md:col-span-2" : "md:col-span-3"
                } ${index === 4 ? "col-span-2" : ""} lg:col-span-1`}
              >
                <span aria-hidden="true" className="services-card-signal" />
                <span className="mb-4 flex items-start justify-between">
                  <span className="services-card-frame flex h-12 w-12 items-center justify-center rounded-xl border">
                    <CardIcon
                      aria-hidden="true"
                      color="url(#servicios-icon-gradient)"
                      className="services-card-icon h-6 w-6"
                    />
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-[0.6875rem] font-bold tabular-nums text-slate-500"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="mb-1.5 block text-sm font-extrabold text-[#0A192F]">
                  {t.cards[serv.id as keyof typeof t.cards].title}
                </span>
                <span className="services-card-tagline mb-4 block text-xs text-slate-600 line-clamp-2">
                  {t.cards[serv.id as keyof typeof t.cards].tagline}
                </span>
                <span className="mt-auto flex items-center gap-2 text-[0.6875rem] font-bold text-[#0A192F]">
                  {isActive && (
                    <>
                      <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                      {t.active}
                    </>
                  )}
                </span>
                <BrandGlowBorder light={false} />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
