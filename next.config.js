const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
  },
  experimental: {
    appDir: false,
  },
};

// Temporarily disable Sentry for build testing
const sentryWebpackPluginOptions = {
  silent: true,
  hideSourceMaps: true,
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
};

// Make sure adding Sentry options is the last code to run
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions); 