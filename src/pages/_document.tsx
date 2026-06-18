import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

// TODO: Generate proper favicon.ico, icon-192.png, icon-512.png, and apple-touch-icon.png
// from public/images/favicon.png (current PNG is large; optimize to ≤48–192px square for Google).

const FAVICON_PNG = '/images/favicon.png';
const FAVICON_ICO = '/favicon.ico';
const APPLE_TOUCH_ICON = '/apple-touch-icon.png';

export default function Document() {
  return (
    <Html lang="en-ZA">
      <Head>
        <link rel="icon" type="image/png" href={FAVICON_PNG} />
        <link rel="icon" href={FAVICON_ICO} sizes="any" />
        <link rel="shortcut icon" href={FAVICON_PNG} />
        <link rel="apple-touch-icon" href={APPLE_TOUCH_ICON} />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
