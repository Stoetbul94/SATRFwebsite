import { Orbitron, Montserrat, Inter } from 'next/font/google';

/** Orbitron — SATRF wordmark / logo text only */
export const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
});

/** Montserrat — headings */
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

/** Inter — body copy */
export const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const fontVariables = `${orbitron.variable} ${montserrat.variable} ${inter.variable}`;
