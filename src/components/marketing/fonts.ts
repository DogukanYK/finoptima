// Tanıtım sitesinin tipografisi — landing'den çıkarıldı, tüm marketing sayfaları
// paylaşır. Font değişkenleri layout'un sarmalayıcı div'ine uygulanır.

import { Space_Grotesk, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

// Layout sarmalayıcısına eklenecek birleşik className.
export const marketingFontVars = `${display.variable} ${bodyFont.variable} ${mono.variable}`;

// Inline style'larda kullanılacak font-family CSS değişkenleri.
export const F = {
  display: "var(--font-display)",
  body: "var(--font-body)",
  mono: "var(--font-mono)",
};
