import { Michroma, Montserrat, Inter } from 'next/font/google';

/** Michroma — SATRF wordmark / logo text only (Microgramma/Eurostile-inspired) */
export const michroma = Michroma({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-michroma',
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

export const fontVariables = `${michroma.variable} ${montserrat.variable} ${inter.variable}`;
