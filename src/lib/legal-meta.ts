import { RAZON_SOCIAL } from "@/lib/telcobras-data";

/**
 * Título y descripción (meta) de las páginas legales. Están separados del contenido
 * para que el head() de cada ruta, que va en el chunk principal, no arrastre el texto
 * completo de los documentos (que solo se descarga al abrir su página).
 */
export const LEGAL_META = {
  terms: {
    es: {
      metaTitle: `Términos y condiciones del servicio | ${RAZON_SOCIAL}`,
      description:
        "Términos y condiciones de TELCOBRAS S.A.S. para sus servicios de conectividad, ciberseguridad, nube e inteligencia artificial y para el uso de su sitio web.",
    },
    en: {
      metaTitle: `Terms and Conditions of Service | ${RAZON_SOCIAL}`,
      description:
        "TELCOBRAS S.A.S. terms and conditions for its connectivity, cybersecurity, cloud and artificial intelligence services and for the use of its website.",
    },
  },
  sla: {
    es: {
      metaTitle: `SLA, niveles de servicio y garantías | ${RAZON_SOCIAL}`,
      description:
        "Acuerdo de niveles de servicio (SLA) de TELCOBRAS S.A.S.: disponibilidad, tiempos de atención, mantenimientos, créditos por indisponibilidad y garantías.",
    },
    en: {
      metaTitle: `SLA, Service Levels and Warranties | ${RAZON_SOCIAL}`,
      description:
        "TELCOBRAS S.A.S. service level agreement (SLA): availability, response times, maintenance windows, service credits for downtime and warranties for clients.",
    },
  },
  privacy: {
    es: {
      metaTitle: "Política de privacidad y tratamiento de datos | TELCOBRAS",
      description:
        "Cómo TELCOBRAS S.A.S. trata tus datos personales según la Ley 1581 de 2012 y el RGPD cuando aplica: finalidades, derechos, conservación y cómo ejercerlos.",
    },
    en: {
      metaTitle: "Privacy and personal data processing policy | TELCOBRAS",
      description:
        "How TELCOBRAS S.A.S. processes your personal data under Colombian Law 1581 of 2012 and the GDPR where applicable: purposes, rights, retention and requests.",
    },
  },
} as const;
