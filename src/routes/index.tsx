import { createFileRoute } from "@tanstack/react-router";
import { HeaderNav } from "@/components/HeaderNav";
import { HeroAndMetrics } from "@/components/HeroAndMetrics";
import { AboutAndValues } from "@/components/AboutAndValues";
import { ServicesSection } from "@/components/ServicesSection";
import { LetyIaAndWhyUs } from "@/components/LetyIaAndWhyUs";
import { ContactSection, SiteFooter } from "@/components/ContactAndFooter";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { CONTACT, LOGO_URL, RAZON_SOCIAL, SOCIAL_LINKS } from "@/lib/telcobras-data";

const SITE_URL = "https://telcobras.com";
const OG_IMAGE =
  "https://vibe.filesafe.space/1790689453956353174/assets/5634ad24-3ed8-4f8d-a4e2-e41b61113a29.png";

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: RAZON_SOCIAL,
  url: SITE_URL,
  logo: LOGO_URL,
  telephone: CONTACT.phoneDisplay,
  address: {
    "@type": "PostalAddress",
    streetAddress: CONTACT.address,
    addressLocality: "Cali",
    addressRegion: "Valle del Cauca",
    addressCountry: "CO",
  },
  sameAs: [
    SOCIAL_LINKS.facebook,
    SOCIAL_LINKS.instagram,
    SOCIAL_LINKS.linkedin,
    SOCIAL_LINKS.tiktok,
  ],
};

export const Route = createFileRoute("/")({
  head: () => ({
    // title, description y og/twitter title/description los pone el head raíz desde
    // `metadata` de translations.ts, según el idioma de la cookie.
    meta: [
      { property: "og:image", content: OG_IMAGE },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_CO" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
      { "script:ld+json": ORGANIZATION_JSON_LD },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: TelcobrasLandingPage,
});

function TelcobrasLandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background font-sans text-foreground selection:bg-[#0087C3] selection:text-white">
      {/* 1. Header & Menú Fijo con logo oficial */}
      <HeaderNav />

      <main>
        {/* 2 & 3. Hero y Cifras de Impacto */}
        <HeroAndMetrics />

        {/* 4. Quiénes somos + Misión, Visión y Valores */}
        <AboutAndValues />

        {/* 5. Portafolio de 4 Servicios con pestañas y tarjetas interactivas */}
        <ServicesSection />

        {/* 6, 7 & 8. LETY.IA, ¿Por qué TELCOBRAS? y Aliados Estratégicos */}
        <LetyIaAndWhyUs />

        {/* 9. Formulario de Contacto/Cotización y Ubicación */}
        <ContactSection />
      </main>

      {/* 10. Pie de Página */}
      <SiteFooter />

      {/* Botón flotante "Volver arriba" */}
      <ScrollToTopButton />
    </div>
  );
}
