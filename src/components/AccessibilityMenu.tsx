import { lazy, Suspense, useState } from "react";
import { Eye } from "lucide-react";

import { useAccessibilityPreferences } from "@/lib/accessibility-preferences-context";
import { getTranslations } from "@/lib/translations";

// Solo el botón forma parte de la carga inicial; el panel se descarga al abrirlo.
const AccessibilityPanel = lazy(() =>
  import("./AccessibilityPanel").then((m) => ({ default: m.AccessibilityPanel })),
);

export function AccessibilityMenu() {
  const { preferences } = useAccessibilityPreferences();
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
        aria-controls={isOpen ? "accessibility-panel" : undefined}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#0A5F8F] p-0 text-white shadow-lg hover:bg-[#084a70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A192F]"
      >
        <Eye aria-hidden="true" className="h-5 w-5" />
      </button>

      {isOpen && (
        <Suspense fallback={null}>
          <AccessibilityPanel />
        </Suspense>
      )}
    </div>
  );
}
