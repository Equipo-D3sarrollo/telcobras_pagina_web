interface BrandGlowBorderProps {
  /** Incluye la luz que recorre el perímetro (false = solo anillo y resplandor). */
  light?: boolean;
}

/* Borde decorativo con colores de marca. Se enciende con data-active="true" en el
   contenedor o con la clase .brand-glow-hover (hover/focus). El contenedor debe ser
   relative y tener border-radius. Estilos en src/styles.css (.brand-glow-*). */
export function BrandGlowBorder({ light = true }: BrandGlowBorderProps) {
  return (
    <>
      <span aria-hidden="true" className="brand-glow-halo" />
      <span aria-hidden="true" className="brand-glow-ring">
        {light && <span className="brand-glow-ring-light" />}
      </span>
    </>
  );
}
