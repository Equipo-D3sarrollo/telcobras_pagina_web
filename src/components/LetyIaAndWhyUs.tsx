import {
  Sparkles,
  Radio,
  Clock,
  Headphones,
  Users,
  Cpu,
  ShieldCheck,
  Server,
  Zap,
  ArrowRight,
} from "lucide-react";
import { PROYECTOS_DATA, CHATBOT_PHONE } from "@/lib/telcobras-data";

export function LetyIaAndWhyUs() {
  const diferenciales = [
    {
      icon: Radio,
      title: "Red Propia y Redundante",
      desc: "Contamos con infraestructura propia de fibra óptica y radioenlace de microondas para garantizar autonomía y respuesta inmediata sin intermediarios.",
      color: "#0087C3",
    },
    {
      icon: Clock,
      title: "Instalación en 15 Días",
      desc: "Agilidad comprobada en el despliegue de soluciones para que tu empresa empiece a operar sin demoras prolongadas.",
      color: "#88BD4C",
    },
    {
      icon: Headphones,
      title: "Soporte Técnico 24/7",
      desc: "Atención continua con ingeniería especializada para atender eventos de manera oportuna y proactiva.",
      color: "#F3CB35",
    },
    {
      icon: Users,
      title: "Acompañamiento Cercano",
      desc: "Asignamos un equipo que entiende la realidad y metas operativas específicas de tu organización.",
      color: "#88BD4C",
    },
    {
      icon: Cpu,
      title: "Soluciones a la Medida",
      desc: "Diseño flexible de arquitectura de red y ciberseguridad adaptado al tamaño, presupuesto y crecimiento de tu empresa.",
      color: "#0087C3",
    },
    {
      icon: ShieldCheck,
      title: "Compromiso e Integridad",
      desc: "+20 años respaldan nuestro valor primordial: la confianza de las organizaciones que confían en nuestras soluciones.",
      color: "#F3CB35",
    },
  ];

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
      <section id="proyectos" className="py-20 md:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-sky-100 text-[#0087C3] text-xs font-extrabold uppercase tracking-wider">
              Proyectos
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              Proyectos que respaldan nuestra experiencia
            </h2>
          </div>

          <div className="space-y-12 md:space-y-20">
            {PROYECTOS_DATA.map((proyecto, index) => {
              const isLeft = index % 2 === 0;
              const isChatbot = proyecto.id === "chatbot-espy";

              return (
                <div
                  key={proyecto.id}
                  className={`grid md:grid-cols-2 gap-6 md:gap-10 items-center ${
                    isLeft ? "" : "md:[&>*:first-child]:order-2"
                  }`}
                >
                  {/* Imagen */}
                  <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-100 aspect-[4/3] bg-gradient-to-b from-sky-50 to-white flex items-center justify-center p-4">
                    {isChatbot ? (
                      /* Ilustración SVG del robot asistente virtual con diálogos en español */
                      <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden">
                        {/* Glow circular de fondo */}
                        <div className="absolute w-64 h-64 rounded-full bg-sky-200/50 blur-3xl pointer-events-none" />

                        {/* Globo superior: ¡HOLA! */}
                        <div className="relative z-10 mb-2 animate-bounce [animation-duration:3s]">
                          <div className="bg-[#0087C3] text-white px-7 py-2.5 rounded-2xl shadow-lg shadow-sky-500/25 border-2 border-white flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-black tracking-wider">
                              ¡HOLA!
                            </span>
                          </div>
                          {/* Triángulo del bocadillo */}
                          <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-[#0087C3] mx-auto" />
                        </div>

                        {/* Fila central: Globos laterales y el Robot */}
                        <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-4 w-full px-2">
                          {/* Globo izquierdo (verde): Escribiendo... */}
                          <div className="hidden sm:flex flex-col items-end">
                            <div className="bg-[#88BD4C] text-white px-3 py-2 rounded-2xl shadow-md border-2 border-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse [animation-delay:200ms]" />
                              <span className="w-2 h-2 rounded-full bg-white animate-pulse [animation-delay:400ms]" />
                            </div>
                          </div>

                          {/* Robot avatar */}
                          <div className="relative flex flex-col items-center">
                            {/* Antena */}
                            <div className="flex flex-col items-center">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#88BD4C] ring-4 ring-emerald-200/60 shadow-xs" />
                              <span className="w-1 h-3 bg-[#0087C3]" />
                            </div>

                            {/* Cabeza del robot */}
                            <div className="w-28 h-24 sm:w-32 sm:h-28 rounded-3xl bg-gradient-to-b from-[#0087C3] to-[#1a6f9c] p-2 shadow-xl border-4 border-white flex flex-col items-center justify-center relative">
                              {/* Orejitas / Sensores laterales */}
                              <span className="absolute -left-2 top-8 w-2 h-6 rounded-l-md bg-[#88BD4C]" />
                              <span className="absolute -right-2 top-8 w-2 h-6 rounded-r-md bg-[#88BD4C]" />

                              {/* Pantalla de la cara */}
                              <div className="w-full h-full rounded-2xl bg-[#0A192F] flex flex-col items-center justify-center p-2 relative overflow-hidden">
                                <div className="flex items-center gap-4 mb-1">
                                  {/* Ojos sonrientes en arco */}
                                  <div className="w-4 h-2.5 border-t-3 border-x-3 border-sky-300 rounded-t-full shadow-[0_0_8px_#38bdf8]" />
                                  <div className="w-4 h-2.5 border-t-3 border-x-3 border-sky-300 rounded-t-full shadow-[0_0_8px_#38bdf8]" />
                                </div>
                                {/* Sonrisa */}
                                <div className="w-5 h-2 border-b-2 border-sky-300 rounded-b-full" />
                              </div>
                            </div>

                            {/* Cuerpo del robot */}
                            <div className="w-20 h-14 sm:w-24 sm:h-16 -mt-1 rounded-2xl bg-gradient-to-b from-[#0087C3] to-[#124b6e] border-2 border-white p-1.5 flex flex-col items-center justify-center shadow-lg relative">
                              {/* Brazos */}
                              <span className="absolute -left-3 top-2 w-3 h-8 rounded-full bg-[#0087C3] border border-white" />
                              <span className="absolute -right-3 top-2 w-3 h-8 rounded-full bg-[#0087C3] border border-white" />
                              {/* Circuitos en el pecho */}
                              <div className="w-full h-full rounded-xl bg-[#0A192F]/60 flex items-center justify-center gap-1.5 px-2">
                                <span className="w-2 h-2 rounded-full bg-[#88BD4C] animate-ping" />
                                <div className="flex-1 h-0.5 bg-sky-300/60" />
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F3CB35]" />
                              </div>
                            </div>

                            {/* Base de proyección holográfica */}
                            <div className="w-28 sm:w-36 h-3 rounded-full bg-gradient-to-r from-transparent via-[#88BD4C] to-transparent mt-1 blur-[1px] opacity-80" />
                            <div className="w-32 sm:w-40 h-5 rounded-t-xl bg-slate-100 border border-slate-200 mt-0.5 shadow-xs flex items-center justify-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0087C3]" />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                ESPY BOT
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#88BD4C]" />
                            </div>
                          </div>

                          {/* Globos derechos en español */}
                          <div className="flex flex-col gap-2 max-w-[150px] sm:max-w-[180px]">
                            {/* Globo Verde: ¿Cómo puedo ayudarte hoy? */}
                            <div className="relative bg-[#88BD4C] text-white px-3 py-2 rounded-2xl shadow-md border-2 border-white">
                              <p className="text-[11px] sm:text-xs font-black leading-tight">
                                ¿Cómo puedo ayudarte hoy?
                              </p>
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-[#88BD4C] absolute -left-2 top-3" />
                            </div>

                            {/* Globo Azul: ¡Soy tu asistente virtual! */}
                            <div className="relative bg-[#0087C3] text-white px-3 py-2 rounded-2xl shadow-md border-2 border-white">
                              <p className="text-[11px] sm:text-xs font-black leading-tight">
                                ¡Soy tu asistente virtual!
                              </p>
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-[#0087C3] absolute -left-2 top-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={proyecto.imagen}
                        alt={proyecto.alt}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Recuadro azul oscuro */}
                  <div className="bg-[#0A192F] text-white rounded-3xl p-7 sm:p-9 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-24 h-1.5 bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35]" />
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-full bg-[#0087C3]/20 text-[#0087C3] flex items-center justify-center text-xs font-black">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#88BD4C]">
                        Proyecto
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white leading-tight mb-3">
                      {proyecto.titulo}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{proyecto.descripcion}</p>

                    {isChatbot && (
                      <a
                        href="https://wa.me/573106777412?text=Hola%2C%20quiero%20probar%20el%20chatbot%20de%20la%20ESPY"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Prueba el chatbot de la ESPY por WhatsApp"
                        className="mt-5 inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#0087C3]/15 border border-[#0087C3]/40 text-white text-sm font-bold hover:bg-[#0087C3]/25 transition-colors"
                      >
                        <svg
                          viewBox="0 0 32 32"
                          className="w-4 h-4 fill-[#88BD4C]"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M16.003 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.47 1.73 6.4L3.2 28.8l6.55-1.71a12.74 12.74 0 0 0 6.25 1.6h.01c7.06 0 12.8-5.74 12.8-12.8s-5.75-12.69-12.81-12.69zm0 23.04h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.6 10.6 0 0 1-1.63-5.66c0-5.88 4.79-10.66 10.67-10.66 2.85 0 5.52 1.11 7.54 3.13a10.6 10.6 0 0 1 3.13 7.54c0 5.88-4.79 10.66-10.67 10.66zm5.85-7.98c-.32-.16-1.9-.94-2.19-1.05-.29-.1-.51-.16-.72.16-.21.32-.82 1.05-1.01 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.86-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.53-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.25 3.44 5.45 4.82.76.33 1.35.53 1.82.68.76.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z" />
                        </svg>
                        {CHATBOT_PHONE.display}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. ¿POR QUÉ TELCOBRAS? */}
      <section id="por-que" className="py-20 md:py-28 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
              Diferenciales
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              ¿Por qué TELCOBRAS S.A.S.?
            </h2>
            <p className="text-slate-600 text-base sm:text-lg">
              Razones concretas por las que las organizaciones confían en nuestras soluciones.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {diferenciales.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: item.color }}
                  />

                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold mb-6 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: item.color }}
                  >
                    <ItemIcon className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. ALIADOS */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            Alianzas y Ecosistema Tecnológico
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 opacity-85">
            <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-sm sm:text-base flex items-center gap-2">
              <Server className="w-5 h-5 text-[#0087C3]" /> XPERTIC
            </div>

            <div className="px-6 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 font-extrabold text-sm sm:text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#88BD4C]" /> Aquora PTAP
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
