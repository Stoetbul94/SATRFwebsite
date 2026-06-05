import { Box, Image, Text, useColorModeValue } from '@chakra-ui/react';

interface EventImageFallbackProps {
  height?: string | number;
  title?: string;
}

/** Branded placeholder when an event has no cover image. */
export default function EventImageFallback({ height = '200px', title }: EventImageFallbackProps) {
  const bg = useColorModeValue('satrf.lightGray', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
      w="100%"
      h={height}
      bg={bg}
      rounded="md"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={3}
      px={4}
      role="img"
      aria-label={title ? `SATRF event placeholder for ${title}` : 'SATRF event placeholder'}
    >
      <Image
        src="/brand/satrf-emblem.png"
        alt=""
        maxH={{ base: '72px', md: '96px' }}
        objectFit="contain"
        opacity={0.9}
      />
      <Text fontSize="xs" color="satrf.grayBlue" fontWeight="semibold" letterSpacing="wider" textTransform="uppercase">
        SATRF Event
      </Text>
    </Box>
  );
}
