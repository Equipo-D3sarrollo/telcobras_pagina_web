import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Lectura directa (solo en el cliente), útil en efectos que corren al hidratar. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * `true` si el sistema pide reducir el movimiento. En el servidor devuelve `false`;
 * por eso los videos no usan `autoPlay` y solo se reproducen desde el cliente.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}
