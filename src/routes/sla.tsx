import { createFileRoute } from "@tanstack/react-router";
import { LegalDocument } from "@/components/LegalDocument";
import { OG_IMAGE_URL } from "@/lib/telcobras-data";
import { LEGAL_DRAFT_META } from "@/lib/legal-status";
import { useAccessibilityPreferences } from "@/lib/accessibility-preferences-context";
import { slaContent } from "@/lib/sla-content";

const SITE_URL = "https://telcobras.com";
const { metaTitle, description } = slaContent.es;

export const Route = createFileRoute("/sla")({
  head: () => ({
    meta: [
      { title: metaTitle },
      { name: "description", content: description },
      { property: "og:title", content: metaTitle },
      { property: "og:description", content: description },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:url", content: `${SITE_URL}/sla` },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_CO" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: metaTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE_URL },
      ...LEGAL_DRAFT_META,
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sla` }],
  }),
  component: SlaPage,
});

function SlaPage() {
  const { preferences } = useAccessibilityPreferences();
  const language = preferences.language;
  return <LegalDocument copy={slaContent[language]} language={language} idPrefix="sla" />;
}
