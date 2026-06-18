import { Text } from '@chakra-ui/react';

interface RankingsScorePairProps {
  decimal: number;
  rings?: number | null;
}

export default function RankingsScorePair({ decimal, rings }: RankingsScorePairProps) {
  const showRings = rings != null && rings > 0;

  return (
    <Text as="span" fontWeight="semibold" color="accent">
      {decimal.toFixed(1)}
      {showRings && (
        <Text
          as="span"
          fontWeight="normal"
          color="text.muted"
          display={{ base: 'none', sm: 'inline' }}
        >
          {` (${Math.round(rings)})`}
        </Text>
      )}
    </Text>
  );
}
