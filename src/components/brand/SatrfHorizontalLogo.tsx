'use client';

import Image from 'next/image';
import { Box, type BoxProps } from '@chakra-ui/react';

interface SatrfHorizontalLogoProps extends BoxProps {
  /** nav ~44px; footer ~48px; admin sidebar ~72px */
  variant?: 'nav' | 'footer' | 'admin';
}

/**
 * Single horizontal SATRF lockup on an intentional white logo plate
 * (horizontal PNG has a light background — plate avoids a harsh box on green/navy).
 */
export default function SatrfHorizontalLogo({
  variant = 'nav',
  ...props
}: SatrfHorizontalLogoProps) {
  const height =
    variant === 'admin'
      ? 'clamp(56px, 18vw, 72px)'
      : variant === 'nav'
        ? 'clamp(36px, 10vw, 44px)'
        : 'clamp(40px, 11vw, 48px)';
  const maxWidth =
    variant === 'admin'
      ? '100%'
      : variant === 'nav'
        ? 'min(260px, 72vw)'
        : 'min(280px, 80vw)';

  return (
    <Box
      bg="white"
      rounded="md"
      px={variant === 'admin' ? { base: 3, md: 4 } : { base: 2, md: 2.5 }}
      py={variant === 'admin' ? 2 : 1}
      w={variant === 'admin' ? '100%' : undefined}
      lineHeight={0}
      boxShadow="sm"
      display="inline-flex"
      alignItems="center"
      {...props}
    >
      <Image
        src="/brand/satrf-logo-horizontal.png"
        alt="South African Target Rifle Federation"
        width={variant === 'admin' ? 360 : 280}
        height={variant === 'admin' ? 72 : 56}
        priority={variant === 'nav' || variant === 'admin'}
        style={{
          height,
          width: 'auto',
          maxWidth,
          objectFit: 'contain',
        }}
      />
    </Box>
  );
}
