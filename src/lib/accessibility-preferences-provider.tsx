import { useState, type ReactNode } from "react";

import {
  ACCESSIBILITY_PREFERENCES_COOKIE,
  ACCESSIBILITY_PREFERENCES_MAX_AGE_SECONDS,
  parseAccessibilityPreferences,
  type AccessibilityPreferences,
} from "@/lib/accessibility-preferences";
import { AccessibilityPreferencesContext } from "@/lib/accessibility-preferences-context";

function applyAccessibilityPreferences(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  root.lang = preferences.language;
  root.dataset["theme"] = preferences.theme;
  root.dataset["fontSize"] = preferences.fontSize;
  root.dataset["colorblindMode"] = String(preferences.colorblindMode);
  root.classList.toggle("dark", preferences.theme === "dark");

  const cookieValue = encodeURIComponent(JSON.stringify(preferences));
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ACCESSIBILITY_PREFERENCES_COOKIE}=${cookieValue}; Path=/; Max-Age=${ACCESSIBILITY_PREFERENCES_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
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
