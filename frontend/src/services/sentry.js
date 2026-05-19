import * as Sentry from "@sentry/react";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) return;

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Don't send events in development
      if (process.env.NODE_ENV === "development") return null;
      return event;
    },
  });
}

export function captureError(error, context = {}) {
  if (SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
}

export { Sentry };
