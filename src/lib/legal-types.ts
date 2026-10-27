export interface LegalTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface LegalSection {
  id: string;
  title: string;
  paragraphs?: string[];
  items?: string[];
  table?: LegalTable;
  notes?: string[];
  highlight?: boolean;
}

export interface LegalDocumentCopy {
  metaTitle: string;
  title: string;
  description: string;
  updated: string;
  intro: string;
  backToHome: string;
  tocLabel: string;
  sections: LegalSection[];
  related: {
    text: string;
    links: { to: "/politica-de-privacidad" | "/terminos-de-servicio" | "/sla"; label: string }[];
  };
}
