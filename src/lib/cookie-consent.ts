export const COOKIE_CONSENT_KEY = "telcobras_cookie_consent";

const OPEN_COOKIE_PREFERENCES_EVENT = "telcobras:open-cookie-preferences";

export type CookieConsentChoice = "accepted" | "rejected" | "configured";

export interface CookieConsent {
  necessary: true;
  nonEssential: boolean;
  choice: CookieConsentChoice;
}

export function readCookieConsent(): CookieConsent | null {
  const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === "object" && value !== null && "nonEssential" in value) {
      const consent = value as Partial<CookieConsent>;
      return {
        necessary: true,
        nonEssential: consent.nonEssential === true,
        choice: consent.choice ?? "configured",
      };
    }
  } catch {
    // Valor corrupto: se trata como si no hubiera consentimiento guardado.
  }
  return null;
}

/** Vuelve a mostrar el banner de cookies con el panel de preferencias abierto. */
export function openCookiePreferences() {
  window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT));
}

export function onOpenCookiePreferences(listener: () => void): () => void {
  window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, listener);
  return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, listener);
}
