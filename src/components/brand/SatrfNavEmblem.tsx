'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Box, HStack, Text, type BoxProps } from '@chakra-ui/react';

interface SatrfNavEmblemProps extends BoxProps {
  showWordmark?: boolean;
}

/** Transparent emblem for the green navbar — no white plate. */
export default function SatrfNavEmblem({ showWordmark = true, ...props }: SatrfNavEmblemProps) {
  return (
    <Box as={Link} href="/" display="inline-flex" alignItems="center" lineHeight={0} {...props}>
      <HStack spacing={{ base: 2, md: 3 }} align="center">
        <Image
          src="/brand/satrf-emblem-transparent.png"
          alt="SATRF"
          width={588}
          height={644}
          priority
          style={{
            height: 'clamp(52px, 12vw, 68px)',
            width: 'auto',
            objectFit: 'contain',
          }}
        />
        {showWordmark && (
          <Text
            display={{ base: 'none', sm: 'block' }}
            fontFamily="heading"
            fontWeight="800"
            fontSize={{ base: 'lg', md: 'xl' }}
            letterSpacing="0.12em"
            color="white"
            textShadow="0 1px 2px rgba(0,0,0,0.25)"
          >
            SATRF
          </Text>
        )}
      </HStack>
    </Box>
  );
}
