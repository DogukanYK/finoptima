import type { MetadataRoute } from "next";

// PWA manifest — ana ekrana eklenince native uygulama gibi açılır.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "FinOptima — Akıllı Finans & Ajanda",
    short_name: "FinOptima",
    description:
      "Harcamalarını takip et, ajandanı yönet, senaryolar kur, finansal geleceğini optimize et.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf7",
    theme_color: "#0b0c10",
    lang: "tr",
    dir: "ltr",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
