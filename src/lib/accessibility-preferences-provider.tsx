import { useEffect, useState, type ReactNode } from "react";

import {
  ACCESSIBILITY_PREFERENCES_COOKIE,
  ACCESSIBILITY_PREFERENCES_MAX_AGE_SECONDS,
  htmlLang,
  parseAccessibilityPreferences,
  type AccessibilityPreferences,
} from "@/lib/accessibility-preferences";
import { AccessibilityPreferencesContext } from "@/lib/accessibility-preferences-context";
import { hasNonEssentialConsent, onCookieConsentChange } from "@/lib/cookie-consent";

function applyAccessibilityPreferences(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  root.lang = htmlLang(preferences.language);
  root.dataset["theme"] = preferences.theme;
  root.dataset["fontSize"] = preferences.fontSize;
  root.dataset["colorblindMode"] = String(preferences.colorblindMode);
  root.classList.toggle("dark", preferences.theme === "dark");
  writePreferencesCookie(preferences);
}

// Con cookies opcionales aceptadas la cookie dura un año; si no, es de sesión (se
// borra al cerrar el navegador) y solo sirve para que el SSR respete la elección
// mientras se navega.
function writePreferencesCookie(preferences: AccessibilityPreferences) {
  const cookieValue = encodeURIComponent(JSON.stringify(preferences));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = hasNonEssentialConsent()
    ? `; Max-Age=${ACCESSIBILITY_PREFERENCES_MAX_AGE_SECONDS}`
    : "";
  document.cookie = `${ACCESSIBILITY_PREFERENCES_COOKIE}=${cookieValue}; Path=/${maxAge}; SameSite=Lax${secure}`;
}

function hasPreferencesCookie(): boolean {
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${ACCESSIBILITY_PREFERENCES_COOKIE}=`));
}

export function AccessibilityPreferencesProvider({
  initialPreferences,
  children,
}: {
  initialPreferences: AccessibilityPreferences;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState(() =>
    parseAccessibilityPreferences(initialPreferences),
  );

  // Si cambia la elección de cookies, la cookie ya guardada pasa a persistente o a
  // sesión. Si el usuario nunca cambió sus preferencias, no se crea ninguna.
  useEffect(
    () =>
      onCookieConsentChange(() => {
        if (hasPreferencesCookie()) writePreferencesCookie(preferences);
      }),
    [preferences],
  );

  const updatePreferences = (update: Partial<AccessibilityPreferences>) => {
    const nextPreferences = parseAccessibilityPreferences({ ...preferences, ...update });
    setPreferences(nextPreferences);
    applyAccessibilityPreferences(nextPreferences);
  };

  return (
    <AccessibilityPreferencesContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
}
