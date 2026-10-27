import type { ImgHTMLAttributes } from "react";
import type { ResponsiveImage } from "@/lib/telcobras-data";
import { imageSrcSet } from "@/lib/responsive-image";

/**
 * <picture> con AVIF y WebP en varios anchos. `sizes` debe describir el ancho real en
 * pantalla; `width`/`height` reservan la proporción para no causar CLS. El <img> usa
 * WebP como respaldo y recibe el resto de atributos (clases, loading, fetchPriority…).
 */
export function ResponsivePicture({
  image,
  sizes,
  ...imgProps
}: {
  image: ResponsiveImage;
  sizes: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet" | "sizes">) {
  const fallbackWidth = image.widths[Math.min(1, image.widths.length - 1)];
  return (
    <picture>
      <source type="image/avif" srcSet={imageSrcSet(image, "avif")} sizes={sizes} />
      <img
        src={`${image.base}-${fallbackWidth}.webp`}
        srcSet={imageSrcSet(image, "webp")}
        sizes={sizes}
        {...imgProps}
      />
    </picture>
  );
}
