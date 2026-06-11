import { Archivo, IBM_Plex_Mono } from 'next/font/google';

export const heroArchivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-hero-archivo',
  display: 'swap',
});

export const heroMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-hero-mono',
  display: 'swap',
});

export const heroFontVariables = `${heroArchivo.variable} ${heroMono.variable}`;
