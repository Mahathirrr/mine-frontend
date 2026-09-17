import * as React from "react";

import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import { PwaManager } from "@/components/pwa/pwa-manager";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";
import { PWA_CONFIG } from "@/config/pwa";
import { fontRegistry } from "@/lib/fonts/registry";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { privatePageHead } from "@/lib/seo/build-head";
import { ThemeBootScript } from "@/scripts/theme-boot";
import { AuthStoreProvider } from "@/stores/auth/auth-provider";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import appCss from "../styles/styles.css?url";
import { NotFound } from "./-components/not-found";
import { RootError } from "./-components/root-error";

export const Route = createRootRoute({
  head: () => {
    const seo = privatePageHead({
      title: APP_CONFIG.meta.title,
      description: APP_CONFIG.meta.description,
      path: "/",
    });

    return {
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        ...(seo.meta ?? []),
        {
          name: "theme-color",
          content: PWA_CONFIG.themeColor,
        },
        {
          name: "mobile-web-app-capable",
          content: "yes",
        },
        {
          name: "apple-mobile-web-app-capable",
          content: "yes",
        },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "default",
        },
        {
          name: "apple-mobile-web-app-title",
          content: PWA_CONFIG.shortName,
        },
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
          href: appCss,
        },
        {
          rel: "stylesheet",
          href: fontRegistry[PREFERENCE_DEFAULTS.font].stylesheet,
        },
        {
          rel: "icon",
          href: "/favicon.svg",
          type: "image/svg+xml",
        },
        {
          rel: "icon",
          href: "/favicon.ico",
          sizes: "any",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "apple-touch-icon",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "manifest",
          href: "/manifest.json",
        },
        ...(seo.links ?? []),
      ],
    };
  },
  errorComponent: RootError,
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function DevtoolsShell() {
  return (
    <>
      {/* Loaded only in development to keep production bundles lean. */}
      <LazyTanStackDevtools />
    </>
  );
}

function LazyTanStackDevtools() {
  const [Devtools, setDevtools] = React.useState<React.ComponentType | null>(null);

  React.useEffect(() => {
    void Promise.all([import("@tanstack/react-devtools"), import("@tanstack/react-router-devtools")]).then(
      ([devtoolsMod, routerDevtoolsMod]) => {
        const TanStackDevtools = devtoolsMod.TanStackDevtools;
        const TanStackRouterDevtoolsPanel = routerDevtoolsMod.TanStackRouterDevtoolsPanel;
        setDevtools(() => () => (
          <TanStackDevtools
            config={{ position: "bottom-right" }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ));
      },
    );
  }, []);

  return Devtools ? <Devtools /> : null;
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const { theme_mode, theme_preset, content_layout, navbar_style, sidebar_variant, sidebar_collapsible, font } =
    PREFERENCE_DEFAULTS;

  return (
    <html
      lang="id"
      data-theme-mode={theme_mode}
      data-theme-preset={theme_preset}
      data-content-layout={content_layout}
      data-navbar-style={navbar_style}
      data-sidebar-variant={sidebar_variant}
      data-sidebar-collapsible={sidebar_collapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies theme and layout preferences on load to avoid flicker and unnecessary server rerenders. */}
        <ThemeBootScript />
        <HeadContent />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <TooltipProvider>
          <AuthStoreProvider>
            <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
              {children}
              <PwaManager />
              <Toaster />
            </PreferencesStoreProvider>
          </AuthStoreProvider>
        </TooltipProvider>
        {import.meta.env.DEV ? <DevtoolsShell /> : null}
        <Scripts />
      </body>
    </html>
  );
}
