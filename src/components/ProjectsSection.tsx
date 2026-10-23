import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { PROYECTOS_DATA, CHATBOT_PHONE, type ProyectoItem } from "@/lib/telcobras-data";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/accessibility-preferences-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CHATBOT_ID = "chatbot-espy";
const CHATBOT_WHATSAPP_BASE_URL = "https://wa.me/573106777412";

// Orden y tamaño de cada tarjeta en el bento grid (lg: 4 columnas x 3 filas sin huecos).
// Los proyectos que no aparezcan aquí se agregan al final como celdas simples.
const BENTO_LAYOUT: Record<string, string> = {
  "automatizacion-agua-cali": "md:col-span-2 lg:row-span-2",
  "vigilancia-risaralda": "",
  "nodos-telemetria-cali": "",
  "chatbot-espy": "md:col-span-2",
  "zonas-wifi-corregimientos": "lg:col-span-2",
  "centros-digitales-claro": "lg:col-span-2",
};

const BENTO_ORDER = Object.keys(BENTO_LAYOUT);

function sortProjects(projects: ProyectoItem[]) {
  const rank = (proyecto: ProyectoItem) => {
    if (proyecto.destacado) return -1;
    const index = BENTO_ORDER.indexOf(proyecto.id);
    return index === -1 ? BENTO_ORDER.length : index;
  };
  return [...projects].sort((a, b) => rank(a) - rank(b));
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path d="M16.003 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.47 1.73 6.4L3.2 28.8l6.55-1.71a12.74 12.74 0 0 0 6.25 1.6h.01c7.06 0 12.8-5.74 12.8-12.8s-5.75-12.69-12.81-12.69zm0 23.04h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.6 10.6 0 0 1-1.63-5.66c0-5.88 4.79-10.66 10.67-10.66 2.85 0 5.52 1.11 7.54 3.13a10.6 10.6 0 0 1 3.13 7.54c0 5.88-4.79 10.66-10.67 10.66zm5.85-7.98c-.32-.16-1.9-.94-2.19-1.05-.29-.1-.51-.16-.72.16-.21.32-.82 1.05-1.01 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.86-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.53-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.25 3.44 5.45 4.82.76.33 1.35.53 1.82.68.76.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z" />
    </svg>
  );
}

function ChatbotWhatsAppLink({
  className,
  label,
  message,
}: {
  className?: string;
  label: string;
  message: string;
}) {
  return (
    <a
      href={`${CHATBOT_WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3CB35]",
        className,
      )}
    >
      <WhatsAppIcon className="h-4 w-4 fill-[#88BD4C]" />
      {CHATBOT_PHONE.display}
    </a>
  );
}

/* Ilustración del robot asistente virtual con diálogos en español */
function EspyBotIllustration({
  compact = false,
  copy,
}: {
  compact?: boolean;
  copy: ReturnType<typeof useTranslations>["chatbotProject"];
}) {
  return (
    <div className="relative flex select-none flex-col items-center justify-center">
      {/* Globo superior: ¡HOLA! */}
      <div className="relative z-10 mb-2 motion-safe:animate-bounce [animation-duration:3s]">
        <div className="flex items-center justify-center rounded-2xl border-2 border-white bg-[#006BA4] px-7 py-2.5 shadow-lg shadow-sky-500/25">
          <span className="text-2xl font-black tracking-wider text-white sm:text-3xl">
            {copy.greeting}
          </span>
        </div>
        <div className="mx-auto h-0 w-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#0087C3]" />
      </div>

      {/* Fila central: globos laterales y el robot */}
      <div className="relative z-10 flex w-full items-center justify-center gap-2 px-2 sm:gap-4">
        <div className={cn("hidden flex-col items-end", !compact && "sm:flex")}>
          <div className="flex items-center gap-1.5 rounded-2xl border-2 border-white bg-[#88BD4C] px-3 py-2 shadow-md">
            <span className="h-2 w-2 rounded-full bg-white motion-safe:animate-pulse" />
            <span className="h-2 w-2 rounded-full bg-white motion-safe:animate-pulse [animation-delay:200ms]" />
            <span className="h-2 w-2 rounded-full bg-white motion-safe:animate-pulse [animation-delay:400ms]" />
          </div>
        </div>

        <div className="relative flex flex-col items-center">
          <div className="flex flex-col items-center">
            <span className="h-2.5 w-2.5 rounded-full bg-[#88BD4C] shadow-xs ring-4 ring-emerald-200/60" />
            <span className="h-3 w-1 bg-white" />
          </div>

          <div className="relative flex h-24 w-28 flex-col items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-b from-[#0087C3] to-[#1a6f9c] p-2 shadow-xl sm:h-28 sm:w-32">
            <span className="absolute -left-2 top-8 h-6 w-2 rounded-l-md bg-[#88BD4C]" />
            <span className="absolute -right-2 top-8 h-6 w-2 rounded-r-md bg-[#88BD4C]" />
            <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#0A192F] p-2">
              <div className="mb-1 flex items-center gap-4">
                <div className="h-2.5 w-4 rounded-t-full border-x-3 border-t-3 border-sky-300 shadow-[0_0_8px_#38bdf8]" />
                <div className="h-2.5 w-4 rounded-t-full border-x-3 border-t-3 border-sky-300 shadow-[0_0_8px_#38bdf8]" />
              </div>
              <div className="h-2 w-5 rounded-b-full border-b-2 border-sky-300" />
            </div>
          </div>

          <div className="relative -mt-1 flex h-14 w-20 flex-col items-center justify-center rounded-2xl border-2 border-white bg-gradient-to-b from-[#0087C3] to-[#124b6e] p-1.5 shadow-lg sm:h-16 sm:w-24">
            <span className="absolute -left-3 top-2 h-8 w-3 rounded-full border border-white bg-[#0087C3]" />
            <span className="absolute -right-3 top-2 h-8 w-3 rounded-full border border-white bg-[#0087C3]" />
            <div className="flex h-full w-full items-center justify-center gap-1.5 rounded-xl bg-[#0A192F]/60 px-2">
              <span className="h-2 w-2 rounded-full bg-[#88BD4C] motion-safe:animate-ping" />
              <div className="h-0.5 flex-1 bg-sky-300/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#F3CB35]" />
            </div>
          </div>

          <div className="mt-1 h-3 w-28 rounded-full bg-gradient-to-r from-transparent via-[#88BD4C] to-transparent opacity-80 blur-[1px] sm:w-36" />
          <div className="mt-0.5 flex h-5 w-32 items-center justify-center gap-2 rounded-t-xl border border-slate-200 bg-slate-100 shadow-xs sm:w-40">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0087C3]" />
            <span className="text-[0.5625rem] font-black uppercase tracking-widest text-slate-500">
              ESPY BOT
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#88BD4C]" />
          </div>
        </div>

        <div className="flex max-w-[150px] flex-col gap-2 sm:max-w-[180px]">
          <div className="relative rounded-2xl border-2 border-white bg-[#88BD4C] px-3 py-2 shadow-md">
            <p className="text-[0.6875rem] font-black leading-tight text-slate-900 sm:text-xs">
              {copy.question}
            </p>
            <div className="absolute -left-2 top-3 h-0 w-0 border-b-[6px] border-r-[8px] border-t-[6px] border-b-transparent border-r-[#88BD4C] border-t-transparent" />
          </div>
          <div className="relative rounded-2xl border-2 border-white bg-[#006BA4] px-3 py-2 shadow-md">
            <p className="text-[0.6875rem] font-black leading-tight text-white sm:text-xs">
              {copy.assistant}
            </p>
            <div className="absolute -left-2 top-3 h-0 w-0 border-b-[6px] border-r-[8px] border-t-[6px] border-b-transparent border-r-[#006BA4] border-t-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

type ProjectTranslation = ReturnType<typeof useTranslations>["projects"]["cards"][keyof ReturnType<
  typeof useTranslations
>["projects"]["cards"]];

function ProjectChips({ proyecto, copy }: { proyecto: ProyectoItem; copy: ProjectTranslation }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-[#006BA4] px-3 py-1 text-xs font-extrabold text-white shadow-sm">
        {copy.category}
      </span>
      {proyecto.ubicacion && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800 shadow-sm">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 text-[#0087C3]" />
          {copy.location ?? proyecto.ubicacion}
        </span>
      )}
    </div>
  );
}

interface ProjectCardProps {
  proyecto: ProyectoItem;
  numero: number;
  onOpen: () => void;
  copy: ProjectTranslation;
  labels: ReturnType<typeof useTranslations>["projects"];
  chatbotCopy: ReturnType<typeof useTranslations>["chatbotProject"];
}

function ProjectCard({ proyecto, numero, onOpen, copy, labels, chatbotCopy }: ProjectCardProps) {
  const isChatbot = proyecto.id === CHATBOT_ID;
  const isFeatured = proyecto.destacado;

  return (
    <article
      className={cn(
        "group relative isolate flex h-full flex-col justify-between overflow-hidden rounded-3xl bg-[#0A192F] text-white shadow-lg shadow-slate-900/10 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-2xl focus-within:-translate-y-1 focus-within:shadow-2xl",
        isChatbot && "bg-gradient-to-br from-[#0087C3] via-[#1a6f9c] to-[#0A192F]",
      )}
    >
      {/* Fondo: foto o ilustración */}
      {isChatbot ? (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 flex h-[62%] items-start justify-center pt-16 md:h-full md:items-center md:justify-end md:pr-6 md:pt-0"
        >
          <div className="origin-top scale-[0.72] transition-transform duration-700 ease-out group-hover:scale-[0.76] md:origin-right md:scale-[0.78] md:group-hover:scale-[0.82]">
            <EspyBotIllustration compact copy={chatbotCopy} />
          </div>
        </div>
      ) : (
        <>
          <img
            src={proyecto.imagen}
            alt={copy.alt}
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 group-focus-within:scale-105"
          />
          {/* Tinte de marca para unificar fotos de distinta fuente */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[#0087C3]/20 mix-blend-multiply"
          />
        </>
      )}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10 bg-gradient-to-t from-[#0A192F] via-[#0A192F]/75 to-transparent",
          isChatbot && "via-[#0A192F]/40 md:bg-gradient-to-r md:via-[#0A192F]/50",
        )}
      />

      {/* Número decorativo */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-5 top-3 font-black leading-none text-white/20",
          isFeatured ? "text-7xl lg:text-8xl" : "text-6xl",
        )}
      >
        {String(numero).padStart(2, "0")}
      </span>

      {/* Botón que cubre toda la tarjeta y abre el detalle */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={labels.detail.replace("{title}", copy.title)}
        aria-haspopup="dialog"
        className="absolute inset-0 z-10 cursor-pointer rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F3CB35] focus-visible:ring-inset"
      />

      <div className="pointer-events-none relative p-5 sm:p-6">
        <ProjectChips proyecto={proyecto} copy={copy} />
      </div>

      <div
        className={cn(
          "pointer-events-none relative space-y-2 p-5 sm:p-6",
          isChatbot && "md:max-w-[55%]",
        )}
      >
        <h3
          className={cn(
            "font-black leading-tight text-white",
            isFeatured ? "text-[1.375rem] sm:text-2xl lg:text-[1.75rem]" : "text-lg sm:text-xl",
          )}
        >
          {copy.title}
        </h3>
        <p
          className={cn(
            "project-card-description text-sm leading-relaxed text-slate-200 sm:text-[0.9375rem]",
            isFeatured ? "line-clamp-3" : "line-clamp-2",
          )}
        >
          {copy.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {isChatbot && (
            <ChatbotWhatsAppLink
              label={labels.chatbotTry}
              message={labels.chatbotMessage}
              className="pointer-events-auto relative z-20"
            />
          )}
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-1.5 text-sm font-extrabold text-[#F3CB35] transition-all duration-300 lg:translate-x-[-4px] lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-x-0 lg:group-focus-within:opacity-100"
          >
            {labels.view} <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProjectsSection() {
  const translations = useTranslations();
  const t = translations.projects;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const goToContactRef = useRef(false);

  const proyectos = sortProjects(PROYECTOS_DATA);
  const selected = proyectos.find((proyecto) => proyecto.id === selectedId) ?? null;

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="proyectos" className="relative bg-white py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center md:mb-16">
          <h2 className="bg-gradient-to-r from-[var(--brand-gradient-blue)] via-[var(--brand-gradient-green)] to-[var(--brand-gradient-yellow)] bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl md:text-5xl">
            {t.title}
          </h2>
          <p className="text-base text-slate-600 sm:text-lg">{t.description}</p>
        </div>

        <div
          ref={gridRef}
          className="grid auto-rows-[minmax(320px,auto)] grid-cols-1 gap-5 md:grid-cols-2 md:auto-rows-[minmax(300px,auto)] lg:grid-cols-4 lg:auto-rows-[minmax(270px,auto)]"
        >
          {proyectos.map((proyecto, index) => (
            <div
              key={proyecto.id}
              className={cn(
                BENTO_LAYOUT[proyecto.id] ?? "",
                proyecto.destacado && "min-h-[400px] md:min-h-0",
                proyecto.id === CHATBOT_ID && "min-h-[480px] md:min-h-0",
                "motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out",
                revealed
                  ? "opacity-100 translate-y-0"
                  : "motion-safe:translate-y-6 motion-safe:opacity-0",
              )}
              style={{ transitionDelay: revealed ? `${index * 90}ms` : undefined }}
            >
              <ProjectCard
                proyecto={proyecto}
                numero={index + 1}
                copy={t.cards[proyecto.id as keyof typeof t.cards]}
                labels={t}
                chatbotCopy={translations.chatbotProject}
                onOpen={() => {
                  setSelectedId(proyecto.id);
                  setIsDialogOpen(true);
                }}
              />
            </div>
          ))}
        </div>

        {/* Cierre de sección */}
        <div className="mt-12 flex flex-col items-center justify-between gap-5 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-8 text-center sm:flex-row sm:px-10 sm:text-left">
          <p className="text-xl font-black text-slate-900 sm:text-2xl">
            {t.challenge}{" "}
            <span className="bg-gradient-to-r from-[var(--brand-gradient-blue)] to-[var(--brand-gradient-green)] bg-clip-text text-transparent">
              {t.talk}
            </span>
          </p>
          <a
            href="#contacto"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#006BA4] px-7 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#005888] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0087C3]/40"
          >
            {t.talkProject}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </div>

      <Dialog open={isDialogOpen && selected !== null} onOpenChange={setIsDialogOpen}>
        {selected && (
          <DialogContent
            className="max-h-[90vh] max-w-2xl gap-0 overflow-y-auto rounded-3xl border-0 bg-white p-0 sm:rounded-3xl [&>button]:z-20 [&>button]:rounded-full [&>button]:bg-white/90 [&>button]:p-1.5 [&>button]:opacity-100 [&>button]:shadow-md"
            onCloseAutoFocus={(event) => {
              if (goToContactRef.current) {
                goToContactRef.current = false;
                event.preventDefault();
                document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
              }
            }}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-[#0A192F]">
              {selected.id === CHATBOT_ID ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0087C3] via-[#1a6f9c] to-[#0A192F]">
                  <div className="scale-[0.8] sm:scale-90">
                    <EspyBotIllustration copy={translations.chatbotProject} />
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={selected.imagen}
                    alt={t.cards[selected.id as keyof typeof t.cards].alt}
                    width={1280}
                    height={720}
                    className="h-full w-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[#0087C3]/15 mix-blend-multiply"
                  />
                </>
              )}
              <div className="absolute bottom-4 left-4">
                <ProjectChips
                  proyecto={selected}
                  copy={t.cards[selected.id as keyof typeof t.cards]}
                />
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <DialogHeader className="space-y-3 text-left">
                <DialogTitle className="text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
                  {t.cards[selected.id as keyof typeof t.cards].title}
                </DialogTitle>
                <DialogDescription className="text-[0.9375rem] leading-relaxed text-slate-600">
                  {t.cards[selected.id as keyof typeof t.cards].longDescription ??
                    t.cards[selected.id as keyof typeof t.cards].description}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-slate-500">{t.category}</dt>
                  <dd className="font-extrabold text-slate-900">
                    {t.cards[selected.id as keyof typeof t.cards].category}
                  </dd>
                </div>
                {selected.ubicacion && (
                  <div>
                    <dt className="font-bold text-slate-500">{t.location}</dt>
                    <dd className="font-extrabold text-slate-900">
                      {t.cards[selected.id as keyof typeof t.cards].location ?? selected.ubicacion}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#contacto"
                  onClick={(event) => {
                    event.preventDefault();
                    goToContactRef.current = true;
                    setIsDialogOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#88BD4C] px-6 py-3 text-sm font-extrabold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-[#78a841] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#88BD4C]/40"
                >
                  {t.quoteSimilar}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
                {selected.id === CHATBOT_ID && (
                  <ChatbotWhatsAppLink
                    label={t.chatbotTry}
                    message={t.chatbotMessage}
                    className="border-[#0087C3]/30 bg-[#006BA4] hover:bg-[#005888]"
                  />
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
