export const ACCESSIBILITY_PREFERENCES_COOKIE = "telcobras_a11y";
export const ACCESSIBILITY_PREFERENCES_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ThemePreference = "system" | "light" | "dark";
export type FontSizePreference = "normal" | "large" | "larger" | "largest";
export type LanguagePreference = "es" | "en";

export interface AccessibilityPreferences {
  theme: ThemePreference;
  fontSize: FontSizePreference;
  colorblindMode: boolean;
  language: LanguagePreference;
}

export const DEFAULT_ACCESSIBILITY_PREFERENCES: AccessibilityPreferences = {
  theme: "system",
  fontSize: "normal",
  colorblindMode: false,
  language: "es",
};

const THEMES: ThemePreference[] = ["system", "light", "dark"];
const FONT_SIZES: FontSizePreference[] = ["normal", "large", "larger", "largest"];
const LANGUAGES: LanguagePreference[] = ["es", "en"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return THEMES.some((theme) => theme === value);
}

export function isFontSizePreference(value: unknown): value is FontSizePreference {
  return FONT_SIZES.some((fontSize) => fontSize === value);
}

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return LANGUAGES.some((language) => language === value);
}

export function parseAccessibilityPreferences(value: unknown): AccessibilityPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }

  const preferences = value as Record<string, unknown>;
  return {
    theme: isThemePreference(preferences["theme"])
      ? preferences["theme"]
      : DEFAULT_ACCESSIBILITY_PREFERENCES.theme,
    fontSize: isFontSizePreference(preferences["fontSize"])
      ? preferences["fontSize"]
      : DEFAULT_ACCESSIBILITY_PREFERENCES.fontSize,
    colorblindMode:
      typeof preferences["colorblindMode"] === "boolean"
        ? preferences["colorblindMode"]
        : DEFAULT_ACCESSIBILITY_PREFERENCES.colorblindMode,
    language: isLanguagePreference(preferences["language"])
      ? preferences["language"]
      : DEFAULT_ACCESSIBILITY_PREFERENCES.language,
  };
}

export function readAccessibilityPreferencesCookie(
  cookieHeader: string | undefined,
): AccessibilityPreferences {
  if (!cookieHeader) return DEFAULT_ACCESSIBILITY_PREFERENCES;

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ACCESSIBILITY_PREFERENCES_COOKIE}=`));

  if (!cookie) return DEFAULT_ACCESSIBILITY_PREFERENCES;

  const encodedPreferences = cookie.slice(ACCESSIBILITY_PREFERENCES_COOKIE.length + 1);
  if (encodedPreferences.length > 1024) return DEFAULT_ACCESSIBILITY_PREFERENCES;

  try {
    return parseAccessibilityPreferences(JSON.parse(decodeURIComponent(encodedPreferences)));
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }
}
