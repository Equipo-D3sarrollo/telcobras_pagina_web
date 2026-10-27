import { useSyncExternalStore } from "react";
import { hasNonEssentialConsent, onCookieConsentChange } from "@/lib/cookie-consent";

/** `true` si el usuario aceptó las cookies opcionales. En el servidor, `false`. */
export function useNonEssentialConsent(): boolean {
  return useSyncExternalStore(onCookieConsentChange, hasNonEssentialConsent, () => false);
}
