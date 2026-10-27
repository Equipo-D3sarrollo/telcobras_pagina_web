import { useEffect, useRef } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Video decorativo de fondo: silenciado, en bucle y con poster. No usa `autoPlay`:
 * se reproduce desde el cliente solo si el usuario no pidió movimiento reducido
 * (en ese caso se queda en el poster) y mientras `playing` sea `true`.
 */
export function BackgroundVideo({
  src,
  poster,
  className,
  playing = true,
}: {
  src: string;
  poster: string;
  className?: string;
  playing?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Al hidratar, el hook aún devuelve el valor del servidor (false): se consulta
    // también la preferencia real para no empezar a descargar el video.
    if (playing && !reducedMotion && !prefersReducedMotion()) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing, reducedMotion, src]);

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      className={className}
      loop
      muted
      playsInline
      poster={poster}
      preload="none"
      tabIndex={-1}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
