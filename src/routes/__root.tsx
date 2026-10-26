import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { getAccessibilityPreferences } from "../lib/accessibility-preferences.server";

import appCss from "../styles.css?url";
import { reportVibeError } from "../lib/vibe-error-reporting";
import { AccessibilityMenu } from "../components/AccessibilityMenu";
import { CookieBanner } from "../components/CookieBanner";
import { FloatingChatbot } from "../components/FloatingChatbot";
import { useTranslations } from "@/lib/accessibility-preferences-context";
import { AccessibilityPreferencesProvider } from "@/lib/accessibility-preferences-provider";
import { getTranslations } from "@/lib/translations";

function NotFoundComponent() {
  const { accessibilityPreferences } = Route.useLoaderData();
  const t = getTranslations(accessibilityPreferences.language).errors;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t.notFoundTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.notFoundDescription}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t.home}
          </Link>
          <Link
            to="/"
            hash="servicios"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t.services}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const { accessibilityPreferences } = Route.useLoaderData();
  const t = getTranslations(accessibilityPreferences.language).errors;
  useEffect(() => {
    reportVibeError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t.pageErrorTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.pageErrorDescription}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.retry}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t.home}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => ({
    accessibilityPreferences: await getAccessibilityPreferences(),
  }),
  head: ({ loaderData }) => {
    const metadata = getTranslations(
      loaderData?.accessibilityPreferences.language ?? "es",
    ).metadata;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: metadata.title },
        { name: "description", content: metadata.description },
        { name: "author", content: "TELCOBRAS S.A.S." },
        { property: "og:title", content: metadata.socialTitle },
        { property: "og:description", content: metadata.socialDescription },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: metadata.socialTitle },
        { name: "twitter:description", content: metadata.socialDescription },
      ],
      links: [
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300..1000;1,300..1000&display=swap",
        },
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function WhatsAppFloatingButton() {
  const t = useTranslations().contact;
  return (
    <a
      href={`https://wa.me/573217404511?text=${encodeURIComponent(t.whatsappMessage)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.whatsappLabel}
      className="whatsapp-floating-button fixed bottom-5 right-5 z-50 flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-lg shadow-[#88BD4C]/40 transition-transform duration-300 hover:scale-110 hover:shadow-[#88BD4C]/60"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white" aria-hidden="true" focusable="false">
        <path d="M16.003 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.26.6 4.47 1.73 6.4L3.2 28.8l6.55-1.71a12.74 12.74 0 0 0 6.25 1.6h.01c7.06 0 12.8-5.74 12.8-12.8s-5.75-12.69-12.81-12.69zm0 23.04h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.89 1.02 1.04-3.79-.25-.39a10.6 10.6 0 0 1-1.63-5.66c0-5.88 4.79-10.66 10.67-10.66 2.85 0 5.52 1.11 7.54 3.13a10.6 10.6 0 0 1 3.13 7.54c0 5.88-4.79 10.66-10.67 10.66zm5.85-7.98c-.32-.16-1.9-.94-2.19-1.05-.29-.1-.51-.16-.72.16-.21.32-.82 1.05-1.01 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.86-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.99-2.38-.26-.62-.53-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.25 3.44 5.45 4.82.76.33 1.35.53 1.82.68.76.24 1.46.21 2.01.13.61-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z" />
      </svg>
    </a>
  );
}

function RootShell({ children }: { children: ReactNode }) {
  const { accessibilityPreferences } = Route.useLoaderData();

  return (
    <html
      lang={accessibilityPreferences.language}
      data-theme={accessibilityPreferences.theme}
      data-font-size={accessibilityPreferences.fontSize}
      data-colorblind-mode={String(accessibilityPreferences.colorblindMode)}
      className={accessibilityPreferences.theme === "dark" ? "dark" : undefined}
    >
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { accessibilityPreferences } = Route.useLoaderData();

  return (
    <QueryClientProvider client={queryClient}>
      <AccessibilityPreferencesProvider initialPreferences={accessibilityPreferences}>
        <LocalizedMetadata />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <AccessibilityMenu />
        <FloatingChatbot />
        <WhatsAppFloatingButton />
        <CookieBanner />
      </AccessibilityPreferencesProvider>
    </QueryClientProvider>
  );
}

function LocalizedMetadata() {
  const { metadata } = useTranslations();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (pathname !== "/") return;

    document.title = metadata.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", metadata.description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", metadata.socialTitle);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", metadata.socialDescription);
    document
      .querySelector('meta[name="twitter:title"]')
      ?.setAttribute("content", metadata.socialTitle);
    document
      .querySelector('meta[name="twitter:description"]')
      ?.setAttribute("content", metadata.socialDescription);
  }, [metadata, pathname]);

  return null;
}
