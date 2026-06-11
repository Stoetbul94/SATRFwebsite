'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Box, HStack, type BoxProps } from '@chakra-ui/react';
import SatrfWordmark from '@/components/brand/SatrfWordmark';

interface SatrfNavEmblemProps extends BoxProps {
  showWordmark?: boolean;
}

/** Transparent emblem for the green navbar — no white plate. */
export default function SatrfNavEmblem({ showWordmark = true, ...props }: SatrfNavEmblemProps) {
  return (
    <Box as={Link} href="/" display="inline-flex" alignItems="center" lineHeight={0} {...props}>
      <HStack spacing={{ base: 2, md: 3 }} align="center">
        <Box
          as="span"
          display="inline-block"
          lineHeight={0}
          h={{ base: '48px', md: '60px', lg: '64px' }}
        >
          <Image
            src="/brand/satrf-emblem-transparent.png"
            alt="SATRF"
            width={588}
            height={644}
            priority
            style={{
              height: '100%',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        </Box>
        {showWordmark && (
          <SatrfWordmark
            tone="light"
            display={{ base: 'none', sm: 'block' }}
            fontSize={{ base: 'lg', md: 'xl' }}
          />
        )}
      </HStack>
    </Box>
  );
}
