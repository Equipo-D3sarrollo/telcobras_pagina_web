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
import { useTranslations } from "@/lib/accessibility-preferences-context";
import { BackgroundVideo } from "./BackgroundVideo";

export function AboutAndValues() {
  const t = useTranslations().about;
  const valores: { key: keyof typeof t.values; icon: typeof Handshake; color: string }[] = [
    { key: "compromiso", icon: Handshake, color: "#2491CC" },
    { key: "integridad", icon: ShieldCheck, color: "#88BD4C" },
    { key: "innovacion", icon: Lightbulb, color: "#F3CB35" },
    { key: "colaboracion", icon: UsersRound, color: "#2491CC" },
    { key: "responsabilidadSocial", icon: HeartHandshake, color: "#88BD4C" },
    { key: "aprendizajeContinuo", icon: BookOpenCheck, color: "#F3CB35" },
    { key: "empatia", icon: Heart, color: "#2491CC" },
  ];

  return (
    <section
      id="nosotros"
      className="relative isolate overflow-hidden bg-slate-900 px-6 py-20 md:py-28"
    >
      <BackgroundVideo
        src="/video_tel.mp4"
        poster="/video_tel.webp"
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 z-[1] bg-white/65" />
      <div className="absolute top-0 right-0 z-[2] h-2 w-1/3 bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35]" />

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#0087C3]">
              {t.eyebrow}
            </p>

            <h2 className="bg-gradient-to-r from-[var(--brand-gradient-blue)] via-[var(--brand-gradient-green)] to-[var(--brand-gradient-yellow)] bg-clip-text text-4xl font-black tracking-tight leading-[1.05] text-transparent sm:text-5xl lg:text-6xl">
              {t.title}
            </h2>

            <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-[#0087C3] via-[#88BD4C] to-[#F3CB35]" />

            <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              {t.heading}
            </h3>

            <p className="text-slate-600 leading-relaxed font-normal">{t.description}</p>

            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#88BD4C]/15 text-[#88BD4C] mt-1 shrink-0">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{t.coreValue}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{t.coreDescription}</p>
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
                  <Building2 className="h-5 w-5" /> {t.mission}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 md:text-base">
                  {t.missionDescription}
                </p>
              </div>
            </div>

            <div className="relative isolate overflow-hidden rounded-3xl bg-[#88BD4C] p-[2px] shadow-lg shadow-[#88BD4C]/25">
              <div
                aria-hidden="true"
                className="absolute inset-0 motion-safe:animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_290deg,#88BD4C_340deg,#ffffff_360deg)]"
              />
              <div className="relative h-full rounded-[22px] bg-white/95 p-6 md:p-8">
                <h3 className="mb-3 flex items-center gap-2 text-base font-black uppercase tracking-wider text-[var(--brand-action)] md:text-lg">
                  <TrendingUp className="h-5 w-5" /> {t.vision}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 md:text-base">
                  {t.visionDescription}
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
                  {t.essence}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  {t.valuesTitle}
                </h3>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-right">
                {t.valuesDescription}
              </p>
            </div>

            <div className="about-values-grid grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
              {valores.map(({ key, icon: Icon, color }) => (
                <div
                  key={key}
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
                    {t.values[key]}
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
