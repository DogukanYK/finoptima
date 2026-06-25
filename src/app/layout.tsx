import type { Metadata, Viewport } from "next";
import "./globals.css";
import { googleFontsHref } from "@/lib/fonts";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker";
import { CookieBanner } from "@/components/consent/cookie-banner";

export const metadata: Metadata = {
  applicationName: "FinOptima",
  title: {
    default: "FinOptima — Akıllı Finans & Ajanda",
    template: "%s · FinOptima",
  },
  description:
    "Harcamalarını takip et, ajandanı yönet, senaryolar kur, finansal geleceğini optimize et.",
  appleWebApp: {
    capable: true,
    title: "FinOptima",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  formatDetection: { telephone: false },
  // Eski iOS sürümleri (16.4 öncesi) için klasik tam ekran etiketi.
  other: {
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0c10",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={googleFontsHref()} />
      </head>
      <body className="min-h-dvh">
        {children}
        <ServiceWorkerRegister />
        <CookieBanner />
      </body>
    </html>
  );
}
