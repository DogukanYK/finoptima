import * as Sentry from "@sentry/nextjs";

// Sentry — tarayıcı hata izleme. Yalnız üretimde etkin.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,

  // Kullanıcı ortamı kaynaklı zararsız gürültüyü ele — bunlar FinOptima bug'ı DEĞİL:
  // kararsız/kesik ağ, reklam-engelleyici veya gizlilik eklentisinin isteği bloklaması,
  // ya da kullanıcının istek uçarken sayfadan ayrılması. Gerçek API/kod hataları
  // (HTTP 4xx/5xx, TypeError'lar vb.) filtrelenmez — yalnız aşağıdaki jenerik ağ mesajları.
  ignoreErrors: [
    "NetworkError: A network error occurred.",
    "A network error occurred.",
    "NetworkError when attempting to fetch resource.",
    "Failed to fetch",
    "Load failed", // Safari fetch iptali/başarısızlığı
    "The network connection was lost.",
    "The Internet connection appears to be offline.",
    "The operation was aborted.",
    "AbortError",
    // Tarayıcı-içi klasik gürültü (uygulama davranışını etkilemez):
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications.",
    // Tarayıcı eklentileri:
    "Extension context invalidated",
  ],

  // Tarayıcı eklentisi enjeksiyonlarından gelen hataları at (uygulama koduna ait değil).
  denyUrls: [
    /extensions\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-web-extension:\/\//i,
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
