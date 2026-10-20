import { useState } from "react";
import { Eye, RotateCcw } from "lucide-react";

import {
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  isFontSizePreference,
  isLanguagePreference,
  isThemePreference,
} from "@/lib/accessibility-preferences";
import { useAccessibilityPreferences } from "@/lib/accessibility-preferences-context";
import { AccessibilityPreferencesProvider } from "@/lib/accessibility-preferences-provider";
import { getTranslations } from "@/lib/translations";

export function AccessibilityMenu() {
  const { preferences, updatePreferences } = useAccessibilityPreferences();
  const [isOpen, setIsOpen] = useState(false);
  const copy = getTranslations(preferences.language).accessibility;

  return (
    <div
      className="accessibility-widget fixed bottom-5 left-5 z-[60] flex flex-col-reverse items-start gap-3"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsOpen(false);
          document.getElementById("accessibility-toggle")?.focus();
        }
      }}
    >
      <button
        id="accessibility-toggle"
        type="button"
        aria-label={isOpen ? copy.close : copy.open}
        aria-expanded={isOpen}
        aria-controls="accessibility-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#0A5F8F] p-0 text-white shadow-lg hover:bg-[#084a70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F]"
      >
        <Eye aria-hidden="true" className="h-5 w-5" />
      </button>

      <section
        id="accessibility-panel"
        aria-labelledby="accessibility-panel-title"
        hidden={!isOpen}
        className="accessibility-panel max-h-[min(75vh,36rem)] w-[min(23rem,calc(100vw-2.5rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="accessibility-panel-title" className="text-lg font-bold">
            {copy.title}
          </h2>
          <button
            type="button"
            onClick={() => updatePreferences(DEFAULT_ACCESSIBILITY_PREFERENCES)}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5F8F]"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            {copy.reset}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="accessibility-theme" className="mb-1.5 block text-sm font-semibold">
              {copy.theme}
            </label>
            <select
              id="accessibility-theme"
              value={preferences.theme}
              onChange={(event) => {
                const theme = event.currentTarget.value;
                if (isThemePreference(theme)) updatePreferences({ theme });
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5F8F]"
            >
              <option value="system">{copy.system}</option>
              <option value="light">{copy.light}</option>
              <option value="dark">{copy.dark}</option>
            </select>
          </div>

          <div>
            <label htmlFor="accessibility-font-size" className="mb-1.5 block text-sm font-semibold">
              {copy.fontSize}
            </label>
            <select
              id="accessibility-font-size"
              value={preferences.fontSize}
              onChange={(event) => {
                const fontSize = event.currentTarget.value;
                if (isFontSizePreference(fontSize)) updatePreferences({ fontSize });
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5F8F]"
            >
              <option value="normal">{copy.normal}</option>
              <option value="large">{copy.large}</option>
              <option value="larger">{copy.larger}</option>
              <option value="largest">{copy.largest}</option>
            </select>
          </div>

          <div>
            <label htmlFor="accessibility-language" className="mb-1.5 block text-sm font-semibold">
              {copy.language}
            </label>
            <select
              id="accessibility-language"
              value={preferences.language}
              onChange={(event) => {
                const language = event.currentTarget.value;
                if (isLanguagePreference(language)) updatePreferences({ language });
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5F8F]"
            >
              <option value="es">{copy.spanish}</option>
              <option value="en">{copy.english}</option>
            </select>
          </div>

          <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg py-2 text-sm">
            <input
              type="checkbox"
              checked={preferences.colorblindMode}
              onChange={(event) =>
                updatePreferences({ colorblindMode: event.currentTarget.checked })
              }
              className="mt-0.5 h-4 w-4 accent-[#0A5F8F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A5F8F]"
            />
            <span>
              <span className="block font-semibold">{copy.colorblind}</span>
              <span className="mt-0.5 block text-xs text-slate-600">
                {copy.colorblindDescription}
              </span>
            </span>
          </label>
        </div>
      </section>
    </div>
  );
}
