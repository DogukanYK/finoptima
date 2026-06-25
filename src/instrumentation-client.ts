import * as Sentry from "@sentry/nextjs";

// Sentry — tarayıcı hata izleme. Yalnız üretimde etkin.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
