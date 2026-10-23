import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  CALI_PHOTO,
  CONTACT,
  LOGO_URL,
  NIT,
  PRIVACY_POLICY_URL,
  RAZON_SOCIAL,
  SLA_URL,
  SOCIAL_LINKS,
  TERMS_OF_SERVICE_URL,
} from "@/lib/telcobras-data";
import {
  Phone,
  Mail,
  MapPin,
  Send,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Navigation,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Facebook, Instagram, Linkedin, Music2 } from "lucide-react";
import { BrandGlowBorder } from "./BrandGlowBorder";
import { TURNSTILE_SITE_KEY, TurnstileWidget, type TurnstileWidgetHandle } from "./TurnstileWidget";
import {
  useAccessibilityPreferences,
  useTranslations,
} from "@/lib/accessibility-preferences-context";
import { getTranslations } from "@/lib/translations";

const INITIAL_FORM_DATA = {
  nombre: "",
  empresa: "",
  cargo: "",
  correo: "",
  telefono: "",
  servicio: "Conectividad (Fibra & Radioenlace)",
  mensaje: "",
  consentimiento: false,
};

export function ContactAndFooter() {
  const translations = useTranslations();
  const t = translations.contact;
  const turnstileConfigured = TURNSTILE_SITE_KEY.length > 0;
  const { preferences } = useAccessibilityPreferences();
  const languageRef = useRef(preferences.language);
  languageRef.current = preferences.language;
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cada intento de envío sin autorización incrementa el contador: sirve de
  // `key` para reiniciar la animación de alerta aunque ya esté visible.
  const [consentAttempts, setConsentAttempts] = useState(0);
  const consentCheckboxRef = useRef<HTMLInputElement>(null);
  const showConsentAlert = consentAttempts > 0 && !formData.consentimiento;

  // Tras un intento fallido, lleva la casilla al centro de la pantalla y le da
  // foco (después del render, porque el `key` remonta el input).
  useEffect(() => {
    if (consentAttempts === 0) return;
    const checkbox = consentCheckboxRef.current;
    if (!checkbox) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    checkbox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    checkbox.focus({ preventScroll: true });
  }, [consentAttempts]);

  // Solo decorativo: pausa la animación de la red de fondo cuando la sección sale
  // del viewport. Arranca visible y solo se pausa cuando el observer lo confirma
  // (mismo criterio que WhyUsSection; SSR seguro, sin depender de window).
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setIsInView(entry.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const labelClass = "mb-2 block text-sm font-semibold text-slate-200";
  const fieldIconClass =
    "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#0087C3]";
  const fieldClass =
    "h-12 w-full rounded-xl border border-white/15 bg-white/5 pl-10 pr-3 text-sm text-white placeholder:text-slate-400 transition-colors focus:border-[#0087C3] focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0087C3]/70 focus:shadow-[0_0_0_4px_rgba(0,135,195,0.18)]";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!turnstileConfigured) {
      toast.error(t.formUnavailableTitle, {
        description: t.formUnavailableDescription.replace("{email}", CONTACT.emailDisplay),
      });
      return;
    }
    const websiteField = new FormData(e.currentTarget).get("sitio_web");
    if (typeof websiteField === "string" && websiteField.trim()) return;
    if (!formData.nombre || !formData.correo || !formData.telefono) {
      toast.error(t.requiredError);
      return;
    }
    if (!formData.consentimiento) {
      setConsentAttempts((n) => n + 1);
      toast.warning(t.consentWarning, {
        description: t.consentWarningDescription,
      });
      return;
    }
    if (!turnstileToken) {
      toast.error(
        preferences.language === "en"
          ? "Please complete the security verification."
          : "Por favor complete la verificación de seguridad.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contacto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...formData,
          turnstile_token: turnstileToken,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        turnstileRef.current?.reset();
        setTurnstileToken("");

        if (response.status === 429) {
          toast.error(
            preferences.language === "en"
              ? "Too many requests. Please wait a few minutes before trying again."
              : "Has realizado demasiados intentos. Por favor espera unos minutos antes de volver a intentar.",
          );
          return;
        }

        if (errorData?.error === "contacto_unavailable") {
          toast.error(t.formUnavailableTitle, {
            description: t.formUnavailableDescription.replace("{email}", CONTACT.emailDisplay),
          });
          return;
        }

        if (errorData?.error === "turnstile_verification_failed") {
          toast.error(
            preferences.language === "en"
              ? "Security verification failed. Please try again."
              : "La verificación de seguridad falló. Por favor intente nuevamente.",
          );
          return;
        }

        throw new Error(`El servidor respondió con estado ${response.status}.`);
      }

      setFormData(INITIAL_FORM_DATA);
      setConsentAttempts(0);
      setTurnstileToken("");
      turnstileRef.current?.reset();
      setFormSubmitted(true);
      toast.success(getTranslations(languageRef.current).contact.successTitle);
    } catch (error) {
      console.error("Falló el envío de la solicitud de contacto.", error);
      turnstileRef.current?.reset();
      setTurnstileToken("");
      toast.error(
        getTranslations(languageRef.current).contact.submissionError.replace(
          "{email}",
          CONTACT.emailDisplay,
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 9. CONTACTO Y FORMULARIO */}
      <section
        ref={sectionRef}
        id="contacto"
        data-animations-paused={!isInView}
        className="py-20 md:py-28 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 z-0 opacity-15">
          <img
            src={CALI_PHOTO}
            alt=""
            width={1200}
            height={800}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Red decorativa de fondo: nodos y enlaces de marca con pulso lento. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full opacity-60"
          >
            <defs>
              <linearGradient id="contact-network-line" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0087C3" stopOpacity="0.55" />
                <stop offset="55%" stopColor="#88BD4C" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#F3CB35" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <g stroke="url(#contact-network-line)" strokeWidth="1.25" fill="none">
              <path d="M120 140 L360 90 L600 170 L900 110 L1080 260" />
              <path d="M120 140 L200 520 L520 600 L860 540 L1120 640" />
              <path d="M360 90 L200 520" />
              <path d="M600 170 L520 600" />
              <path d="M900 110 L860 540" />
              <path d="M1080 260 L1120 640" />
              <path d="M600 170 L700 360 L900 110" />
            </g>
            <g
              className="network-flow"
              stroke="#ffffff"
              strokeOpacity="0.5"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            >
              <path pathLength={100} d="M120 140 L360 90 L600 170 L900 110 L1080 260" />
              <path
                pathLength={100}
                className="network-flow--delayed"
                d="M200 520 L520 600 L860 540 L1120 640"
              />
            </g>
            <g fill="#0087C3">
              <circle className="contact-node-pulse" cx="360" cy="90" r="4" />
              <circle
                className="contact-node-pulse"
                cx="900"
                cy="110"
                r="4"
                style={{ animationDelay: "1.2s" }}
              />
              <circle
                className="contact-node-pulse"
                cx="520"
                cy="600"
                r="4"
                style={{ animationDelay: "2.4s" }}
              />
              <circle
                className="contact-node-pulse"
                cx="1120"
                cy="640"
                r="4"
                style={{ animationDelay: "3.6s" }}
              />
            </g>
            <g fill="#88BD4C">
              <circle
                className="contact-node-pulse"
                cx="600"
                cy="170"
                r="3.5"
                style={{ animationDelay: "0.6s" }}
              />
              <circle
                className="contact-node-pulse"
                cx="200"
                cy="520"
                r="3.5"
                style={{ animationDelay: "1.8s" }}
              />
              <circle
                className="contact-node-pulse"
                cx="860"
                cy="540"
                r="3.5"
                style={{ animationDelay: "3s" }}
              />
            </g>
            <g fill="#F3CB35">
              <circle
                className="contact-node-pulse"
                cx="1080"
                cy="260"
                r="3.5"
                style={{ animationDelay: "2s" }}
              />
            </g>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Contact Info */}
            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="px-3 py-1 rounded-full bg-[#88BD4C]/20 text-[#88BD4C] text-xs font-extrabold uppercase tracking-wider">
                  {t.badge}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-3">
                  {t.title}{" "}
                  <span className="bg-gradient-to-r from-[var(--brand-gradient-blue)] via-[var(--brand-gradient-green)] to-[var(--brand-gradient-yellow)] bg-clip-text text-transparent">
                    {t.titleHighlight}
                  </span>
                </h2>
                <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
                  {t.description}
                </p>
              </div>

              <div className="space-y-4">
                <div className="brand-glow-hover relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20 focus-within:border-white/20">
                  <BrandGlowBorder light={false} />
                  <div className="relative p-3 rounded-xl bg-[#0087C3] text-white shadow-lg shadow-[#0087C3]/30">
                    <Phone aria-hidden="true" className="w-5 h-5" />
                  </div>
                  <div className="relative">
                    <p className="text-xs font-bold text-slate-400 uppercase">{t.phone}</p>
                    <a
                      href={CONTACT.phoneHref}
                      className="rounded text-base font-bold text-white transition-colors hover:text-[#88BD4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#88BD4C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A192F]"
                    >
                      {CONTACT.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="brand-glow-hover relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20 focus-within:border-white/20">
                  <BrandGlowBorder light={false} />
                  <div className="relative p-3 rounded-xl bg-[#88BD4C] text-slate-950 shadow-lg shadow-[#88BD4C]/30">
                    <Mail aria-hidden="true" className="w-5 h-5" />
                  </div>
                  <div className="relative">
                    <p className="text-xs font-bold text-slate-400 uppercase">{t.email}</p>
                    <a
                      href={CONTACT.emailHref}
                      className="rounded text-base font-bold text-white transition-colors hover:text-[#88BD4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#88BD4C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A192F]"
                    >
                      {CONTACT.emailDisplay}
                    </a>
                  </div>
                </div>

                <div className="brand-glow-hover relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20">
                  <BrandGlowBorder light={false} />
                  <div className="relative p-3 rounded-xl bg-[#F3CB35] text-slate-950 shadow-lg shadow-[#F3CB35]/30">
                    <MapPin aria-hidden="true" className="w-5 h-5" />
                  </div>
                  <div className="relative">
                    <p className="text-xs font-bold text-slate-400 uppercase">{t.address}</p>
                    <p className="text-sm font-bold text-white">{t.streetAddress}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  {t.socialTitle}
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={SOCIAL_LINKS.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.socialLabels.facebook}
                    className="rounded-xl border border-white/15 bg-white/10 p-2.5 text-white transition-all hover:border-[#006BA4] hover:bg-[#006BA4] hover:shadow-lg hover:shadow-[#0087C3]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0087C3]/40 motion-safe:hover:-translate-y-0.5"
                  >
                    <Facebook aria-hidden="true" className="w-5 h-5" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.socialLabels.instagram}
                    className="rounded-xl border border-white/15 bg-white/10 p-2.5 text-white transition-all hover:border-[#006BA4] hover:bg-[#006BA4] hover:shadow-lg hover:shadow-[#0087C3]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0087C3]/40 motion-safe:hover:-translate-y-0.5"
                  >
                    <Instagram aria-hidden="true" className="w-5 h-5" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.socialLabels.linkedin}
                    className="rounded-xl border border-white/15 bg-white/10 p-2.5 text-white transition-all hover:border-[#006BA4] hover:bg-[#006BA4] hover:shadow-lg hover:shadow-[#0087C3]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0087C3]/40 motion-safe:hover:-translate-y-0.5"
                  >
                    <Linkedin aria-hidden="true" className="w-5 h-5" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.socialLabels.tiktok}
                    className="rounded-xl border border-white/15 bg-white/10 p-2.5 text-white transition-all hover:border-[#006BA4] hover:bg-[#006BA4] hover:shadow-lg hover:shadow-[#0087C3]/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0087C3]/40 motion-safe:hover:-translate-y-0.5"
                  >
                    <Music2 aria-hidden="true" className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="brand-glow-always relative rounded-3xl border border-white/10 bg-[#0A192F]/60 p-6 text-white shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
                <BrandGlowBorder light={false} />
                {formSubmitted ? (
                  <div className="relative text-center py-12 space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
                      <CheckCircle2 aria-hidden="true" className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-white">{t.successTitle}</h3>
                    <p className="mx-auto max-w-md text-sm text-slate-300">
                      {t.successDescription}
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormSubmitted(false)}
                      className="rounded-full bg-gradient-to-r from-[#0087C3] to-[#88BD4C] px-6 py-2.5 text-xs font-extrabold text-[#04121f] shadow-lg shadow-[#0087C3]/25 transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0087C3]/40"
                    >
                      {t.successAnother}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="relative space-y-5">
                    <div>
                      <h3 className="text-xl font-black text-white sm:text-2xl">{t.formTitle}</h3>
                      <p className="mt-1 text-xs text-slate-300 sm:text-sm">{t.formDescription}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass} htmlFor="contact-name">
                          {t.name}
                        </label>
                        <div className="group relative">
                          <User aria-hidden="true" className={fieldIconClass} />
                          <input
                            id="contact-name"
                            type="text"
                            maxLength={100}
                            required
                            placeholder={t.namePlaceholder}
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="contact-company">
                          {t.company}
                        </label>
                        <div className="group relative">
                          <Building2 aria-hidden="true" className={fieldIconClass} />
                          <input
                            id="contact-company"
                            type="text"
                            maxLength={100}
                            placeholder={t.companyPlaceholder}
                            value={formData.empresa}
                            onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass} htmlFor="contact-position">
                          {t.position}
                        </label>
                        <div className="group relative">
                          <Briefcase aria-hidden="true" className={fieldIconClass} />
                          <input
                            id="contact-position"
                            type="text"
                            maxLength={100}
                            placeholder={t.positionPlaceholder}
                            value={formData.cargo}
                            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="contact-email">
                          {t.emailLabel}
                        </label>
                        <div className="group relative">
                          <Mail aria-hidden="true" className={fieldIconClass} />
                          <input
                            id="contact-email"
                            type="email"
                            maxLength={200}
                            required
                            placeholder={t.emailPlaceholder}
                            value={formData.correo}
                            onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass} htmlFor="contact-phone">
                          {t.phoneLabel}
                        </label>
                        <div className="group relative">
                          <Phone aria-hidden="true" className={fieldIconClass} />
                          <input
                            id="contact-phone"
                            type="tel"
                            maxLength={20}
                            required
                            placeholder={t.phonePlaceholder}
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="contact-service">
                          {t.service}
                        </label>
                        <div className="relative">
                          <select
                            id="contact-service"
                            value={formData.servicio}
                            onChange={(e) => setFormData({ ...formData, servicio: e.target.value })}
                            className="h-12 w-full appearance-none rounded-xl border border-white/15 bg-white/5 pl-3 pr-10 text-sm text-white transition-colors focus:border-[#0087C3] focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0087C3]/70 focus:shadow-[0_0_0_4px_rgba(0,135,195,0.18)] [&>option]:bg-[#0A192F] [&>option]:text-white"
                          >
                            {t.serviceOptions.map(({ value, label }) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            aria-hidden="true"
                            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelClass} htmlFor="contact-details">
                        {t.details}
                      </label>
                      <textarea
                        id="contact-details"
                        rows={3}
                        maxLength={2000}
                        placeholder={t.detailsPlaceholder}
                        value={formData.mensaje}
                        onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                        className="min-h-[96px] w-full rounded-xl border border-white/15 bg-white/5 p-3.5 text-sm text-white placeholder:text-slate-400 transition-colors focus:border-[#0087C3] focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#0087C3]/70 focus:shadow-[0_0_0_4px_rgba(0,135,195,0.18)]"
                      />
                    </div>

                    <input
                      type="text"
                      name="sitio_web"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      style={{ position: "absolute", left: "-9999px" }}
                    />

                    <div>
                      <div
                        className={`relative flex items-start gap-3 rounded-xl border p-3 text-xs leading-relaxed transition-colors duration-300 ${
                          showConsentAlert
                            ? "consent-alert border-[#F3CB35] bg-[#F3CB35]/10 text-white"
                            : formData.consentimiento && consentAttempts > 0
                              ? "border-[#88BD4C]/60 bg-[#88BD4C]/10 text-slate-200"
                              : "border-transparent text-slate-300"
                        }`}
                      >
                        {showConsentAlert && (
                          <span
                            aria-hidden="true"
                            className="consent-pointer absolute -top-3 left-1 rounded-full bg-[#F3CB35] px-2 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wider text-[#04121f] shadow-lg shadow-[#F3CB35]/40"
                          >
                            {t.consentPointer}
                          </span>
                        )}
                        <input
                          id="contact-consent"
                          ref={consentCheckboxRef}
                          type="checkbox"
                          checked={formData.consentimiento}
                          aria-invalid={showConsentAlert}
                          aria-describedby={showConsentAlert ? "consent-message" : undefined}
                          onChange={(e) =>
                            setFormData({ ...formData, consentimiento: e.target.checked })
                          }
                          className={`mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/30 bg-white/5 accent-[#88BD4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0087C3]/70 ${
                            showConsentAlert
                              ? "ring-2 ring-[#F3CB35] ring-offset-2 ring-offset-[#0A192F]"
                              : ""
                          }`}
                        />
                        <div>
                          <label className="cursor-pointer" htmlFor="contact-consent">
                            {t.consent}
                          </label>{" "}
                          <Link
                            to={PRIVACY_POLICY_URL}
                            className="font-semibold text-[#88BD4C] underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
                          >
                            [{t.privacyLinkLabel}]
                          </Link>
                        </div>
                      </div>

                      {showConsentAlert ? (
                        <p
                          id="consent-message"
                          role="alert"
                          className="consent-message mt-2 flex items-start gap-2 text-xs font-semibold text-[#F3CB35]"
                        >
                          <ShieldAlert aria-hidden="true" className="mt-px h-4 w-4 shrink-0" />
                          <span>{t.consentError}</span>
                        </p>
                      ) : (
                        formData.consentimiento &&
                        consentAttempts > 0 && (
                          <p
                            role="status"
                            className="consent-message mt-2 flex items-center gap-2 text-xs font-semibold text-[#88BD4C]"
                          >
                            <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
                            {t.consentSuccess}
                          </p>
                        )
                      )}
                    </div>

                    {turnstileConfigured ? (
                      <TurnstileWidget
                        ref={turnstileRef}
                        theme={preferences.theme === "light" ? "light" : "dark"}
                        onSuccess={(token) => setTurnstileToken(token)}
                        onError={() => setTurnstileToken("")}
                        onExpire={() => setTurnstileToken("")}
                      />
                    ) : (
                      <div
                        role="alert"
                        className="rounded-xl border border-[#F3CB35]/40 bg-[#F3CB35]/10 p-4 text-sm text-slate-200"
                      >
                        <p className="font-semibold text-[#F3CB35]">{t.formUnavailableTitle}</p>
                        <p className="mt-1 leading-relaxed">
                          {t.formUnavailableDescription.replace("{email}", CONTACT.emailDisplay)}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !turnstileConfigured}
                      className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0087C3] via-[#39a86f] to-[#88BD4C] text-sm font-extrabold text-[#04121f] shadow-lg shadow-[#0087C3]/25 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-[#88BD4C]/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#0087C3]/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2
                            aria-hidden="true"
                            className="w-4 h-4 motion-safe:animate-spin"
                          />
                          {t.submitting}
                        </>
                      ) : (
                        <>
                          <Send
                            aria-hidden="true"
                            className="w-4 h-4 transition-transform duration-300 motion-safe:group-hover:translate-x-1"
                          />
                          {t.submit}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ¿DÓNDE ESTAMOS? */}
      <section id="ubicacion" className="py-20 md:py-28 bg-white relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <svg
            focusable="false"
            viewBox="0 0 1440 760"
            preserveAspectRatio="xMidYMid slice"
            className="h-full w-full"
          >
            <defs>
              <linearGradient id="location-network-line" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0087C3" stopOpacity="0.12" />
                <stop offset="55%" stopColor="#88BD4C" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#0087C3" stopOpacity="0.1" />
              </linearGradient>
              <radialGradient id="location-node-glow">
                <stop offset="0%" stopColor="#0087C3" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0087C3" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g
              fill="none"
              stroke="url(#location-network-line)"
              strokeWidth="1.5"
              strokeDasharray="3 8"
            >
              <path d="M-40 180 180 110 370 230 570 130 760 220 980 110 1190 210 1480 100" />
              <path d="M-30 610 180 500 370 620 570 500 760 610 980 490 1190 610 1470 480" />
              <path d="M180 110 180 500M370 230 370 620M570 130 570 500M760 220 760 610M980 110 980 490M1190 210 1190 610" />
              <path d="M370 230 570 500 760 220 980 490 1190 210" />
            </g>
            <g fill="url(#location-node-glow)">
              <circle cx="180" cy="110" r="34" />
              <circle cx="570" cy="130" r="34" />
              <circle cx="980" cy="110" r="34" />
              <circle cx="370" cy="620" r="34" />
              <circle cx="760" cy="610" r="34" />
              <circle cx="1190" cy="610" r="34" />
            </g>
            <g fill="#0087C3" opacity="0.48">
              <circle className="contact-node-pulse" cx="180" cy="110" r="3" />
              <circle className="contact-node-pulse" cx="570" cy="130" r="3" />
              <circle className="contact-node-pulse" cx="980" cy="110" r="3" />
              <circle className="contact-node-pulse" cx="370" cy="620" r="3" />
              <circle className="contact-node-pulse" cx="760" cy="610" r="3" />
              <circle className="contact-node-pulse" cx="1190" cy="610" r="3" />
            </g>
            <g fill="white" stroke="#88BD4C" strokeOpacity="0.45" strokeWidth="1.5">
              <circle cx="370" cy="230" r="4" />
              <circle cx="760" cy="220" r="4" />
              <circle cx="1190" cy="210" r="4" />
              <circle cx="180" cy="500" r="4" />
              <circle cx="570" cy="500" r="4" />
              <circle cx="980" cy="490" r="4" />
            </g>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 space-y-3">
            <span className="inline-flex px-3 py-1 rounded-full bg-[#0087C3]/10 text-[#0087C3] text-xs font-extrabold uppercase tracking-wider">
              {t.findUs}
            </span>
            <h2 className="bg-gradient-to-r from-[var(--brand-gradient-blue)] via-[var(--brand-gradient-green)] to-[var(--brand-gradient-yellow)] bg-clip-text text-3xl sm:text-4xl font-black text-transparent tracking-tight">
              {t.locationTitle}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
              {t.locationDescription}
            </p>
            <div className="inline-flex items-center gap-2 text-slate-700 text-sm font-bold">
              <MapPin className="w-4 h-4 text-[#88BD4C]" />
              {t.streetAddress}
            </div>
          </div>

          <div className="location-map-frame rounded-3xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/60">
            <iframe
              title={t.mapTitle}
              src="https://www.google.com/maps?q=Carrera+83A+%23+20+-+20,+Cali,+Colombia&output=embed"
              width="100%"
              height="400"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-[300px] md:h-[400px] w-full block"
            />
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Carrera+83A+%23+20+-+20,+Cali,+Colombia"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold text-white bg-[#006BA4] hover:bg-[#005888] shadow-md shadow-sky-500/20 transition-all transform hover:-translate-y-0.5"
            >
              <Navigation className="w-4 h-4 mr-2" /> {t.directions}
            </a>
          </div>
        </div>
      </section>

      {/* 10. PIE DE PÁGINA */}
      <footer className="bg-[#0A192F] text-slate-400 border-t border-slate-800 pt-12 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            {/* Logo oficial transparente sobre fondo oscuro */}
            <div className="inline-flex items-center">
              <img
                src={LOGO_URL}
                alt={t.logoAlt}
                width={160}
                height={48}
                className="h-12 w-auto object-contain"
              />
            </div>

            <div className="text-center md:text-right">
              <p className="text-xs sm:text-sm font-extrabold text-white tracking-widest uppercase">
                {t.footerTagline}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t.copyright
                  .replace("{company}", RAZON_SOCIAL)
                  .replace("{nit}", NIT)
                  .replace("{year}", String(new Date().getFullYear()))}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-6 text-xs text-slate-400 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <address className="not-italic">{t.streetAddress}</address>
            <nav aria-label={t.socialTitle} className="flex items-center gap-3">
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.socialLabels.facebook}
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
              >
                <Facebook aria-hidden="true" className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.socialLabels.instagram}
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
              >
                <Instagram aria-hidden="true" className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.socialLabels.linkedin}
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
              >
                <Linkedin aria-hidden="true" className="h-5 w-5" />
              </a>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.socialLabels.tiktok}
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
              >
                <Music2 aria-hidden="true" className="h-5 w-5" />
              </a>
            </nav>
            <nav
              aria-label={t.legalLinksLabel}
              className="flex flex-wrap gap-x-6 gap-y-3 sm:ml-auto"
            >
              <Link to={TERMS_OF_SERVICE_URL} className="hover:text-white transition-colors">
                {t.terms}
              </Link>
              <Link to={PRIVACY_POLICY_URL} className="hover:text-white transition-colors">
                {t.privacy}
              </Link>
              <Link to={SLA_URL} className="hover:text-white transition-colors">
                {t.sla}
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
