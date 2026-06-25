import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// İçerik Güvenliği Politikası — şimdilik Report-Only (kırmadan izle).
// Bir süre raporları izledikten sonra `Content-Security-Policy`ye geçilecek.
const csp = [
  "default-src 'self'",
  // Next.js hidrasyon inline script'leri + dev/wasm için eval; Tesseract.js CDN
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
  // Tema <style> bloğu inline basılıyor; Google Fonts CSS
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Fiş önizlemesi blob/data URL kullanır
  "img-src 'self' data: blob:",
  // Tesseract.js OCR motoru/dil verisi (CDN) + Sentry hata raporu
  "connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com https://*.ingest.de.sentry.io",
  // Tesseract.js OCR Web Worker'ı
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), geolocation=(), microphone=(), payment=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
