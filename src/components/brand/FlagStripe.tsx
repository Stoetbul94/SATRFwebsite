'use client';

import { Box, type BoxProps } from '@chakra-ui/react';

interface FlagStripeProps extends BoxProps {
  /** Stripe thickness in px */
  thickness?: number;
}

/** Straight, full-width SA flag-colour divider (four even horizontal segments). */
export default function FlagStripe({ thickness = 4, ...props }: FlagStripeProps) {
  return (
    <Box
      aria-hidden
      display="flex"
      h={`${thickness}px`}
      w="100%"
      overflow="hidden"
      {...props}
    >
      <Box flex={1} bg="satrf.flagRed" />
      <Box flex={1} bg="satrf.flagGreen" />
      <Box flex={1} bg="satrf.flagGold" />
      <Box flex={1} bg="satrf.flagBlue" />
    </Box>
  );
}
