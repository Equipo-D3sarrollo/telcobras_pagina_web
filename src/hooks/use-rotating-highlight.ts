import { useEffect, useRef, useState } from "react";

interface RotatingHighlightOptions {
  /** Espera antes de reanudar el ciclo al terminar el hover/focus (ms). */
  resumeDelayMs?: number;
}

/* Rota un índice activo entre `count` elementos cada `intervalMs`. Arranca por defecto
   y solo se pausa con hover/focus, pestaña oculta o cuando el observer confirma que el
   contenedor está fuera del viewport. No depende de window durante el render (SSR).
   Con movimiento reducido también rota: el CSS se encarga de usar solo fundidos. */
export function useRotatingHighlight<T extends HTMLElement>(
  count: number,
  intervalMs = 3000,
  { resumeDelayMs = 0 }: RotatingHighlightOptions = {},
) {
  const containerRef = useRef<T>(null);
  const resumeTimeoutRef = useRef<number | undefined>(undefined);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isInView, setIsInView] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    const updateVisibility = () => setIsPageVisible(document.visibilityState === "visible");

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    let observer: IntersectionObserver | undefined;
    if (containerRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry) setIsInView(entry.isIntersecting);
        },
        { rootMargin: "120px 0px" },
      );
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
      window.clearTimeout(resumeTimeoutRef.current);
    };
  }, []);

  const isPaused = hoveredIndex !== null || !isInView || !isPageVisible;

  useEffect(() => {
    if (isPaused) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % count);
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [isPaused, count, intervalMs]);

  const hold = (index: number) => {
    window.clearTimeout(resumeTimeoutRef.current);
    setHoveredIndex(index);
    setActiveIndex(index);
  };

  const releaseAfter = (delayMs: number) => {
    window.clearTimeout(resumeTimeoutRef.current);
    if (delayMs <= 0) {
      setHoveredIndex(null);
      return;
    }
    resumeTimeoutRef.current = window.setTimeout(() => setHoveredIndex(null), delayMs);
  };

  return {
    containerRef,
    isInView,
    activeIndex: hoveredIndex ?? activeIndex,
    onHoverStart: hold,
    onHoverEnd: () => releaseAfter(resumeDelayMs),
    /** Toque en pantalla táctil: activa y pausa el ciclo durante `pauseMs`. */
    onTouchActivate: (index: number, pauseMs: number) => {
      hold(index);
      releaseAfter(pauseMs);
    },
  };
}
