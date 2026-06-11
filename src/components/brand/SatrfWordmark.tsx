'use client';

import { Text, type TextProps } from '@chakra-ui/react';

interface SatrfWordmarkProps extends TextProps {
  /** White on dark backgrounds (navbar, auth panel) or brand green on light */
  tone?: 'light' | 'dark';
}

/** Michroma wordmark — SATRF logo text only, never for general headings. */
export default function SatrfWordmark({
  children = 'SATRF',
  tone = 'light',
  ...props
}: SatrfWordmarkProps) {
  return (
    <Text
      as="span"
      textStyle="wordmark"
      className="satrf-wordmark"
      display="inline-block"
      color={tone === 'light' ? 'white' : 'satrf.green.700'}
      textShadow={tone === 'light' ? '0 1px 2px rgba(0,0,0,0.25)' : undefined}
      {...props}
    >
      {children}
    </Text>
  );
}
