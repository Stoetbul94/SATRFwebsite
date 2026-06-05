'use client';

import { Box, Heading, Text, VStack, type BoxProps } from '@chakra-ui/react';
import FlagStripe from '@/components/brand/FlagStripe';
import TargetRingMotif from '@/components/brand/TargetRingMotif';

interface PublicPageHeaderProps extends BoxProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  showMotif?: boolean;
  showStripe?: boolean;
}

/** Consistent page title strip: eyebrow + Montserrat heading + optional motifs. */
export default function PublicPageHeader({
  eyebrow,
  title,
  subtitle,
  showMotif = true,
  showStripe = true,
  ...props
}: PublicPageHeaderProps) {
  return (
    <Box position="relative" mb={8} {...props}>
      {showMotif && (
        <TargetRingMotif top={-8} right={0} size={200} opacity={0.06} color="satrf.green.700" />
      )}
      <VStack align="start" spacing={2} position="relative" zIndex={1}>
        {eyebrow && <Text textStyle="eyebrow">{eyebrow}</Text>}
        <Heading size="xl" color="text.primary">
          {title}
        </Heading>
        {subtitle && (
          <Text color="text.muted" fontSize="lg" maxW="3xl">
            {subtitle}
          </Text>
        )}
        {showStripe && (
          <Box w={{ base: '100%', md: '280px' }} pt={3}>
            <FlagStripe thickness={4} />
          </Box>
        )}
      </VStack>
    </Box>
  );
}
