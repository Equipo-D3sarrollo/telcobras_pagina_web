import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion, useReducedMotion } from "@/hooks/use-reduced-motion";
import { whenLcpImagePainted } from "@/lib/when-lcp-painted";

/**
 * Video decorativo de fondo: silenciado, en bucle y con poster. No usa `autoPlay`:
 * se reproduce desde el cliente solo si el usuario no pidió movimiento reducido
 * (en ese caso se queda en el poster), solo mientras está a la vista (se pausa al salir)
 * y mientras `playing` sea `true`. Con `startAfterLcp` (video del hero) no arranca hasta
 * que la imagen principal ya se pintó, para no competir con el LCP.
 */
export function BackgroundVideo({
  src,
  poster,
  className,
  playing = true,
  startAfterLcp = false,
}: {
  src: string;
  poster: string;
  className?: string;
  playing?: boolean;
  startAfterLcp?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [inView, setInView] = useState(false);
  const [lcpDone, setLcpDone] = useState(!startAfterLcp);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) =>
      setInView(Boolean(entry?.isIntersecting)),
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (lcpDone) return;
    let cancelled = false;
    void whenLcpImagePainted().then(() => {
      if (!cancelled) setLcpDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [lcpDone]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Al hidratar, el hook aún devuelve el valor del servidor (false): se consulta
    // también la preferencia real para no empezar a descargar el video.
    if (playing && inView && lcpDone && !reducedMotion && !prefersReducedMotion()) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [playing, inView, lcpDone, reducedMotion, src]);

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
