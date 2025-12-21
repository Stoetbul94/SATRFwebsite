const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Migrate from deprecated images.domains to images.remotePatterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      // Add additional remote hosts here as needed
    ],
  },
};

// Sentry Webpack plugin temporarily disabled for local build troubleshooting
module.exports = nextConfig; 