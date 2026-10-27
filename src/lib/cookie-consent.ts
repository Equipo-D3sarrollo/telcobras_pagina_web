export const COOKIE_CONSENT_KEY = "telcobras_cookie_consent";

const OPEN_COOKIE_PREFERENCES_EVENT = "telcobras:open-cookie-preferences";
const COOKIE_CONSENT_CHANGED_EVENT = "telcobras:cookie-consent-changed";

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

/** Guarda la elección (puede lanzar si el almacenamiento falla) y avisa del cambio. */
export function saveCookieConsent(choice: CookieConsentChoice, nonEssential: boolean) {
  const consent: CookieConsent = { necessary: true, nonEssential, choice };
  window.localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event(COOKIE_CONSENT_CHANGED_EVENT));
}

/**
 * `true` solo si el usuario aceptó las cookies opcionales: preferencias persistentes
 * (`telcobras_a11y` de 1 año) y el mapa de Google. Sin decisión guardada es `false`.
 */
export function hasNonEssentialConsent(): boolean {
  try {
    return readCookieConsent()?.nonEssential === true;
  } catch {
    return false;
  }
}

/** Avisa cuando cambia la elección, en esta pestaña o en otra. */
export function onCookieConsentChange(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === COOKIE_CONSENT_KEY) listener();
  };
  window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}
