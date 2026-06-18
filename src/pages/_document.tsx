import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

// TODO: Generate dedicated icon assets from public/images/favicon.png for broader browser/PWA support:
//   public/favicon.ico
//   public/apple-touch-icon.png
//   public/icon-192.png
//   public/icon-512.png

const FAVICON_PATH = '/images/favicon.png';

export default function Document() {
  return (
    <Html lang="en-ZA">
      <Head>
        <link rel="icon" type="image/png" href={FAVICON_PATH} />
        <link rel="shortcut icon" href={FAVICON_PATH} />
        <link rel="apple-touch-icon" href={FAVICON_PATH} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 