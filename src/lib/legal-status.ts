import type { LanguagePreference } from "@/lib/accessibility-preferences";

/**
 * Términos de servicio y SLA fueron APROBADOS por gerencia (18-11-2026), por eso es `false`:
 * ya no se muestra el aviso de borrador y las páginas se indexan. Volver a `true` si un
 * texto vuelve a revisión (aviso de borrador no vinculante y `noindex`).
 */
export const LEGAL_DOCUMENTS_ARE_DRAFT = false;

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
