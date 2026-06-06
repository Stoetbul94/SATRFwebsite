'use client';

import { Flex, type FlexProps } from '@chakra-ui/react';

interface FlagStripeProps extends FlexProps {
  /** Stripe thickness in px */
  thickness?: number;
}

/** Straight, full-width SA flag-colour divider (four even horizontal segments). */
export default function FlagStripe({ thickness = 4, ...props }: FlagStripeProps) {
  return (
    <Flex
      role="presentation"
      aria-hidden
      h={`${thickness}px`}
      w="100%"
      overflow="hidden"
      {...props}
    >
      <Flex flex={1} bg="satrf.flagRed" />
      <Flex flex={1} bg="satrf.flagGreen" />
      <Flex flex={1} bg="satrf.flagGold" />
      <Flex flex={1} bg="satrf.flagBlue" />
    </Flex>
  );
}
