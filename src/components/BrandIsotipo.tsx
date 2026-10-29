import { useId } from "react";

/*
 * Isotipo de TELCOBRAS (las tres velas), vectorizado a partir de public/images/logo.png y
 * dibujado en línea para poder animar cada vela. Es decorativo (el eslogan que lo acompaña
 * da el contexto), por eso va oculto a lectores de pantalla. Las velas se ven siempre con su
 * color; detrás de cada una hay una copia con halo cuya opacidad se anima en secuencia
 * verde → amarillo → azul (.brand-isotipo-glow* en styles.css; solo cambia la opacidad, el
 * desenfoque del halo es un filtro estático).
 */
const VELAS = [
  {
    key: "verde",
    color: "#1dab66",
    d: "M3.6 115.6C1.1 114.8 1.2 113.3 4.7 95.9C6.1 88.4 6.9 83.4 7.5 78.3C7.6 76.8 7.8 74.4 8 72.9C8.2 71.4 8.3 69.9 8.4 69.7C8.8 64.9 9 51.1 8.7 43.3C8.4 35.9 8.3 35 8 31.2C7.8 29.1 7.5 26.4 7.4 25.3C7.4 24.1 7.1 21.9 6.9 20.5C6.7 19 6.3 16.5 6.1 15.1C5.6 11.6 5.3 10 4.8 7.2C4 3.2 4.1 2.4 5.3 2C6.5 1.6 7.8 2.7 11.2 6.8C13 8.9 14.2 10.2 15.6 11.6C16.1 12.2 17.8 14 19.3 15.6C24.8 21.5 28 24.9 31.2 28.2C37.4 34.5 38.1 35.5 39.7 38.5C41.2 41.6 41.9 44 42.6 48.7C42.8 50.4 43 50.9 44.3 52.3C45.3 53.4 45.4 65.7 44.5 68.7C44 70.2 44 70 44 75.8C43.9 81.5 44 81.2 43.3 82.8C43.1 83.4 43.1 83.5 43 86.2C42.9 88.9 42.9 89 42.7 89.7C42.2 91 42 91.7 41.9 93C41.8 94 41.8 94.3 41.5 95C41.3 95.4 41 96.1 40.9 96.6C40.6 97.7 39.7 99.5 39 100.4C38.7 100.8 38.2 101.6 37.9 102.1C37.2 103.3 35.5 105 34.5 105.6C34.2 105.8 33.4 106.2 32.8 106.6C31.5 107.4 29.7 108.4 29.6 108.5C29.5 108.5 29.5 108.3 29.6 107.8C30.1 105.8 29.5 105.7 26.3 107.2C22.3 109 16.2 111.5 9.7 114C5.2 115.6 4.4 115.9 3.6 115.6Z",
  },
  {
    key: "azul",
    color: "#0087c3",
    d: "M56.7 106.6C56.1 106.3 55.9 101.4 56.5 99.6C56.9 98 57 97.8 57.1 96.5C57.2 95.8 57.3 94.9 57.4 94.4C57.9 92.8 58 92.3 58.1 90.9C58.2 90.1 58.3 89.1 58.4 88.7C58.5 88.3 58.7 87.7 58.8 87.3C58.9 86.9 59 86 59.1 85.2C59.2 84.4 59.3 83.3 59.5 82.7C60 80.3 60 80.1 59.4 78.1C59.4 77.7 59.2 76.9 59.1 76.1C58.9 75.1 58.8 74.5 58.4 73.5C57.7 71.6 57.6 71.5 56.9 70.2C56 68.6 55.8 68.4 54.2 66.7C52.3 64.7 52.3 64.5 52 62.2C51.9 61.2 51.8 60.3 51.7 60.1C51.7 59.7 51.7 59.7 52.2 60C52.7 60.4 53.2 60.4 53.5 60.1C53.8 59.7 53.8 59.4 52.9 50.4C52.8 49.6 52.6 48.6 52.5 48.2C51.7 44.7 53.3 44.8 56.2 48.2C57.7 50 60.9 53.6 65.8 59C77.2 71.6 77.7 72.4 76.9 79.9C76.8 80.7 76.6 82.4 76.5 83.6C76 89.4 75.2 92.3 73.4 95C71.5 97.8 70.3 98.7 60.3 104.4C58.3 105.5 57.7 105.9 57.4 106.4C57.3 106.7 57 106.8 56.7 106.6Z",
  },
  {
    key: "amarillo",
    color: "#f3cf28",
    d: "M25.9 127.3C23.6 126.6 23.7 125.6 27.2 115.2C30.9 104 30.5 105 32.2 103.9C33.7 102.9 35.3 101.3 35.9 100.1C36.2 99.6 36.7 98.9 37 98.5C37.8 97.6 38.6 95.9 39 94.4C39.2 93.8 39.5 93 39.6 92.6C39.8 92.2 39.9 91.7 40 90.8C40.1 89.5 40.2 89.2 40.7 87.9C40.9 87.2 40.9 87.1 41 84.5C41.1 81.9 41.1 81.9 41.5 80.6C41.9 79.3 41.9 79.3 42 73.8C42.1 67.7 42 68.5 42.7 66C42.9 65.3 42.9 64.9 43 59.4C43.1 50.6 42.7 50.7 49.2 57.2C52.1 60.1 53.6 61.7 54 62.3C54.3 62.7 55 63.5 55.5 64.1C56.1 64.7 56.7 65.4 57 65.9C57.2 66.4 57.7 67.1 58.1 67.6C58.9 68.7 59.6 70.1 60 71.6C60.2 72.2 60.4 73 60.6 73.3C61 74.3 61 74.8 61 80.9C61 86.7 61 86.7 60.7 87.4C60.1 89 60 89.2 59.9 91C59.8 92.6 59.8 92.8 59.4 93.8C59.1 94.8 59.1 95 59 96.4C58.9 97.8 58.9 98.1 58.5 99.2C58.2 100.2 58.1 100.6 58 101.7C57.9 102.7 57.8 103.1 57.5 104C57.3 104.7 57.2 105.3 57 106.4C56.3 113.9 54.3 116 43.4 120.7C41.6 121.5 38.8 122.7 37.2 123.5C29.5 127 27.4 127.8 25.9 127.3Z",
  },
] as const;

// Orden del halo (y de la secuencia de iluminación): verde → amarillo → azul.
const ORDEN_HALO = ["verde", "amarillo", "azul"] as const;

export function BrandIsotipo({ className }: { className?: string }) {
  // useId devuelve ":r1:"; se limpia para usarlo en url(#…) sin escapes.
  const filterId = `${useId().replace(/:/g, "")}-isotipo-halo`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="1 1 77 127"
      className={`brand-isotipo shrink-0 overflow-visible ${className ?? ""}`}
    >
      <defs>
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* Halos: copia de cada vela con su color, borde ensanchado y desenfoque estático */}
      <g filter={`url(#${filterId})`}>
        {ORDEN_HALO.map((key) => {
          const vela = VELAS.find((item) => item.key === key)!;
          return (
            <path
              key={key}
              className={`brand-isotipo-glow brand-isotipo-glow--${key}`}
              d={vela.d}
              fill={vela.color}
              stroke={vela.color}
              strokeLinejoin="round"
              strokeWidth="7"
            />
          );
        })}
      </g>

      {/* Velas (el amarillo va delante del verde y del azul, como en el logo) */}
      {VELAS.map((vela) => (
        <path key={vela.key} d={vela.d} fill={vela.color} />
      ))}
    </svg>
  );
}
