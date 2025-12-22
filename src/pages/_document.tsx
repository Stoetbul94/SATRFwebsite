import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="South African Target Rifle Federation - Official Website" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://satrf.org.za/" />
        <meta property="og:title" content="SATRF - South African Target Rifle Federation" />
        <meta property="og:description" content="Official website of the South African Target Rifle Federation" />
        <meta property="og:image" content="/images/SATRFLOGO.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://satrf.org.za/" />
        <meta property="twitter:title" content="SATRF - South African Target Rifle Federation" />
        <meta property="twitter:description" content="Official website of the South African Target Rifle Federation" />
        <meta property="twitter:image" content="/images/SATRFLOGO.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 