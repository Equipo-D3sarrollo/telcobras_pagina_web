import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { useTranslations } from "@/lib/accessibility-preferences-context";

export type TurnstileWidgetHandle = {
  reset: () => void;
};

export interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (errorCode?: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_ID = "cf-turnstile-script";
export const TURNSTILE_SITE_KEY = (
  (import.meta.env["VITE_TURNSTILE_SITE_KEY"] as string | undefined) ?? ""
).trim();

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onSuccess, onError, onExpire, theme = "dark", className = "" }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const t = useTranslations().contact;
    const [loadError, setLoadError] = useState<"render" | "script" | null>(null);
    // El script de Cloudflare (~200 KiB con el desafío) solo se descarga cuando el
    // formulario se acerca a la pantalla, no al cargar la página.
    const [isNearViewport, setIsNearViewport] = useState(false);
    const activeSiteKey = TURNSTILE_SITE_KEY;
    // Los callbacks llegan inline desde el formulario y cambian en cada render; se leen
    // desde refs para que el efecto que monta el widget no lo destruya en cada tecla.
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    const onExpireRef = useRef(onExpire);
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    onExpireRef.current = onExpire;

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.reset(widgetIdRef.current);
            } catch (err) {
              console.warn("No se pudo resetear el widget de Turnstile:", err);
            }
          }
        },
      }),
      [],
    );

    useEffect(() => {
      const container = containerRef.current;
      if (!activeSiteKey || !container || isNearViewport) return;
      if (typeof IntersectionObserver === "undefined") {
        setIsNearViewport(true);
        return;
      }
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setIsNearViewport(true);
            observer.disconnect();
          }
        },
        { rootMargin: "600px 0px" },
      );
      observer.observe(container);
      return () => observer.disconnect();
    }, [activeSiteKey, isNearViewport]);

    useEffect(() => {
      if (!activeSiteKey || !isNearViewport) return;

      let isMounted = true;
      let checkInterval: ReturnType<typeof setInterval> | null = null;

      const initWidget = () => {
        if (!isMounted || !containerRef.current || !window.turnstile) return;

        // Si ya está renderizado este widget, no volver a renderizarlo
        if (widgetIdRef.current) return;

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: activeSiteKey,
            theme,
            callback: (token: string) => {
              if (isMounted) {
                setLoadError(null);
                onSuccessRef.current(token);
              }
            },
            "error-callback": (errorCode?: string) => {
              if (isMounted) {
                console.warn("Cloudflare Turnstile reportó un error:", errorCode);
                onErrorRef.current?.(errorCode);
              }
            },
            "expired-callback": () => {
              if (isMounted) {
                onExpireRef.current?.();
              }
            },
          });
          widgetIdRef.current = id;
        } catch (error) {
          console.error("Error al renderizar Cloudflare Turnstile:", error);
          if (isMounted) {
            setLoadError("render");
            onErrorRef.current?.("render_failed");
          }
        }
      };

      if (window.turnstile) {
        initWidget();
      } else {
        let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.id = SCRIPT_ID;
          script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          script.async = true;
          script.defer = true;
          script.onerror = () => {
            if (isMounted) {
              setLoadError("script");
              onErrorRef.current?.("script_load_error");
            }
          };
          document.head.appendChild(script);
        }

        // Esperar a que window.turnstile esté disponible
        checkInterval = setInterval(() => {
          if (window.turnstile) {
            if (checkInterval) clearInterval(checkInterval);
            initWidget();
          }
        }, 100);
      }

      return () => {
        isMounted = false;
        if (checkInterval) clearInterval(checkInterval);
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignorar errores al desmontar
          }
          widgetIdRef.current = null;
        }
      };
    }, [activeSiteKey, theme, isNearViewport]);

    if (!activeSiteKey) return null;

    return (
      <div className={`turnstile-container my-3 min-h-[65px] ${className}`}>
        <div ref={containerRef} aria-label={t.turnstileLabel} />
        {loadError && (
          <p className="mt-1 text-xs text-amber-400" role="alert">
            {loadError === "render" ? t.turnstileRenderError : t.turnstileScriptError}
          </p>
        )}
      </div>
    );
  },
);
