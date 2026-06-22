import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

const FAVICON_PNG = '/images/favicon.png';
const FAVICON_ICO = '/favicon.ico';
const APPLE_TOUCH_ICON = '/apple-touch-icon.png';

export default function Document() {
  return (
    <Html lang="en-ZA">
      <Head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#1a365d" />
        <meta name="application-name" content="SATRF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SATRF" />
        <link rel="icon" type="image/png" href={FAVICON_PNG} />
        <link rel="icon" href={FAVICON_ICO} sizes="any" />
        <link rel="shortcut icon" href={FAVICON_PNG} />
        <link rel="apple-touch-icon" href={APPLE_TOUCH_ICON} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
