import type { Metadata, Viewport } from "next";
import { MobileTabBar } from "@/components/site-header-client";
import { RealtimeProvider } from "@/components/realtime-provider";
import { RevealObserver } from "@/components/reveal-observer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { themeScript } from "@/components/theme";
import { Toaster } from "@/components/toaster";
import { ServiceWorkerRegistration } from "@/components/sw-register";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/session";
import { countUnread } from "@/lib/unread";
import { inter, saira } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "GebrauchtFelgen24 – Gebrauchte Felgen & Kompletträder kaufen und verkaufen",
    template: "%s | GebrauchtFelgen24",
  },
  description:
    "Der Marktplatz für gebrauchte Felgen und Kompletträder für Auto und Motorrad in Österreich, Deutschland und der Schweiz – mit Passungsprüfung für dein Fahrzeug.",
  applicationName: "GebrauchtFelgen24",
  appleWebApp: { capable: true, title: "Felgen24", statusBarStyle: "black-translucent" },
  openGraph: { type: "website", locale: "de_AT", siteName: "GebrauchtFelgen24" },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#06080c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const unread = user ? await countUnread(user.id) : 0;

  const body = (
    <>
      <a href="#inhalt" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-brand-fill focus:px-4 focus:py-2 focus:text-on-brand">
        Zum Inhalt springen
      </a>
      <SiteHeader user={user} />
      <main id="inhalt" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter />
      <MobileTabBar loggedIn={!!user} />
      <Toaster />
      <RevealObserver />
      <ServiceWorkerRegistration />
    </>
  );

  return (
    <html lang="de" data-theme="dark" className={`${inter.variable} ${saira.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{user ? <RealtimeProvider initialUnread={unread}>{body}</RealtimeProvider> : body}</body>
    </html>
  );
}
