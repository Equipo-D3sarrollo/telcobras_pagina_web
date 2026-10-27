import { useEffect, useState, type ReactNode } from "react";
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
import { useRotatingHighlight } from "@/hooks/use-rotating-highlight";
import { BrandGlowBorder } from "./BrandGlowBorder";
import { BackgroundVideo } from "./BackgroundVideo";
import { useTranslations } from "@/lib/accessibility-preferences-context";

const HERO_SLIDES = [HERO_PHOTO, TECHNICIAN_PHOTO, CALI_PHOTO];
const METRICS_COUNT = 4;
const METRIC_HIGHLIGHT_MS = 3000;

interface MetricCardProps {
  index: number;
  activeIndex: number;
  onHoverStart: (index: number) => void;
  onHoverEnd: () => void;
  children: ReactNode;
}

/* Tarjeta de cifra con borde iluminado decorativo; el contenido se mantiene intacto. */
function MetricCard({ index, activeIndex, onHoverStart, onHoverEnd, children }: MetricCardProps) {
  const isActive = index === activeIndex;

  return (
    <div
      className="relative rounded-lg border border-slate-100 bg-white p-7 text-center shadow-md transition-shadow duration-300 hover:shadow-xl sm:p-8"
      data-active={isActive}
      onBlur={onHoverEnd}
      onFocus={() => onHoverStart(index)}
      onMouseEnter={() => onHoverStart(index)}
      onMouseLeave={onHoverEnd}
    >
      <BrandGlowBorder />
      {children}
    </div>
  );
}

/* Rotación de la tarjeta iluminada (lógica compartida en useRotatingHighlight). */
function useMetricHighlight() {
  const { containerRef, activeIndex, onHoverStart, onHoverEnd } = useRotatingHighlight<HTMLElement>(
    METRICS_COUNT,
    METRIC_HIGHLIGHT_MS,
  );

  return {
    metricsRef: containerRef,
    metricCardProps: { activeIndex, onHoverStart, onHoverEnd },
  };
}

export function HeroAndMetrics() {
  const [activeSlide, setActiveSlide] = useState(0);
  const { metricsRef, metricCardProps } = useMetricHighlight();
  const t = useTranslations().hero;

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
        <BackgroundVideo
          src="/video_inicio.mp4"
          poster="/video_inicio.webp"
          className="absolute inset-0 z-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 z-[1] bg-slate-950/55" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid min-w-0 items-center gap-12 lg:grid-cols-12">
            <div className="min-w-0 space-y-6 text-center lg:col-span-7 lg:text-left">
              <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold tracking-wide text-sky-200 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#88BD4C] animate-pulse" />
                {t.eyebrow}
              </div>

              <h1 className="break-words text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                {t.title} <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-gradient-blue)] via-[var(--brand-gradient-green)] to-[var(--brand-gradient-yellow)]">
                  {t.highlight}
                </span>
              </h1>

              <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-slate-300 lg:mx-0 sm:text-lg md:text-xl">
                {t.description}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="#contacto"
                  className="px-7 py-3.5 rounded-full text-sm font-extrabold text-slate-900 bg-[#F3CB35] hover:bg-[#e2bb2d] shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-center"
                >
                  {t.requestAdvice}
                </a>
                <a
                  href="#servicios"
                  className="px-7 py-3.5 rounded-full text-sm font-bold text-white bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all text-center flex items-center justify-center gap-2"
                >
                  {t.exploreServices}
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>

              {/* Slogan Pill */}
              <div className="flex items-center justify-center gap-3 pt-4 text-xs font-bold text-slate-300 sm:text-sm lg:justify-start">
                <div className="flex -space-x-1">
                  <span className="w-3 h-3 rounded-full bg-[#88BD4C] border-2 border-[#0A192F]" />
                  <span className="w-3 h-3 rounded-full bg-[#F3CB35] border-2 border-[#0A192F]" />
                  <span className="w-3 h-3 rounded-full bg-[#0087C3] border-2 border-[#0A192F]" />
                </div>
                <span className="min-w-0 break-words text-sky-200 italic tracking-wide">
                  {t.slogan}
                </span>
              </div>
            </div>

            {/* Hero Image Card */}
            <div className="relative min-w-0 lg:col-span-5">
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
                        width={640}
                        height={512}
                        loading={index === 0 ? "eager" : "lazy"}
                        fetchPriority={index === 0 ? "high" : "auto"}
                        className={`absolute inset-0 h-full w-full object-cover contrast-110 saturate-110 transition-opacity duration-1000 ${
                          index === activeSlide ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    ))}
                    <div className="absolute inset-0 bg-slate-950/10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A192F]/75 via-[#0A192F]/5 to-transparent" />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/15 bg-slate-900/90 p-4 backdrop-blur-md">
                    <div className="hero-feature-caption flex min-w-0 items-center gap-3">
                      <div className="rounded-lg border border-white/15 bg-gradient-to-br from-[#0087C3]/35 via-[#88BD4C]/25 to-[#F3CB35]/30 p-2.5 shadow-lg shadow-[#0087C3]/20">
                        <RadioTower className="h-6 w-6 text-[#F3CB35] drop-shadow-[0_0_6px_rgba(243,203,53,0.65)]" />
                      </div>
                      <div className="hero-feature-caption-copy min-w-0">
                        <p className="text-xs font-bold text-slate-300">
                          {t.networkInfrastructure}
                        </p>
                        <p className="text-sm font-black text-white">{t.fiberMicrowave}</p>
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
      <section
        ref={metricsRef}
        className="telcobras-rounded-font relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard index={0} {...metricCardProps}>
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0087C3]/35 bg-white text-[#0087C3]">
              <Award className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--brand-action)] tracking-tight">
              {t.metrics[0].value}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">{t.metrics[0].description}</div>
          </MetricCard>

          <MetricCard index={1} {...metricCardProps}>
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#88BD4C]/45 bg-white text-[#6A9D32]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--brand-action)] tracking-tight">
              {t.metrics[1].value}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">{t.metrics[1].description}</div>
          </MetricCard>

          <MetricCard index={2} {...metricCardProps}>
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#F3CB35]/60 bg-white text-[#B18B00]">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--brand-action)] tracking-tight">
              {t.metrics[2].value}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">{t.metrics[2].description}</div>
          </MetricCard>

          <MetricCard index={3} {...metricCardProps}>
            <div className="metric-icon-glow mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0087C3]/35 bg-white text-[#0087C3]">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--brand-action)] tracking-tight">
              {t.metrics[3].value}
            </div>
            <div className="mt-2 text-sm font-bold text-slate-600">{t.metrics[3].description}</div>
          </MetricCard>
        </div>
      </section>
    </>
  );
}
