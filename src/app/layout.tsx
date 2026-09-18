import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";

import { CompareTray } from "@/components/compare/compare-tray";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { resolveSiteUrl, SITE_NAME } from "@/lib/site";
import { QueryProvider } from "@/providers/query-provider";

import "./globals.css";

// IBM Plex Sans ships as a variable font, so one file covers the 400/500/600
// weights the design uses.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  display: "swap",
});

const DESCRIPTION =
  "Search colleges by location, fees and rating, compare up to three side by side, and explore colleges based on your entrance exam rank.";

export const metadata: Metadata = {
  // Absolute base for canonical and social URLs; per-page metadata inherits it.
  metadataBase: new URL(resolveSiteUrl()),
  title: `${SITE_NAME} — Discover and Compare Colleges`,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Discover and Compare Colleges`,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-IN" className={plexSans.variable}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:shadow-overlay"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <SiteHeader />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <CompareTray />
          <SiteFooter />
        </QueryProvider>
      </body>
    </html>
  );
}
