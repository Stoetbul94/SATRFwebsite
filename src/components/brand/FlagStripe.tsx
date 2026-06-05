'use client';

import { Box, type BoxProps } from '@chakra-ui/react';

interface FlagStripeProps extends BoxProps {
  /** Stripe thickness in px */
  thickness?: number;
}

/**
 * Diagonal SA flag-colour stripe motif (logo energy accent).
 */
export default function FlagStripe({ thickness = 4, ...props }: FlagStripeProps) {
  return (
    <Box
      role="presentation"
      aria-hidden
      h={`${thickness}px`}
      w="100%"
      bgGradient="linear(90deg, satrf.flagRed 0%, satrf.flagRed 25%, satrf.flagGreen 25%, satrf.flagGreen 50%, satrf.flagGold 50%, satrf.flagGold 75%, satrf.flagBlue 75%, satrf.flagBlue 100%)"
      transform="skewY(-1deg)"
      transformOrigin="left"
      rounded="full"
      opacity={0.95}
      {...props}
    />
  );
}
