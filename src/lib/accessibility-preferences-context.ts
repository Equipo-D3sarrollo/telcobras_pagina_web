import { createContext, useContext } from "react";

import type { AccessibilityPreferences } from "@/lib/accessibility-preferences";
import { getTranslations } from "@/lib/translations";

export const AccessibilityPreferencesContext = createContext<{
  preferences: AccessibilityPreferences;
  updatePreferences: (update: Partial<AccessibilityPreferences>) => void;
} | null>(null);

export function useAccessibilityPreferences() {
  const context = useContext(AccessibilityPreferencesContext);
  if (!context) {
    throw new Error("useAccessibilityPreferences requiere AccessibilityPreferencesProvider.");
  }
  return context;
}

export function useTranslations() {
  const { preferences } = useAccessibilityPreferences();
  return getTranslations(preferences.language);
}
