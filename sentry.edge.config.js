// This file configures the initialization of Sentry for edge runtime (v8) and serverless functions.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize Sentry if a valid DSN is provided
if (!dsn || dsn.includes("your-sentry-dsn") || dsn.includes("project-id")) {
  // Sentry disabled – exit immediately
  // Sentry.init() will never be called
} else {
  Sentry.init({
    dsn,
    tracesSampleRate: 1.0,
    debug: false,
  });
} 