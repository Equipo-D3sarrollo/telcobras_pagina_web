/**
 * Se resuelve cuando la imagen prioritaria de la página (la del LCP, marcada con
 * fetchpriority="high") ya está cargada y pintada (dos frames después de cargarse).
 * Si no hay imagen o tarda demasiado, se resuelve igualmente tras `timeoutMs`.
 */
export function whenLcpImagePainted(timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    };
    window.setTimeout(finish, timeoutMs);
    const img = document.querySelector<HTMLImageElement>('img[fetchpriority="high"]');
    if (!img || (img.complete && img.naturalWidth > 0)) {
      finish();
      return;
    }
    img.addEventListener("load", finish, { once: true });
    img.addEventListener("error", finish, { once: true });
  });
}
