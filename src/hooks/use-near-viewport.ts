import { useEffect, useRef, useState } from "react";

/**
 * `true` (y se queda en `true`) cuando el elemento enlazado a `ref` está a menos de
 * `rootMargin` de la pantalla. Sirve para no pedir imágenes de una sección que, aunque
 * esté bajo el primer pantallazo, el `loading="lazy"` del navegador ya considera cercana
 * (en conexiones lentas Chrome las pide a unos 2.500 px) y compite con el LCP. Sin
 * IntersectionObserver devuelve `true` de inmediato.
 */
export function useNearViewport<T extends Element>(rootMargin = "100px 0px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (near || !element) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near, rootMargin]);

  return [ref, near] as const;
}
