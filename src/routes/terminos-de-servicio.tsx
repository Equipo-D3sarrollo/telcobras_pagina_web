import { useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { useAccessibilityPreferences } from "@/lib/accessibility-preferences-context";
import { CONTACT, NIT, RAZON_SOCIAL } from "@/lib/telcobras-data";

const SITE_URL = "https://telcobras.com";
const OG_IMAGE =
  "https://vibe.filesafe.space/1790689453956353174/assets/5634ad24-3ed8-4f8d-a4e2-e41b61113a29.png";

export const Route = createFileRoute("/terminos-de-servicio")({
  head: () => ({
    meta: [
      { title: `Términos Servicio | ${RAZON_SOCIAL}` },
      {
        name: "description",
        content:
          "Términos y condiciones generales de contratación y prestación de servicios de TELCOBRAS S.A.S. en Colombia.",
      },
      { property: "og:title", content: `Términos Servicio | ${RAZON_SOCIAL}` },
      {
        property: "og:description",
        content:
          "Términos y condiciones generales de contratación y prestación de servicios de TELCOBRAS S.A.S. en Colombia.",
      },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:url", content: `${SITE_URL}/terminos-de-servicio` },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_CO" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `Términos Servicio | ${RAZON_SOCIAL}` },
      {
        name: "twitter:description",
        content:
          "Términos y condiciones generales de contratación y prestación de servicios de TELCOBRAS S.A.S. en Colombia.",
      },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/terminos-de-servicio` }],
  }),
  component: TermsOfServicePage,
});

const termsCopy = {
  es: {
    backToHome: "Volver al inicio",
    title: "Términos del Servicio",
    description:
      "Términos y condiciones generales de contratación y prestación de servicios de TELCOBRAS S.A.S.",
    updated: "Fecha de actualización: 21 de octubre de 2026",
    placeholderTitle: "Documento en redacción / Próximamente",
    placeholderText:
      "Estamos preparando el contenido definitivo de los términos y condiciones del servicio. La versión aprobada se publicará en esta misma página.",
    contactText: "Mientras tanto, puedes escribirnos a",
  },
  en: {
    backToHome: "Back to home",
    title: "Terms of Service",
    description:
      "General terms and conditions for contracting and providing TELCOBRAS S.A.S. services.",
    updated: "Last updated: October 21, 2026",
    placeholderTitle: "Document in progress / Coming soon",
    placeholderText:
      "We are preparing the final content of the terms and conditions of service. The approved version will be published on this same page.",
    contactText: "In the meantime, you can write to us at",
  },
} as const;

function TermsOfServicePage() {
  const { preferences } = useAccessibilityPreferences();
  const language = preferences.language;
  const copy = termsCopy[language];
  const linkClass = "font-semibold text-primary underline";
  const backLinkClass =
    "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary underline-offset-4 hover:bg-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  useEffect(() => {
    document.title = `${copy.title} | ${RAZON_SOCIAL}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", copy.description);
  }, [copy.description, copy.title]);

  return (
    <main
      lang={language}
      className="min-h-screen bg-background px-4 py-10 font-sans text-foreground sm:px-6 sm:py-16"
    >
      <article className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10 lg:p-14">
        <Link to="/" className={`mb-8 ${backLinkClass}`}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {copy.backToHome}
        </Link>

        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
            {RAZON_SOCIAL} · NIT {NIT}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">{copy.updated}</p>
        </header>

        <section
          aria-labelledby="terms-placeholder"
          className="rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3">
            <FileText aria-hidden="true" className="h-6 w-6 shrink-0 text-primary" />
            <h2 id="terms-placeholder" className="text-xl font-bold text-foreground sm:text-2xl">
              {copy.placeholderTitle}
            </h2>
          </div>
          <p className="mt-4 leading-relaxed text-card-foreground">{copy.placeholderText}</p>
          <p className="mt-4 leading-relaxed text-card-foreground">
            {copy.contactText}{" "}
            <a className={linkClass} href={CONTACT.emailHref}>
              {CONTACT.emailDisplay}
            </a>
            .
          </p>
        </section>

        <footer className="mt-10 border-t border-border pt-8">
          <Link to="/" className={backLinkClass}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {copy.backToHome}
          </Link>
        </footer>
      </article>
    </main>
  );
}
