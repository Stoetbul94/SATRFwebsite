'use client';

import { Text, type TextProps } from '@chakra-ui/react';

/** Orbitron wordmark — SATRF logo text only, never for general headings. */
export default function SatrfWordmark({ children = 'SATRF', ...props }: TextProps) {
  return (
    <Text
      as="span"
      textStyle="wordmark"
      className="satrf-wordmark"
      display="inline-block"
      {...props}
    >
      {children}
    </Text>
  );
}
