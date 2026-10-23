import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";

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
    const [loadError, setLoadError] = useState<string | null>(null);
    const activeSiteKey = TURNSTILE_SITE_KEY;

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
      if (!activeSiteKey) return;

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
                onSuccess(token);
              }
            },
            "error-callback": (errorCode?: string) => {
              if (isMounted) {
                console.warn("Cloudflare Turnstile reportó un error:", errorCode);
                onError?.(errorCode);
              }
            },
            "expired-callback": () => {
              if (isMounted) {
                onExpire?.();
              }
            },
          });
          widgetIdRef.current = id;
        } catch (error) {
          console.error("Error al renderizar Cloudflare Turnstile:", error);
          if (isMounted) {
            setLoadError("No se pudo inicializar la verificación de seguridad.");
            onError?.("render_failed");
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
              setLoadError("Error al cargar el script de verificación.");
              onError?.("script_load_error");
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
    }, [activeSiteKey, theme, onSuccess, onError, onExpire]);

    if (!activeSiteKey) return null;

    return (
      <div className={`turnstile-container my-3 min-h-[65px] ${className}`}>
        <div ref={containerRef} aria-label="Verificación de seguridad Cloudflare Turnstile" />
        {loadError && (
          <p className="mt-1 text-xs text-amber-400" role="alert">
            {loadError}
          </p>
        )}
      </div>
    );
  },
);
