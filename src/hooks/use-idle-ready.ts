import { useEffect, useState } from "react";

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

/**
 * `true` cuando el navegador queda libre tras la carga (requestIdleCallback con un tope
 * de `timeoutMs`; setTimeout donde no exista) o en la primera interacción, lo que
 * ocurra antes. Sirve para montar UI secundaria sin competir con el LCP.
 */
export function useIdleReady(timeoutMs = 2000): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    let done = false;
    const markReady = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const idleId =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(markReady, { timeout: timeoutMs })
        : window.setTimeout(markReady, timeoutMs / 2);
    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, markReady, { once: true, passive: true });
    }
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
      for (const event of INTERACTION_EVENTS) window.removeEventListener(event, markReady);
    };
  }, [ready, timeoutMs]);

  return ready;
}
