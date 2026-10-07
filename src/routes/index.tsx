import { createFileRoute } from "@tanstack/react-router";
import { HeaderNav } from "@/components/HeaderNav";
import { HeroAndMetrics } from "@/components/HeroAndMetrics";
import { AboutAndValues } from "@/components/AboutAndValues";
import { ServicesSection } from "@/components/ServicesSection";
import { LetyIaAndWhyUs } from "@/components/LetyIaAndWhyUs";
import { ContactAndFooter } from "@/components/ContactAndFooter";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { CONTACT } from "@/lib/telcobras-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TELCOBRAS S.A.S. | Una nueva forma de entender las redes" },
      {
        name: "description",
        content:
          "El aliado tecnológico de confianza para las empresas en Colombia. Red propia de fibra óptica y radioenlace, ciberseguridad, nube híbrida e Inteligencia Artificial.",
      },
      { property: "og:title", content: "TELCOBRAS S.A.S. | Una nueva forma de entender las redes" },
      {
        property: "og:description",
        content:
          "Soluciones de tecnología, conectividad e IA con infraestructura propia en Cali y cobertura nacional.",
      },
      {
        property: "og:image",
        content:
          "https://vibe.filesafe.space/1790689453956353174/assets/5634ad24-3ed8-4f8d-a4e2-e41b61113a29.png",
      },
      {
        name: "twitter:image",
        content:
          "https://vibe.filesafe.space/1790689453956353174/assets/5634ad24-3ed8-4f8d-a4e2-e41b61113a29.png",
      },
    ],
  }),
  component: TelcobrasLandingPage,
});

function TelcobrasLandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#0087C3] selection:text-white">
      {/* 1. Header & Menú Fijo con logo oficial */}
      <HeaderNav />

      {/* 2 & 3. Hero y Cifras de Impacto */}
      <HeroAndMetrics />

      {/* 4. Quiénes somos + Misión, Visión y Valores */}
      <AboutAndValues />

      {/* 5. Portafolio de 4 Servicios con pestañas y tarjetas interactivas */}
      <ServicesSection />

      {/* 6, 7 & 8. LETY.IA, ¿Por qué TELCOBRAS? y Aliados Estratégicos */}
      <LetyIaAndWhyUs />

      {/* 9 & 10. Formulario de Contacto/Cotización y Pie de Página */}
      <ContactAndFooter />

      {/* Botón flotante "Volver arriba" */}
      <ScrollToTopButton />
    </div>
  );
}
