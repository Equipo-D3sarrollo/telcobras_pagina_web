import type { ResponsiveImage } from "@/lib/telcobras-data";

/** `srcset` de una imagen propia en un formato: "/images/x-480.avif 480w, …". */
export function imageSrcSet(image: ResponsiveImage, format: "avif" | "webp"): string {
  return image.widths.map((width) => `${image.base}-${width}.${format} ${width}w`).join(", ");
}
