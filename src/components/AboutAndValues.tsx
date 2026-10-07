import {
  Check,
  Building2,
  TrendingUp,
  Sparkles,
  Handshake,
  ShieldCheck,
  Lightbulb,
  UsersRound,
  HeartHandshake,
  BookOpenCheck,
  Heart,
} from "lucide-react";

export function AboutAndValues() {
  const valores = [
    { label: "Compromiso", icon: Handshake, color: "#2491CC" },
    { label: "Integridad", icon: ShieldCheck, color: "#88BD4C" },
    { label: "Innovación", icon: Lightbulb, color: "#F3CB35" },
    { label: "Colaboración", icon: UsersRound, color: "#2491CC" },
    { label: "Responsabilidad Social", icon: HeartHandshake, color: "#88BD4C" },
    { label: "Aprendizaje Continuo", icon: BookOpenCheck, color: "#F3CB35" },
    { label: "Empatía", icon: Heart, color: "#2491CC" },
  ];

  return (
    <section
      id="nosotros"
      className="relative isolate overflow-hidden bg-slate-900 px-6 py-20 md:py-28"
    >
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/video_tel.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-[1] bg-white/65" />
      <div className="absolute top-0 right-0 z-[2] h-2 w-1/3 bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#0087C3]">
              Conectividad · Innovación · Confianza
            </p>

            <h2 className="bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35] bg-clip-text text-4xl font-black tracking-tight leading-[1.05] text-transparent sm:text-5xl lg:text-6xl">
              Quiénes Somos
            </h2>

            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35]" />

            <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              El aliado tecnológico de confianza para las empresas que buscan crecer, transformarse
              y mantenerse vigentes
            </h3>

            <p className="text-slate-600 leading-relaxed font-normal">
              Somos una compañía colombiana con sede principal en Cali y más de 20 años de
              experiencia comprobada. Desarrollamos soluciones integrales de tecnología y
              telecomunicaciones con infraestructura propia de fibra óptica y radioenlace de
              microondas, además de integrar Inteligencia Artificial en procesos clave. Atendemos a
              empresas medianas y grandes que exigen continuidad, seguridad y desempeño superior.
            </p>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#88BD4C]/15 text-[#88BD4C] mt-1 shrink-0">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Nuestro Valor Central: LA CONFIANZA
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Cada enlace, cada servicio en la nube y cada despliegue de seguridad lo
                    respaldamos con cercanía, honestidad técnica y cumplimiento estricto de los
                    acuerdos de servicio.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-2 lg:gap-6">
            <div className="relative isolate overflow-hidden rounded-3xl bg-[#0087C3] p-[2px] shadow-lg shadow-[#0087C3]/20">
              <div
                aria-hidden="true"
                className="absolute inset-0 motion-safe:animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_290deg,#0087C3_340deg,#ffffff_360deg)]"
              />
              <div className="relative h-full rounded-[22px] bg-white/95 p-6 md:p-8">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black uppercase tracking-wider text-[#0087C3] md:text-lg">
                  <Building2 className="h-5 w-5" /> Misión
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 md:text-base">
                  Colaborar con las organizaciones como aliados estratégicos en la implementación de
                  soluciones tecnológicas que impulsen sus objetivos y generen un impacto positivo
                  mediante la adopción efectiva de las TIC.
                </p>
              </div>
            </div>

            <div className="relative isolate overflow-hidden rounded-3xl bg-[#88BD4C] p-[2px] shadow-lg shadow-[#88BD4C]/25">
              <div
                aria-hidden="true"
                className="absolute inset-0 motion-safe:animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_290deg,#88BD4C_340deg,#ffffff_360deg)]"
              />
              <div className="relative h-full rounded-[22px] bg-white/95 p-6 md:p-8">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black uppercase tracking-wider text-[#88BD4C] md:text-lg">
                  <TrendingUp className="h-5 w-5" /> Visión
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 md:text-base">
                  Ser líderes en tecnologías de la información y comunicación en Latinoamérica,
                  destacándonos por la apropiación tecnológica y el desarrollo sostenible de
                  nuestros aliados.
                </p>
              </div>
            </div>
          </div>

          <div className="relative isolate overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-900/10 backdrop-blur-sm sm:p-8 lg:col-span-2 lg:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-56 rounded-full bg-[#88BD4C]/10 blur-3xl"
            />
            <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F3CB35]/15 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-800">
                  <Sparkles className="h-4 w-4 text-[#C99E00]" />
                  Nuestra esencia
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Valores que nos mueven
                </h3>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-right">
                Principios que guían cada relación, cada decisión y cada solución que construimos.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {valores.map(({ label, icon: Icon, color }) => (
                <div
                  key={label}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/10 sm:p-5"
                >
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 opacity-80 transition-opacity group-hover:opacity-100"
                    style={{ backgroundColor: color }}
                  />
                  <span
                    className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${color}1A`, color }}
                  >
                    <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
                  </span>
                  <p className="text-sm font-extrabold leading-snug text-slate-800 sm:text-base">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
