'use client';

import { Box, useColorModeValue } from '@chakra-ui/react';

interface EventCoverImageProps {
  src?: string | null;
  alt: string;
  height?: string | Record<string, string>;
  rounded?: string;
}

export default function EventCoverImage({
  src,
  alt,
  height = '200px',
  rounded = 'md',
}: EventCoverImageProps) {
  const fallbackBg = useColorModeValue('satrf.navy', 'gray.800');

  if (src) {
    return (
      <Box
        w="100%"
        h={height}
        rounded={rounded}
        overflow="hidden"
        position="relative"
        bg="gray.100"
      >
        <Box
          as="img"
          src={src}
          alt={alt}
          w="100%"
          h="100%"
          objectFit="cover"
          objectPosition="center"
        />
      </Box>
    );
  }

  return (
    <Box
      w="100%"
      h={height}
      rounded={rounded}
      overflow="hidden"
      bg={fallbackBg}
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        bgGradient: 'linear(to-br, satrf.navy, satrf.lightBlue)',
        opacity: 0.85,
      }}
    >
      <Box
        as="img"
        src="/images/SATRFLOGO.png"
        alt="SATRF"
        position="relative"
        zIndex={1}
        maxH="55%"
        maxW="70%"
        objectFit="contain"
        opacity={0.95}
        filter="brightness(1.1)"
      />
    </Box>
  );
}
