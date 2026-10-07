import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Award,
  CheckCircle2,
  TrendingUp,
  Headphones,
  RadioTower,
} from "lucide-react";
import { CALI_PHOTO, HERO_PHOTO, TECHNICIAN_PHOTO } from "@/lib/telcobras-data";

const HERO_SLIDES = [HERO_PHOTO, TECHNICIAN_PHOTO, CALI_PHOTO];

export function HeroAndMetrics() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((currentSlide) => (currentSlide + 1) % HERO_SLIDES.length);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <>
      {/* 2. HERO SECTION */}
      <section
        id="inicio"
        className="telcobras-rounded-font relative isolate overflow-hidden bg-[#0A192F] text-white pt-12 pb-20 md:pt-20 md:pb-32"
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold tracking-wide text-sky-200">
                <span className="w-2 h-2 rounded-full bg-[#88BD4C] animate-pulse" />
                Sede Principal en Cali • Cobertura Nacional en Colombia
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
                Tecnología que <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35]">
                  transforma procesos
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed mx-auto lg:mx-0">
                Integramos tecnología, conectividad e Inteligencia Artificial para crear soluciones
                adaptadas a cada organización.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#contacto"
                  className="px-7 py-3.5 rounded-full text-sm font-extrabold text-slate-900 bg-[#F3CB35] hover:bg-[#e2bb2d] shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-center"
                >
                  Solicitar Asesoría Personalizada
                </a>
                <a
                  href="#servicios"
                  className="px-7 py-3.5 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-center flex items-center justify-center gap-2"
                >
                  Explorar Servicios
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              {/* Slogan Pill */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-3 text-xs sm:text-sm font-bold text-slate-300">
                <div className="flex -space-x-1">
                  <span className="w-3 h-3 rounded-full bg-[#88BD4C] border-2 border-[#0A192F]" />
                  <span className="w-3 h-3 rounded-full bg-[#F3CB35] border-2 border-[#0A192F]" />
                  <span className="w-3 h-3 rounded-full bg-[#0087C3] border-2 border-[#0A192F]" />
                </div>
                <span className="italic tracking-wide text-sky-200">
                  "Una nueva forma de entender las redes"
                </span>
              </div>
            </div>

            {/* Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#88BD4C] via-[#0087C3] to-[#F3CB35] rounded-3xl blur-md opacity-40 transition duration-1000" />

                <div className="relative rounded-2xl overflow-hidden bg-slate-800 shadow-2xl border border-white/10 group">
                  <div className="relative h-96 sm:h-[32rem]">
                    {HERO_SLIDES.map((slide, index) => (
                      <img
                        key={slide}
                        src={slide}
                        alt=""
                        aria-hidden="true"
                        className={`absolute inset-0 h-full w-full object-cover contrast-110 saturate-110 transition-opacity duration-1000 ${
                          index === activeSlide ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    ))}
                    <div className="absolute inset-0 bg-slate-950/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/75 via-[#0A192F]/5 to-transparent" />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/15">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-white/15 bg-gradient-to-br from-[#0087C3]/35 via-[#88BD4C]/25 to-[#F3CB35]/30 p-2.5 shadow-lg shadow-[#0087C3]/20">
                        <RadioTower className="h-6 w-6 text-[#F3CB35] drop-shadow-[0_0_6px_rgba(243,203,53,0.65)]" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-300">
                          Infraestructura de Red Propia
                        </p>
                        <p className="text-sm font-black text-white">
                          Fibra Óptica & Microondas en Cali y Colombia
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CIFRAS */}
      <section className="telcobras-rounded-font relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-white p-7 text-center shadow-md transition-shadow duration-300 hover:shadow-xl sm:p-8">
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0087C3]/35 bg-white text-[#0087C3]">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#88BD4C] tracking-tight">
              +20 Años
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">
              De Experiencia y Trayectoria
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-7 text-center shadow-md transition-shadow duration-300 hover:shadow-xl sm:p-8">
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#88BD4C]/45 bg-white text-[#6A9D32]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#88BD4C] tracking-tight">
              99,6 %
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">
              Disponibilidad SLA Garantizada
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-7 text-center shadow-md transition-shadow duration-300 hover:shadow-xl sm:p-8">
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#F3CB35]/60 bg-white text-[#B18B00]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#88BD4C] tracking-tight">
              15 Días
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">
              Instalación Rápida y Eficiente
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-white p-7 text-center shadow-md transition-shadow duration-300 hover:shadow-xl sm:p-8">
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0087C3]/35 bg-white text-[#0087C3]">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#88BD4C] tracking-tight">
              24 / 7
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">
              Soporte e Ingeniería Especializada
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
