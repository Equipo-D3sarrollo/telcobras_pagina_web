import { Sparkles, ArrowRight } from "lucide-react";
import { ProjectsSection } from "./ProjectsSection";
import { WhyUsSection } from "./WhyUsSection";

export function LetyIaAndWhyUs() {
  return (
    <>
      {/* 6. INTELIGENCIA ARTIFICIAL INTEGRADA */}
      <section
        id="inteligencia-artificial"
        className="py-20 md:py-28 bg-[#0A192F] text-white relative isolate overflow-hidden"
      >
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 z-0 h-full w-full object-cover"
          loop
          muted
          playsInline
          tabIndex={-1}
        >
          <source src="/video_inicio.mp4" type="video/mp4" />
        </video>
        <div aria-hidden="true" className="absolute inset-0 z-[1] bg-slate-950/55" />
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-[#0087C3]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#88BD4C]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(#0087c3_1px,transparent_1px)] [background-size:26px_26px] opacity-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0087C3]/30 to-[#88BD4C]/30 border border-sky-400/30 text-xs font-extrabold text-sky-300">
              <Sparkles className="w-4 h-4 text-[#88BD4C]" /> Inteligencia Artificial
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
              Inteligencia Artificial integrada a tus procesos
            </h2>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Integramos tecnología, conectividad e Inteligencia Artificial para ayudar a las
              empresas a optimizar sus procesos, mejorar la atención y potenciar sus resultados.
              Diseñamos soluciones adaptadas a las necesidades de cada organización, desde la
              automatización y la telemetría hasta la atención inteligente de clientes.
            </p>

            <div className="pt-2">
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-extrabold text-slate-900 bg-[#88BD4C] hover:bg-[#78a841] shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
              >
                Conversemos sobre tu proyecto
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6b. PROYECTOS */}
      <ProjectsSection />

      {/* 7. ¿POR QUÉ TELCOBRAS? */}
      <WhyUsSection />

      {/* 8. ALIADOS */}
      <section className="py-16 border-y border-slate-200 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide text-slate-900 mb-8">
            Alianzas y Ecosistema Tecnológico
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            <div className="flex h-32 w-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <img
                alt="Xpertic"
                className="ally-logo-rotation max-h-full max-w-full object-contain"
                src="/logo_xpertic.png"
              />
            </div>

            <div className="flex h-32 w-64 items-center justify-center rounded-2xl border border-[#0087C3]/40 bg-[#0A192F] p-4 shadow-sm">
              <img
                alt="Aquora"
                className="ally-logo-rotation ally-logo-rotation-delayed max-h-full max-w-full object-contain"
                src="/logo_aquora.png"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
