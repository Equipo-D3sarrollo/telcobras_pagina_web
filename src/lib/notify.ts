type NotifyKind = "error" | "warning" | "success";

/**
 * Muestra un aviso (toast). `sonner` se importa bajo demanda para que no forme parte
 * de la carga inicial; el <Toaster> se monta de forma diferida en ContactSection.
 */
export function notify(kind: NotifyKind, message: string, options?: { description?: string }) {
  void import("sonner").then(({ toast }) => {
    toast[kind](message, options);
  });
}
