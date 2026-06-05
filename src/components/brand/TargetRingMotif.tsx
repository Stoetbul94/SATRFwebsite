'use client';

import { Box, type BoxProps } from '@chakra-ui/react';

interface TargetRingMotifProps extends BoxProps {
  size?: number | string;
  opacity?: number;
}

/**
 * Subtle concentric target-ring / crosshair decoration for section backgrounds.
 */
export default function TargetRingMotif({
  size = 280,
  opacity = 0.07,
  ...props
}: TargetRingMotifProps) {
  const s = typeof size === 'number' ? `${size}px` : size;

  return (
    <Box
      as="svg"
      role="presentation"
      aria-hidden
      viewBox="0 0 200 200"
      w={s}
      h={s}
      position="absolute"
      pointerEvents="none"
      opacity={opacity}
      {...props}
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="68" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="24" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
      <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="1" />
      <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="1" />
    </Box>
  );
}
