import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { NIT, RAZON_SOCIAL } from "@/lib/telcobras-data";
import type { LegalDocumentCopy } from "@/lib/legal-types";
import { LEGAL_DOCUMENTS_ARE_DRAFT, LEGAL_DRAFT_NOTICE } from "@/lib/legal-status";

const backLinkClass =
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-primary underline-offset-4 hover:bg-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * Página legal compartida (Términos de servicio, SLA). El contenido llega como datos
 * tipados desde src/lib/*-content.ts y se renderiza como texto: no se inserta HTML.
 */
export function LegalDocument({
  copy,
  language,
  idPrefix,
}: {
  copy: LegalDocumentCopy;
  language: "es" | "en";
  idPrefix: string;
}) {
  useEffect(() => {
    document.title = copy.metaTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", copy.description);
  }, [copy.description, copy.metaTitle]);

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

        {LEGAL_DOCUMENTS_ARE_DRAFT && (
          <aside
            aria-labelledby={`${idPrefix}-draft-title`}
            className="mb-8 flex gap-3 rounded-2xl border-2 border-[#F3CB35] bg-[#F3CB35]/15 p-4 text-foreground sm:p-5"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p id={`${idPrefix}-draft-title`} className="font-bold">
                {LEGAL_DRAFT_NOTICE[language].title}
              </p>
              <p className="mt-1 text-sm leading-relaxed">{LEGAL_DRAFT_NOTICE[language].text}</p>
            </div>
          </aside>
        )}

        <header className="mb-10 border-b border-border pb-8">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
            {RAZON_SOCIAL} · NIT {NIT}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">{copy.updated}</p>
          <p className="mt-6 leading-relaxed text-card-foreground">{copy.intro}</p>
        </header>

        <nav aria-label={copy.tocLabel} className="mb-10 rounded-2xl border border-border p-5">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {copy.tocLabel}
          </p>
          <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {copy.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${idPrefix}-${section.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-9 leading-relaxed text-card-foreground">
          {copy.sections.map((section) => {
            const headingId = `${idPrefix}-${section.id}`;
            return (
              <section
                key={section.id}
                aria-labelledby={headingId}
                className={
                  section.highlight
                    ? "scroll-mt-24 space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:p-7"
                    : "scroll-mt-24 space-y-3"
                }
              >
                <h2 id={headingId} className="text-xl font-bold text-foreground">
                  {section.title}
                </h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.items && (
                  <ul className="list-disc space-y-2 pl-6">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.table && (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                      <caption className="sr-only">{section.table.caption}</caption>
                      <thead className="bg-muted/60 text-foreground">
                        <tr>
                          {section.table.headers.map((header) => (
                            <th key={header} scope="col" className="px-4 py-3 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join("|")} className="border-t border-border align-top">
                            {row.map((cell, index) =>
                              index === 0 ? (
                                <th key={cell} scope="row" className="px-4 py-3 font-semibold">
                                  {cell}
                                </th>
                              ) : (
                                <td key={`${index}-${cell}`} className="px-4 py-3">
                                  {cell}
                                </td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {section.notes?.map((note) => (
                  <p key={note} className="text-sm text-muted-foreground">
                    {note}
                  </p>
                ))}
              </section>
            );
          })}
        </div>

        <footer className="mt-10 space-y-6 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            {copy.related.text}{" "}
            {copy.related.links.map((link, index) => (
              <span key={link.to}>
                {index > 0 && " · "}
                <Link to={link.to} className="font-semibold text-primary underline">
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
          <Link to="/" className={backLinkClass}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            {copy.backToHome}
          </Link>
        </footer>
      </article>
    </main>
  );
}
