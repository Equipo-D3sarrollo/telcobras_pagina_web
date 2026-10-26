import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument } from "@/components/LegalDocument";
import { useAccessibilityPreferences } from "@/lib/accessibility-preferences-context";
import { termsContent } from "@/lib/terms-content";

const SITE_URL = "https://telcobras.com";
const OG_IMAGE =
  "https://vibe.filesafe.space/1790689453956353174/assets/5634ad24-3ed8-4f8d-a4e2-e41b61113a29.png";
const { metaTitle, description } = termsContent.es;

export const Route = createFileRoute("/terminos-de-servicio")({
  head: () => ({
    meta: [
      { title: metaTitle },
      { name: "description", content: description },
      { property: "og:title", content: metaTitle },
      { property: "og:description", content: description },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:url", content: `${SITE_URL}/terminos-de-servicio` },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_CO" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: metaTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/terminos-de-servicio` }],
  }),
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  const { preferences } = useAccessibilityPreferences();
  const language = preferences.language;
  return <LegalDocument copy={termsContent[language]} language={language} idPrefix="terms" />;
}
