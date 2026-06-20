import { Text } from '@chakra-ui/react';
import { formatScorePair, type ScorePairVariant } from '@/lib/rankingsDisplay';

interface RankingsScorePairProps {
  decimal: number;
  rings?: number | null;
  variant?: ScorePairVariant;
}

export default function RankingsScorePair({
  decimal,
  rings,
  variant = 'decimalPrimary',
}: RankingsScorePairProps) {
  const { primary, secondary } = formatScorePair(decimal, rings, variant);

  return (
    <Text as="span" fontWeight="semibold" color="accent">
      {primary}
      {secondary && (
        <Text
          as="span"
          fontWeight="normal"
          color="text.muted"
          display={{ base: variant === 'ringPrimary' ? 'inline' : 'none', sm: 'inline' }}
        >
          {` (${secondary})`}
        </Text>
      )}
    </Text>
  );
}
