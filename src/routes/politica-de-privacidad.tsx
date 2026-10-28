import { useEffect } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAccessibilityPreferences } from "@/lib/accessibility-preferences-context";
import { htmlLang } from "@/lib/accessibility-preferences";
import { LEGAL_META } from "@/lib/legal-meta";
import { CONTACT, NIT, OG_IMAGE_URL, RAZON_SOCIAL } from "@/lib/telcobras-data";

const SITE_URL = "https://telcobras.com";

export const Route = createFileRoute("/politica-de-privacidad")({
  head: () => ({
    meta: [
      { title: LEGAL_META.privacy.es.metaTitle },
      { name: "description", content: LEGAL_META.privacy.es.description },
      { property: "og:title", content: LEGAL_META.privacy.es.metaTitle },
      { property: "og:description", content: LEGAL_META.privacy.es.description },
      { property: "og:image", content: OG_IMAGE_URL },
      { property: "og:url", content: `${SITE_URL}/politica-de-privacidad` },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_CO" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: LEGAL_META.privacy.es.metaTitle },
      { name: "twitter:description", content: LEGAL_META.privacy.es.description },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/politica-de-privacidad` }],
  }),
  component: PrivacyPolicyPage,
});

const policyCopy = {
  es: {
    backToHome: "Volver al inicio",
    metaTitle: LEGAL_META.privacy.es.metaTitle,
    metaDescription: LEGAL_META.privacy.es.description,
    title: "Política de Privacidad y Tratamiento de Datos Personales",
    description:
      "Política de privacidad y tratamiento de datos personales de TELCOBRAS S.A.S., conforme a la Ley Estatutaria 1581 de 2012 y, cuando corresponda, al RGPD.",
    updated: "Fecha de actualización: 27 de octubre de 2026",
    sections: {
      controller: {
        title: "1. Responsable del tratamiento",
        text: "con domicilio en {address}, Colombia, es responsable del tratamiento de los datos personales descritos en esta política. Para consultas o solicitudes relacionadas con datos personales, puedes escribir a",
      },
      law: {
        title: "2. Normativa aplicable",
        text: "El tratamiento se rige por la Ley Estatutaria 1581 de 2012, sus normas reglamentarias y demás disposiciones colombianas sobre protección de datos personales. Cuando el tratamiento esté dentro de su ámbito de aplicación, también se tendrá en cuenta el Reglamento General de Protección de Datos de la Unión Europea (RGPD).",
      },
      data: {
        title: "3. Datos que podemos tratar",
        text: "Al completar el formulario de contacto podemos tratar nombre, empresa, cargo, correo electrónico, teléfono, servicio de interés, mensaje y constancia de autorización. Cuando utilizas el asistente virtual, el sitio transmite el identificador de sesión y el contenido de los mensajes para gestionar la conversación. El sitio también almacena en tu navegador preferencias de accesibilidad y la elección de cookies.",
      },
      purposes: {
        title: "4. Finalidades y fundamento del tratamiento",
        items: [
          "Atender consultas, solicitudes de cotización y requerimientos comerciales.",
          "Contactarte y preparar una respuesta relacionada con tu solicitud.",
          "Prestar y mantener el funcionamiento del asistente virtual.",
          "Recordar tus preferencias de accesibilidad y la decisión sobre cookies en este dispositivo.",
          "Cumplir obligaciones legales y proteger la seguridad y operación del sitio.",
        ],
        legalBasis:
          "En Colombia, el tratamiento sujeto a autorización se realiza con la autorización informada de la persona, sin perjuicio de las excepciones legales. Cuando resulte aplicable el RGPD, el fundamento se determinará según el caso y podrá incluir consentimiento, medidas precontractuales solicitadas por la persona u otra base jurídica prevista en dicho reglamento.",
      },
      providers: {
        title: "5. Proveedores y transferencias",
        text: "Para operar los servicios descritos, la información puede ser procesada por proveedores tecnológicos que apoyan el almacenamiento de solicitudes y la atención automatizada. El sitio también integra recursos externos como el mapa de Google Maps, que puede recibir datos técnicos de conexión cuando el navegador lo carga (ver sección 6). Para proteger el formulario de contacto contra el uso automatizado se usa Cloudflare Turnstile: al verificar el formulario, Cloudflare recibe datos técnicos del navegador y de la conexión (como la dirección IP y señales del dispositivo). La tipografía se sirve desde el propio sitio. La ubicación de los proveedores y las condiciones aplicables a eventuales transmisiones internacionales deben revisarse conforme a la normativa vigente.",
      },
      cookies: {
        title: "6. Cookies y almacenamiento local",
        text: "Esenciales: el almacenamiento local del navegador guarda tu elección sobre cookies y, solo si usas el chat, un identificador de sesión de la conversación; si cambias las preferencias de apariencia, tamaño de texto, idioma o refuerzo visual, una cookie de sesión las conserva mientras navegas y se borra al cerrar el navegador. Opcionales, solo si las aceptas en el banner: esa cookie de preferencias se conserva hasta un año, y el mapa de ubicación de Google se carga automáticamente (Google puede guardar sus propias cookies; sin aceptarlas, el mapa solo se carga si pulsas «Ver mapa»). Puedes cambiar tu elección en cualquier momento desde «Preferencias de cookies», en el pie de página. Los datos locales se conservan en tu dispositivo hasta que los borres.",
      },
      retention: {
        title: "7. Conservación y seguridad",
        text: "Conservamos los datos personales durante el tiempo necesario para atender la finalidad para la que fueron recopilados y cumplir las obligaciones legales aplicables. El plazo concreto depende del tipo de solicitud y de los deberes legales correspondientes. Aplicamos medidas técnicas y organizativas razonables para proteger la información; ningún medio de transmisión o almacenamiento puede considerarse absolutamente seguro.",
      },
      rights: {
        title: "8. Derechos de las personas",
        colombian:
          "Conforme a la legislación colombiana, puedes conocer, actualizar y rectificar tus datos; solicitar prueba de la autorización cuando sea exigible; preguntar por su uso; presentar quejas ante la Superintendencia de Industria y Comercio, y revocar la autorización o solicitar la supresión cuando sea legalmente procedente.",
        gdpr: "Cuando aplique el RGPD, también podrás ejercer los derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición, así como retirar el consentimiento cuando el tratamiento se base en él y presentar una reclamación ante la autoridad de control competente.",
        contact: "Para ejercer tus derechos o presentar una consulta, escribe a",
        contactFollowup:
          "Las solicitudes se atenderán de acuerdo con los procedimientos y plazos previstos en la normativa aplicable.",
      },
      deletion: {
        title:
          "9. Procedimiento para la Supresión y Eliminación de Datos Personales (Derechos ARCO / Ley 1581 de 2012 y RGPD)",
        intro:
          "De conformidad con la Ley 1581 de 2012 de Colombia y el Reglamento General de Protección de Datos (RGPD), el titular de los datos tiene derecho a solicitar en cualquier momento la eliminación total o parcial de sus datos personales de las bases de datos de TELCOBRAS S.A.S., así como a revocar la autorización otorgada.",
        howTo: "¿Cómo solicitar la eliminación de sus datos?",
        howToDescription:
          "Para ejercer su derecho de supresión, el titular o sus causahabientes deberán enviar una solicitud formal por alguno de los siguientes canales:",
        emailLabel: "Correo electrónico:",
        emailSubject: '(Asunto: "Solicitud de Eliminación de Datos Personales - Habeas Data")',
        addressLabel: "Dirección física:",
        requirementsTitle: "Requisitos de la solicitud:",
        requirements: [
          "Nombre completo, tipo y número de documento de identidad del titular.",
          "Descripción clara y precisa de los datos que desea eliminar o revocar.",
          "Dirección física o correo electrónico al cual desea recibir la respuesta.",
          "En caso de actuar mediante apoderado o representante legal, adjuntar el documento que acredite la representación.",
        ],
        timeframeTitle: "Tiempos de respuesta:",
        timeframe:
          "Conforme al Artículo 15 de la Ley 1581 de 2012, las solicitudes de supresión serán atendidas en un término máximo de quince (15) días hábiles contados a partir de la fecha de su recepción. Si no fuere posible atender la solicitud en dicho término, se informará al interesado los motivos de la demora y la fecha de respuesta, la cual no superará los ocho (8) días hábiles siguientes al vencimiento del primer plazo.",
        exceptionsTitle: "Excepciones a la eliminación:",
        exceptions:
          "La supresión de datos no procederá cuando el titular tenga un deber legal o contractual de permanecer en la base de datos (como la conservación de registros contables, facturación fiscal o cumplimiento de contratos vigentes).",
      },
      changes: {
        title: "10. Cambios a esta política",
        text: "TELCOBRAS S.A.S. podrá actualizar esta política para reflejar cambios legales, operativos o tecnológicos. La versión vigente se publicará en esta página e indicará su fecha de actualización.",
      },
      contact: {
        title: "11. Contacto",
        taxId: "NIT",
      },
    },
  },
  en: {
    backToHome: "Back to home",
    metaTitle: LEGAL_META.privacy.en.metaTitle,
    metaDescription: LEGAL_META.privacy.en.description,
    title: "Privacy Policy and Personal Data Processing",
    description:
      "TELCOBRAS S.A.S. privacy and personal data processing policy under Colombian Statutory Law 1581 of 2012 and, where applicable, the GDPR.",
    updated: "Last updated: October 27, 2026",
    sections: {
      controller: {
        title: "1. Data controller",
        text: "with registered address at {address}, Colombia, is responsible for processing the personal data described in this policy. For questions or requests relating to personal data, you may write to",
      },
      law: {
        title: "2. Applicable law",
        text: "Processing is governed by Colombian Statutory Law 1581 of 2012, its implementing regulations, and other Colombian personal data protection provisions. Where processing falls within its scope, the European Union General Data Protection Regulation (GDPR) will also be taken into account.",
      },
      data: {
        title: "3. Data we may process",
        text: "When you complete the contact form, we may process your name, company, job title, email address, telephone number, service of interest, message, and record of authorization. When you use the virtual assistant, the site transmits the session identifier and message content to manage the conversation. The site also stores accessibility preferences and your cookie choice in your browser.",
      },
      purposes: {
        title: "4. Purposes and legal basis for processing",
        items: [
          "Respond to questions, quote requests, and commercial inquiries.",
          "Contact you and prepare a response related to your request.",
          "Provide and maintain the virtual assistant.",
          "Remember your accessibility preferences and cookie choice on this device.",
          "Meet legal obligations and protect the security and operation of the site.",
        ],
        legalBasis:
          "In Colombia, processing requiring authorization is carried out with the data subject's informed authorization, subject to legal exceptions. Where the GDPR applies, the legal basis will be determined on a case-by-case basis and may include consent, pre-contractual steps requested by the data subject, or another legal basis provided for by that regulation.",
      },
      providers: {
        title: "5. Providers and transfers",
        text: "To operate the services described, information may be processed by technology providers that support request storage and automated assistance. The site also integrates external resources such as the Google Maps map, which may receive technical connection data when your browser loads it (see section 6). To protect the contact form against automated abuse, the site uses Cloudflare Turnstile: when the form is verified, Cloudflare receives technical browser and connection data (such as the IP address and device signals). Fonts are served from the site itself. Provider locations and the conditions applicable to any international transfers must be reviewed in accordance with current law.",
      },
      cookies: {
        title: "6. Cookies and local storage",
        text: "Essential: browser local storage keeps your cookie choice and, only if you use the chat, a conversation session identifier; if you change your appearance, text size, language, or visual enhancement preferences, a session cookie keeps them while you browse and is deleted when you close the browser. Optional, only if you accept them in the banner: that preferences cookie is kept for up to one year, and the Google location map loads automatically (Google may store its own cookies; without accepting them, the map only loads if you click “Show map”). You can change your choice at any time from “Cookie preferences” in the footer. Local data remains on your device until you delete it.",
      },
      retention: {
        title: "7. Retention and security",
        text: "We retain personal data for as long as necessary to fulfill the purpose for which it was collected and to meet applicable legal obligations. The specific period depends on the type of request and the relevant legal duties. We apply reasonable technical and organizational measures to protect information; no means of transmission or storage can be considered absolutely secure.",
      },
      rights: {
        title: "8. Data subject rights",
        colombian:
          "Under Colombian law, you may access, update, and rectify your data; request proof of authorization where required; ask about its use; file complaints with the Superintendence of Industry and Commerce; and withdraw authorization or request deletion where legally permitted.",
        gdpr: "Where the GDPR applies, you may also exercise the rights of access, rectification, erasure, restriction, portability, and objection, withdraw consent where processing is based on it, and lodge a complaint with the competent supervisory authority.",
        contact: "To exercise your rights or submit a question, please email",
        contactFollowup:
          "Requests will be handled according to the procedures and time limits established by applicable law.",
      },
      deletion: {
        title:
          "9. Procedure for Personal Data Erasure & Deletion (ARCO Rights / Law 1581 of 2012 & GDPR)",
        intro:
          "In accordance with Colombian Law 1581 of 2012 and the General Data Protection Regulation (GDPR), data subjects have the right to request the total or partial deletion of their personal data from TELCOBRAS S.A.S. databases at any time, as well as to revoke the consent previously granted.",
        howTo: "How to request data deletion?",
        howToDescription:
          "To exercise your right to erasure, you or your legal representative must submit a formal request through any of the following official channels:",
        emailLabel: "Email:",
        emailSubject: '(Subject: "Personal Data Deletion Request - Habeas Data / GDPR")',
        addressLabel: "Physical Address:",
        requirementsTitle: "Request Requirements:",
        requirements: [
          "Full name and national ID or Passport number of the data subject.",
          "Clear and concise description of the personal data you wish to delete or revoke.",
          "Physical address or email to receive the response notification.",
          "If acting through a legal representative, attach supporting documentation proving legal power.",
        ],
        timeframeTitle: "Response Timeframes:",
        timeframe:
          "Pursuant to Article 15 of Law 1581 of 2012 and GDPR standards, deletion requests will be processed within a maximum of fifteen (15) business days from the date of receipt. If it is not possible to address the request within this timeframe, the applicant will be informed of the delay and given a firm response date, which will not exceed eight (8) additional business days.",
        exceptionsTitle: "Exceptions to Data Deletion:",
        exceptions:
          "Data deletion will not apply when the data subject has a legal or contractual duty to remain in the database (such as tax compliance, accounting records, active service contracts, or legal investigations).",
      },
      changes: {
        title: "10. Changes to this policy",
        text: "TELCOBRAS S.A.S. may update this policy to reflect legal, operational, or technological changes. The current version will be published on this page and will state its update date.",
      },
      contact: {
        title: "11. Contact",
        taxId: "Tax ID",
      },
    },
  },
} as const;

function PrivacyPolicyPage() {
  const { preferences } = useAccessibilityPreferences();
  const language = preferences.language;
  const copy = policyCopy[language];
  const sectionClass = "space-y-3";
  const headingClass = "text-xl font-bold text-foreground";
  const subheadingClass = "text-lg font-semibold text-foreground";
  const linkClass = "font-semibold text-primary underline";

  useEffect(() => {
    document.title = copy.metaTitle;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", copy.metaDescription);
  }, [copy.metaDescription, copy.metaTitle]);

  return (
    <main
      lang={htmlLang(language)}
      className="min-h-screen bg-background px-4 py-10 font-sans text-foreground sm:px-6 sm:py-16"
    >
      <article className="mx-auto max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-10 lg:p-14">
        <Link
          to="/"
          className="mb-8 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary underline-offset-4 hover:bg-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
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

        <div className="space-y-9 leading-relaxed text-card-foreground">
          <section aria-labelledby="policy-controller" className={sectionClass}>
            <h2 id="policy-controller" className={headingClass}>
              {copy.sections.controller.title}
            </h2>
            <p>
              {RAZON_SOCIAL}, {copy.sections.controller.text.replace("{address}", CONTACT.address)}{" "}
              <a className={linkClass} href={CONTACT.emailHref}>
                {CONTACT.emailDisplay}
              </a>
              . {copy.sections.rights.contactFollowup}
            </p>
          </section>

          <section aria-labelledby="policy-law" className={sectionClass}>
            <h2 id="policy-law" className={headingClass}>
              {copy.sections.law.title}
            </h2>
            <p>{copy.sections.law.text}</p>
          </section>

          <section aria-labelledby="policy-data" className={sectionClass}>
            <h2 id="policy-data" className={headingClass}>
              {copy.sections.data.title}
            </h2>
            <p>{copy.sections.data.text}</p>
          </section>

          <section aria-labelledby="policy-purposes" className={sectionClass}>
            <h2 id="policy-purposes" className={headingClass}>
              {copy.sections.purposes.title}
            </h2>
            <ul className="list-disc space-y-2 pl-6">
              {copy.sections.purposes.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>{copy.sections.purposes.legalBasis}</p>
          </section>

          <section aria-labelledby="policy-providers" className={sectionClass}>
            <h2 id="policy-providers" className={headingClass}>
              {copy.sections.providers.title}
            </h2>
            <p>{copy.sections.providers.text}</p>
          </section>

          <section aria-labelledby="policy-cookies" className={sectionClass}>
            <h2 id="policy-cookies" className={headingClass}>
              {copy.sections.cookies.title}
            </h2>
            <p>{copy.sections.cookies.text}</p>
          </section>

          <section aria-labelledby="policy-retention" className={sectionClass}>
            <h2 id="policy-retention" className={headingClass}>
              {copy.sections.retention.title}
            </h2>
            <p>{copy.sections.retention.text}</p>
          </section>

          <section aria-labelledby="policy-rights" className={sectionClass}>
            <h2 id="policy-rights" className={headingClass}>
              {copy.sections.rights.title}
            </h2>
            <p>{copy.sections.rights.colombian}</p>
            <p>{copy.sections.rights.gdpr}</p>
            <p>
              {copy.sections.rights.contact}{" "}
              <a className={linkClass} href={CONTACT.emailHref}>
                {CONTACT.emailDisplay}
              </a>
              .
            </p>
          </section>

          <section
            aria-labelledby="policy-deletion"
            className="space-y-5 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-7"
          >
            <h2 id="policy-deletion" className={headingClass}>
              {copy.sections.deletion.title}
            </h2>
            <p>{copy.sections.deletion.intro}</p>

            <div className={sectionClass}>
              <h3 className={subheadingClass}>{copy.sections.deletion.howTo}</h3>
              <p>{copy.sections.deletion.howToDescription}</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  {copy.sections.deletion.emailLabel}{" "}
                  <a className={linkClass} href={CONTACT.emailHref}>
                    {CONTACT.emailDisplay}
                  </a>{" "}
                  {copy.sections.deletion.emailSubject}
                </li>
                <li>
                  {copy.sections.deletion.addressLabel} {CONTACT.address}
                </li>
              </ul>
            </div>

            <div className={sectionClass}>
              <h3 className={subheadingClass}>{copy.sections.deletion.requirementsTitle}</h3>
              <ol className="list-decimal space-y-2 pl-6">
                {copy.sections.deletion.requirements.map((requirement) => (
                  <li key={requirement}>{requirement}</li>
                ))}
              </ol>
            </div>

            <div className={sectionClass}>
              <h3 className={subheadingClass}>{copy.sections.deletion.timeframeTitle}</h3>
              <p>{copy.sections.deletion.timeframe}</p>
            </div>

            <div className={sectionClass}>
              <h3 className={subheadingClass}>{copy.sections.deletion.exceptionsTitle}</h3>
              <p>{copy.sections.deletion.exceptions}</p>
            </div>
          </section>

          <section aria-labelledby="policy-changes" className={sectionClass}>
            <h2 id="policy-changes" className={headingClass}>
              {copy.sections.changes.title}
            </h2>
            <p>{copy.sections.changes.text}</p>
          </section>

          <section aria-labelledby="policy-contact" className={sectionClass}>
            <h2 id="policy-contact" className={headingClass}>
              {copy.sections.contact.title}
            </h2>
            <address className="not-italic">
              <h3 className="font-semibold text-foreground">{RAZON_SOCIAL}</h3>
              <p>
                {copy.sections.contact.taxId} {NIT}
              </p>
              <p>{CONTACT.address}</p>
              <a className={linkClass} href={CONTACT.emailHref}>
                {CONTACT.emailDisplay}
              </a>
            </address>
          </section>
        </div>

        <div className="mt-10 border-t border-border pt-8">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary underline-offset-4 hover:bg-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {copy.backToHome}
          </Link>
        </div>
      </article>
    </main>
  );
}
