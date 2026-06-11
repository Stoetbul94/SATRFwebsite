'use client';

import { Text, type TextProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface SatrfWordmarkProps {
  /** White on dark backgrounds (navbar, auth panel) or brand green on light */
  tone?: 'light' | 'dark';
  children?: ReactNode;
  fontSize?: TextProps['fontSize'];
  className?: string;
}

/** Michroma wordmark — SATRF logo text only, never for general headings. */
export default function SatrfWordmark({
  children = 'SATRF',
  tone = 'light',
  fontSize,
  className,
}: SatrfWordmarkProps) {
  return (
    <Text
      as="span"
      textStyle="wordmark"
      className={className ? `satrf-wordmark ${className}` : 'satrf-wordmark'}
      display="inline-block"
      fontSize={fontSize}
      color={tone === 'light' ? 'white' : 'satrf.green.700'}
      textShadow={tone === 'light' ? '0 1px 2px rgba(0,0,0,0.25)' : undefined}
    >
      {children}
    </Text>
  );
}
