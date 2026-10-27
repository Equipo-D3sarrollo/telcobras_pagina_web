import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PRIVACY_POLICY_URL } from "@/lib/telcobras-data";
import { useTranslations } from "@/lib/accessibility-preferences-context";
import {
  COOKIE_CONSENT_KEY,
  onOpenCookiePreferences,
  readCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";

export function CookieBanner() {
  const t = useTranslations().cookieBanner;
  const [isReady, setIsReady] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [allowNonEssential, setAllowNonEssential] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [focusPreferences, setFocusPreferences] = useState(false);
  const nonEssentialRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setIsVisible(window.localStorage.getItem(COOKIE_CONSENT_KEY) === null);
    } catch (error) {
      console.error("No se pudo leer la preferencia de cookies.", error);
      setIsVisible(true);
      setStorageError(true);
    } finally {
      setIsReady(true);
    }
  }, []);

  // El enlace «Preferencias de cookies» del footer vuelve a abrir el panel con la
  // elección guardada y lleva el foco a él.
  useEffect(
    () =>
      onOpenCookiePreferences(() => {
        try {
          setAllowNonEssential(readCookieConsent()?.nonEssential ?? false);
        } catch (error) {
          console.error("No se pudo leer la preferencia de cookies.", error);
          setStorageError(true);
        }
        setIsConfiguring(true);
        setIsVisible(true);
        setFocusPreferences(true);
      }),
    [],
  );

  useEffect(() => {
    if (!focusPreferences || !isVisible || !isConfiguring) return;
    nonEssentialRef.current?.focus();
    setFocusPreferences(false);
  }, [focusPreferences, isVisible, isConfiguring]);

  function saveConsent(choice: CookieConsentChoice, nonEssential: boolean) {
    try {
      window.localStorage.setItem(
        COOKIE_CONSENT_KEY,
        JSON.stringify({ necessary: true, nonEssential, choice }),
      );
      setStorageError(false);
      setIsVisible(false);
    } catch (error) {
      console.error("No se pudo guardar la preferencia de cookies.", error);
      setStorageError(true);
    }
  }

  if (!isReady || !isVisible) return null;

  return (
    <section
      aria-label={t.label}
      className="fixed inset-x-4 bottom-24 z-[70] mx-auto w-auto max-w-3xl rounded-2xl border border-white/15 bg-[#0A192F]/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl sm:inset-x-6 sm:bottom-24 sm:p-5"
    >
      <p className="text-sm leading-relaxed text-slate-100">
        {t.description}{" "}
        <Link
          to={PRIVACY_POLICY_URL}
          className="font-semibold text-[#F3CB35] underline underline-offset-2 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
        >
          {t.privacyLink}
        </Link>
        .
      </p>

      {isConfiguring && (
        <section
          id="cookie-preferences-panel"
          aria-labelledby="cookie-preferences-title"
          className="mt-4 rounded-xl border border-white/15 bg-white/5 p-4"
        >
          <h2 id="cookie-preferences-title" className="text-sm font-bold">
            {t.preferencesTitle}
          </h2>
          <div className="mt-3 space-y-3 text-sm">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked
                disabled
                aria-label={t.essentialCookies}
                className="mt-1 h-4 w-4 accent-[#88BD4C]"
              />
              <span>
                <span className="block font-semibold">{t.essentialCookies}</span>
                <span className="block text-xs text-slate-300">{t.essentialDescription}</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                ref={nonEssentialRef}
                type="checkbox"
                checked={allowNonEssential}
                onChange={(event) => setAllowNonEssential(event.currentTarget.checked)}
                className="mt-1 h-4 w-4 accent-[#88BD4C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
              />
              <span>
                <span className="block font-semibold">{t.nonEssentialCookies}</span>
                <span className="block text-xs text-slate-300">{t.nonEssentialDescription}</span>
              </span>
            </label>
          </div>
        </section>
      )}

      {storageError && (
        <p className="mt-3 text-sm font-semibold text-amber-200" role="alert">
          {t.storageError}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {isConfiguring ? (
          <>
            <button
              type="button"
              onClick={() => setIsConfiguring(false)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white underline underline-offset-2 transition-colors hover:text-[#F3CB35] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
            >
              {t.back}
            </button>
            <button
              type="button"
              onClick={() => saveConsent("configured", allowNonEssential)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#88BD4C] px-4 py-2 text-sm font-bold text-[#0A192F] transition-colors hover:bg-[#a8d97a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
            >
              {t.savePreferences}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => saveConsent("rejected", false)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/50 bg-transparent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
            >
              {t.rejectNonEssential}
            </button>
            <button
              type="button"
              onClick={() => saveConsent("accepted", true)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#88BD4C] px-4 py-2 text-sm font-bold text-[#0A192F] transition-colors hover:bg-[#a8d97a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
            >
              {t.acceptAll}
            </button>
            <button
              type="button"
              aria-expanded={isConfiguring}
              aria-controls="cookie-preferences-panel"
              onClick={() => setIsConfiguring(true)}
              className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-[#F3CB35] underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3CB35]"
            >
              {t.configure}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
