import { useState } from "react";
import { SERVICIOS_DATA } from "@/lib/telcobras-data";
import { Wifi, ShieldCheck, Users, Cloud, Bot, CheckCircle2, ArrowRight, Zap } from "lucide-react";

const ICONS_MAP = {
  conectividad: Wifi,
  seguridad: ShieldCheck,
  colaboracion: Users,
  nube: Cloud,
  "agentes-ia": Bot,
};

export function ServicesSection() {
  const [activeTab, setActiveTab] = useState(0);
  const currentService = SERVICIOS_DATA[activeTab];
  const CurrentIcon = ICONS_MAP[currentService.id as keyof typeof ICONS_MAP] || Wifi;

  return (
    <section id="servicios" className="py-20 md:py-28 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-sky-100 text-[#0087C3] text-xs font-extrabold uppercase tracking-wider">
            Portafolio de Servicios
          </span>
          <h2 className="bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35] bg-clip-text text-3xl sm:text-4xl md:text-5xl font-black text-transparent tracking-tight">
            Soluciones integradas para la continuidad de tu negocio
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Combinamos infraestructura de última generación, plataformas digitales seguras e
            Inteligencia Artificial.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {SERVICIOS_DATA.map((s, idx) => {
            const TabIcon = ICONS_MAP[s.id as keyof typeof ICONS_MAP] || Wifi;
            const isActive = activeTab === idx;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-300 border ${
                  isActive
                    ? "bg-[#0A192F] text-white border-[#0A192F] shadow-lg scale-105"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <TabIcon className={`w-4 h-4 ${isActive ? "text-[#88BD4C]" : "text-[#0087C3]"}`} />
                {s.title.split(" ")[0]}
              </button>
            );
          })}
        </div>

        {/* Big Detail Card */}
        <div className="bg-gradient-to-br from-slate-900 via-[#0A192F] to-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-slate-800">
          {["conectividad", "seguridad", "agentes-ia"].includes(currentService.id) && (
            <>
              <video
                aria-hidden="true"
                autoPlay
                className="absolute inset-0 h-full w-full object-cover"
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
                        : "/video_agentes.mp4"
                  }
                  type="video/mp4"
                />
              </video>
              <div aria-hidden="true" className="absolute inset-0 bg-slate-950/75" />
            </>
          )}
          <div
            className="absolute top-0 right-0 z-[1] w-52 h-52 opacity-20 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: currentService.color }}
          />

          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-[2]">
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center gap-3">
                <div
                  className="p-3.5 rounded-2xl text-white shadow-md"
                  style={{ backgroundColor: currentService.color }}
                >
                  <CurrentIcon className="w-8 h-8" />
                </div>
                <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-slate-300 border border-white/10">
                  {currentService.badge}
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
                {currentService.title}
              </h3>

              <p className="text-[#88BD4C] font-extrabold text-base sm:text-lg">
                {currentService.tagline}
              </p>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {currentService.description}
              </p>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Capacidades y características:
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {currentService.features.map((feat) => (
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
                  Cotizar {currentService.title.split(" ")[0]} para tu empresa
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#F3CB35]" /> Valor diferencial
                </h4>

                <div className="space-y-3 text-xs sm:text-sm text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    <strong className="text-white block">Alta Disponibilidad:</strong>{" "}
                    Disponibilidad de red del 99,6 %.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    <strong className="text-white block">Soporte Continuo:</strong> Atención 24/7
                    con ingeniería especializada.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50">
                    <strong className="text-white block">Instalación en 15 Días:</strong> Agilidad
                    de implementación para no retrasar tu operación.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Cards Overview Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {SERVICIOS_DATA.map((serv, index) => {
            const CardIcon = ICONS_MAP[serv.id as keyof typeof ICONS_MAP] || Wifi;
            return (
              <div
                key={serv.id}
                onClick={() => setActiveTab(index)}
                className={`cursor-pointer p-6 rounded-3xl border transition-all duration-300 ${
                  activeTab === index
                    ? "bg-white border-[#0087C3] shadow-xl ring-2 ring-[#0087C3]/30 transform -translate-y-1"
                    : "bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300 shadow-xs"
                }`}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold mb-4"
                  style={{ backgroundColor: serv.color }}
                >
                  <CardIcon className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 mb-2">{serv.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-3 mb-4">{serv.tagline}</p>
                <span className="text-xs font-bold text-[#0087C3] flex items-center gap-1 group">
                  Ver detalles{" "}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
