import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import {
  ArrowRight,
  Clock,
  Cpu,
  Headphones,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRotatingHighlight } from "@/hooks/use-rotating-highlight";
import { BrandGlowBorder } from "./BrandGlowBorder";

type TipoEnlace = "fibra" | "radio";

interface Diferencial {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  /** Clases de posición en el bento grid. */
  span?: string;
  /** Nodo de la ilustración que representa a la tarjeta (coordenadas del viewBox). */
  nodo: { x: number; y: number; color: string; enlace: TipoEnlace };
}

const DIFERENCIAL_DESTACADO = {
  id: "red-propia",
  title: "Red Propia y Redundante",
  desc: "Fibra óptica y radioenlace de microondas propios: autonomía y respuesta inmediata, sin intermediarios.",
};

// Orden del grid (lg: 3 columnas): destacada 2x2 a la izquierda, dos apiladas a su
// derecha y tres en la fila inferior. En tablet la última ocupa 2 columnas para no
// dejar huecos. Los nodos conservan la disposición original de la ilustración.
const DIFERENCIALES: Diferencial[] = [
  {
    id: "instalacion-15-dias",
    icon: Clock,
    title: "Instalación en 15 Días",
    desc: "Desplegamos sobre nuestra propia red, sin depender de terceros, para que tu empresa opere sin demoras.",
    nodo: { x: 340, y: 50, color: "#0087C3", enlace: "fibra" },
  },
  {
    id: "soporte-24-7",
    icon: Headphones,
    title: "Soporte Técnico 24/7",
    desc: "Ingeniería especializada y NOC que atienden cada evento de forma oportuna y proactiva.",
    nodo: { x: 340, y: 190, color: "#F3CB35", enlace: "fibra" },
  },
  {
    id: "acompanamiento-cercano",
    icon: Users,
    title: "Acompañamiento Cercano",
    desc: "Un equipo asignado que entiende la realidad y las metas operativas de tu organización.",
    nodo: { x: 60, y: 190, color: "#6A9D32", enlace: "radio" },
  },
  {
    id: "soluciones-a-la-medida",
    icon: Cpu,
    title: "Soluciones a la Medida",
    desc: "Arquitectura de red y ciberseguridad diseñada según el tamaño, presupuesto y crecimiento de tu empresa.",
    nodo: { x: 200, y: 225, color: "#1a6f9c", enlace: "radio" },
  },
  {
    id: "compromiso-integridad",
    icon: ShieldCheck,
    title: "Compromiso e Integridad",
    desc: "Nuestro valor primordial es la confianza de las organizaciones que eligen nuestras soluciones.",
    span: "md:col-span-2 lg:col-span-1",
    nodo: { x: 60, y: 50, color: "#88BD4C", enlace: "fibra" },
  },
];

// Orden del ciclo automático (sentido horario alrededor de la tarjeta principal).
const CICLO = [
  "instalacion-15-dias",
  "soporte-24-7",
  "compromiso-integridad",
  "soluciones-a-la-medida",
  "acompanamiento-cercano",
];

const CENTRO = { x: 200, y: 120 };
const ICON_GRADIENT_ID = "diferenciales-icon-gradient";
const TOUCH_PAUSE_MS = 6000;

type PointerHandlers = (id: string) => {
  onPointerEnter: (event: PointerEvent<Element>) => void;
  onPointerLeave: (event: PointerEvent<Element>) => void;
};

interface NetworkIllustrationProps {
  activeId: string;
  pointerHandlers: PointerHandlers;
}

/* Ilustración decorativa: nodo central y un nodo por diferencial. Fibra = continua,
   radioenlace = punteado; un enlace de respaldo se enciende cada 6 s. El nodo activo se
   ilumina en el color de su tarjeta y recibe un pulso de luz desde el centro. */
function NetworkIllustration({ activeId, pointerHandlers }: NetworkIllustrationProps) {
  const respaldo = "M340 50 Q392 120 340 190";
  const activo = DIFERENCIALES.find((item) => item.id === activeId);
  const rutaDe = (item: Diferencial) => `M${CENTRO.x} ${CENTRO.y} L${item.nodo.x} ${item.nodo.y}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 400 250"
      className="h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="network-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#88BD4C" />
          <stop offset="100%" stopColor="#0087C3" />
        </radialGradient>
      </defs>

      {/* Enlace de respaldo: base punteada tenue + encendido periódico */}
      <path
        d={respaldo}
        fill="none"
        stroke="rgb(255 255 255 / 22%)"
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      <path
        className="network-backup-glow"
        d={respaldo}
        fill="none"
        stroke="#F3CB35"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Enlaces base (fibra continua en cian, radioenlace punteado en verde) */}
      {DIFERENCIALES.map((item) => (
        <path
          key={`base-${item.id}`}
          d={rutaDe(item)}
          fill="none"
          stroke={item.nodo.enlace === "fibra" ? "rgb(0 135 195 / 55%)" : "rgb(136 189 76 / 60%)"}
          strokeWidth="1.75"
          strokeDasharray={item.nodo.enlace === "radio" ? "3 5" : undefined}
        />
      ))}

      {/* Flujo de luz suave sobre todos los enlaces */}
      {DIFERENCIALES.map((item, index) => (
        <path
          key={`flow-${item.id}`}
          className={cn("network-flow", index % 2 === 1 && "network-flow--delayed")}
          d={rutaDe(item)}
          fill="none"
          pathLength={100}
          stroke="rgb(255 255 255 / 55%)"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      ))}

      {/* Enlace activo resaltado en el color de su tarjeta (solo cambia la opacidad) */}
      {DIFERENCIALES.map((item) => (
        <path
          key={`link-${item.id}`}
          className="network-link-active"
          data-node-active={item.id === activeId}
          d={rutaDe(item)}
          fill="none"
          stroke={item.nodo.color}
          strokeWidth="2.5"
          strokeDasharray={item.nodo.enlace === "radio" ? "3 5" : undefined}
        />
      ))}

      {/* Pulso viajero del centro al nodo activo */}
      {activo && (
        <path
          key={`pulse-${activo.id}`}
          className="network-active-pulse"
          d={rutaDe(activo)}
          fill="none"
          pathLength={100}
          stroke={activo.nodo.color}
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}

      {/* Nodos de los diferenciales */}
      {DIFERENCIALES.map((item) => {
        const isActive = item.id === activeId;
        const { x, y, color } = item.nodo;
        return (
          <g
            key={item.id}
            className="network-node cursor-pointer"
            data-node-active={isActive}
            {...pointerHandlers(item.id)}
          >
            <circle cx={x} cy={y} r="20" fill="transparent" />
            <circle className="network-node-halo" cx={x} cy={y} r="18" fill={color} />
            {isActive && (
              <circle
                className="network-node-ring"
                cx={x}
                cy={y}
                r="11"
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
            )}
            <circle cx={x} cy={y} r="7" fill="#0A192F" stroke={color} strokeWidth="2.25" />
            <circle className="network-node-core" cx={x} cy={y} r="3" fill={color} />
          </g>
        );
      })}

      {/* Nodo central con pulso al cambiar el activo */}
      <circle cx={CENTRO.x} cy={CENTRO.y} r="26" fill="#0087C3" opacity="0.14" />
      {activo && (
        <circle
          key={`center-${activo.id}`}
          className="network-center-pulse"
          cx={CENTRO.x}
          cy={CENTRO.y}
          r="15"
          fill="none"
          stroke={activo.nodo.color}
          strokeWidth="2"
        />
      )}
      <circle
        cx={CENTRO.x}
        cy={CENTRO.y}
        r="15"
        fill="url(#network-core)"
        stroke="#ffffff"
        strokeWidth="2"
      />
      <circle cx={CENTRO.x} cy={CENTRO.y} r="4" fill="#ffffff" />
    </svg>
  );
}

export function WhyUsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  // Arranca visible y animado; solo se pausa cuando el observer confirma que salió.
  const [isInView, setIsInView] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Estado compartido: un único activo para la ilustración y las 5 tarjetas. Rota cada
  // 3 s; hover/focus lo fija y al salir se reanuda tras 1,5 s; un toque pausa 6 s.
  const {
    containerRef: gridRef,
    activeIndex,
    onHoverStart,
    onHoverEnd,
    onTouchActivate,
  } = useRotatingHighlight<HTMLDivElement>(CICLO.length, 3000, { resumeDelayMs: 1500 });
  const activeId = CICLO[activeIndex] ?? "";

  const pointerHandlers = (id: string) => {
    const index = CICLO.indexOf(id);
    return {
      onPointerEnter: (event: PointerEvent<Element>) => {
        if (event.pointerType === "touch") {
          onTouchActivate(index, TOUCH_PAUSE_MS);
        } else {
          onHoverStart(index);
        }
      },
      onPointerLeave: (event: PointerEvent<Element>) => {
        if (event.pointerType !== "touch") onHoverEnd();
      },
    };
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting) setRevealed(true);
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // El video de fondo solo se reproduce mientras la sección está en pantalla.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isInView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isInView]);

  // Aparición escalonada: opacidad siempre; desplazamiento solo con motion-safe.
  const revealClass = (index: number) => ({
    className: cn(
      "transition-opacity duration-700 ease-out motion-safe:transition-[opacity,transform]",
      revealed ? "opacity-100" : "opacity-0 motion-safe:translate-y-6",
    ),
    style: { transitionDelay: revealed ? `${index * 90}ms` : undefined },
  });

  const featuredReveal = revealClass(0);

  return (
    <section
      ref={sectionRef}
      id="por-que"
      data-animations-paused={!isInView}
      className="relative isolate overflow-hidden bg-[#0A192F] py-12 md:py-16"
    >
      {/* Video de fondo girado 90°: el contenedor usa container queries para que el
          video rotado (ancho = alto de la sección y viceversa) cubra todo el fondo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden [container-type:size]"
      >
        <video
          ref={videoRef}
          autoPlay
          className="absolute left-1/2 top-1/2 h-[100cqw] w-[100cqh] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-cover"
          loop
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
        >
          <source src="/video_inicio.mp4" type="video/mp4" />
        </video>
        {/* Capa navy para mantener el contraste del texto sobre el video */}
        <div className="absolute inset-0 bg-[#0A192F]/75" />
      </div>

      {/* Malla de degradado suave en colores de marca */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 18%, rgb(0 135 195 / 22%), transparent 42%), radial-gradient(circle at 88% 78%, rgb(136 189 76 / 16%), transparent 45%), radial-gradient(circle at 60% 0%, rgb(0 135 195 / 10%), transparent 35%)",
        }}
      />

      {/* Degradado compartido para el trazo de los iconos */}
      <svg aria-hidden="true" focusable="false" className="absolute h-0 w-0">
        <defs>
          <linearGradient id={ICON_GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0087C3" />
            <stop offset="55%" stopColor="#88BD4C" />
            <stop offset="100%" stopColor="#F3CB35" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl space-y-3 text-center md:mb-10">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            ¿Por qué{" "}
            <span className="bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35] bg-clip-text text-transparent">
              TELCOBRAS S.A.S.?
            </span>
          </h2>
          <p className="text-base text-slate-300 sm:text-lg">
            Razones concretas por las que las organizaciones confían en nuestras soluciones.
          </p>
        </div>

        <div
          ref={gridRef}
          className="relative grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[minmax(220px,auto)]"
        >
          {/* Diferencial destacado */}
          <div
            className={cn("relative z-0 md:col-span-2 lg:row-span-2", featuredReveal.className)}
            style={featuredReveal.style}
          >
            <article
              data-active="true"
              style={{ "--brand-glow-duration": "6s" } as CSSProperties}
              className="relative flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-[#10284a] to-[#0A192F] p-7 text-white sm:p-9"
            >
              <BrandGlowBorder />

              <div className="space-y-3">
                <h3 className="text-2xl font-black leading-tight sm:text-[28px]">
                  {DIFERENCIAL_DESTACADO.title}
                </h3>
                <p className="max-w-xl text-[15px] leading-relaxed text-slate-200 sm:text-base">
                  {DIFERENCIAL_DESTACADO.desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#0087C3]/50 bg-[#0087C3]/15 px-3 py-1 text-xs font-bold text-sky-100">
                  <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-[#0087C3]" />
                  Fibra óptica
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#88BD4C]/50 bg-[#88BD4C]/15 px-3 py-1 text-xs font-bold text-lime-100">
                  <span
                    aria-hidden="true"
                    className="h-0.5 w-4 bg-[repeating-linear-gradient(90deg,#88BD4C_0_3px,transparent_3px_6px)]"
                  />
                  Radioenlace
                </span>
              </div>

              <div className="relative min-h-[180px] flex-1 sm:min-h-[200px]">
                <div className="absolute inset-0">
                  <NetworkIllustration activeId={activeId} pointerHandlers={pointerHandlers} />
                </div>
              </div>
            </article>
          </div>

          {DIFERENCIALES.map((item, index) => {
            const ItemIcon = item.icon;
            const reveal = revealClass(index + 1);
            const isActive = item.id === activeId;
            const cicloIndex = CICLO.indexOf(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "relative",
                  isActive ? "z-[3]" : "z-[2]",
                  item.span,
                  reveal.className,
                )}
                style={reveal.style}
              >
                <article
                  data-node-active={isActive}
                  onBlur={onHoverEnd}
                  onFocus={() => onHoverStart(cicloIndex)}
                  {...pointerHandlers(item.id)}
                  style={{ "--node-color": item.nodo.color } as CSSProperties}
                  className="diff-card brand-glow-always group relative flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7"
                >
                  <span aria-hidden="true" className="diff-card-tint-base" />
                  <span aria-hidden="true" className="diff-card-tint" />
                  <span aria-hidden="true" className="diff-card-glow" />
                  <BrandGlowBorder light={false} />
                  <span aria-hidden="true" className="diff-card-signal" />

                  <div className="relative">
                    <span className="relative mb-5 block h-11 w-11">
                      <span aria-hidden="true" className="diff-card-icon-halo" />
                      <ItemIcon
                        aria-hidden="true"
                        className="relative h-11 w-11"
                        color={`url(#${ICON_GRADIENT_ID})`}
                        strokeWidth={1.75}
                      />
                      <ItemIcon
                        aria-hidden="true"
                        className="diff-card-icon-active absolute inset-0 h-11 w-11"
                        color={item.nodo.color}
                        strokeWidth={2}
                      />
                    </span>
                    <h3 className="mb-2 text-lg font-extrabold text-slate-900 sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                      {item.desc}
                    </p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Cierre de sección */}
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="text-xl font-black text-white sm:text-2xl">¿Quieres conocer nuestra red?</p>
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 rounded-full bg-[#88BD4C] px-7 py-3.5 text-sm font-extrabold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#78a841] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#88BD4C]/40"
          >
            Hablemos
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
