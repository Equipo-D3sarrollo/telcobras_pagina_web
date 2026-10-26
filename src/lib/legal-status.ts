import type { LanguagePreference } from "@/lib/accessibility-preferences";

/**
 * Términos de servicio y SLA están PENDIENTES DE APROBACIÓN de gerencia y revisión
 * jurídica. Mientras sea `true`, ambas páginas muestran un aviso de borrador no
 * vinculante y se marcan `noindex`. Cambiar a `false` cuando se aprueben los textos.
 */
export const LEGAL_DOCUMENTS_ARE_DRAFT = true;

export const LEGAL_DRAFT_NOTICE: Record<LanguagePreference, { title: string; text: string }> = {
  es: {
    title: "Borrador pendiente de aprobación",
    text: "Este documento es una propuesta en revisión y todavía no es vinculante. Las condiciones aplicables son las de la propuesta comercial o el contrato firmado con TELCOBRAS.",
  },
  en: {
    title: "Draft pending approval",
    text: "This document is a proposal under review and is not yet binding. The applicable terms are those in the commercial proposal or the contract signed with TELCOBRAS.",
  },
};

export const LEGAL_DRAFT_META = LEGAL_DOCUMENTS_ARE_DRAFT
  ? [{ name: "robots", content: "noindex, nofollow" }]
  : [];
