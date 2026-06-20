import { Text } from '@chakra-ui/react';
import { formatScorePair, type ScorePairVariant } from '@/lib/rankingsDisplay';

interface QualScoreTextProps {
  decimal: number;
  rings?: number | null;
  variant?: ScorePairVariant;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
}

/** Renders a score pair e.g. 524 (551.7) or 551.7 (524). */
export default function QualScoreText({
  decimal,
  rings,
  variant = 'decimalPrimary',
  fontSize,
  fontWeight,
  color,
}: QualScoreTextProps) {
  const { primary, secondary } = formatScorePair(decimal, rings, variant);

  return (
    <Text as="span" fontSize={fontSize} fontWeight={fontWeight} color={color}>
      {primary}
      {secondary && (
        <Text as="span" fontWeight="normal" color="gray.500" ml={1}>
          ({secondary})
        </Text>
      )}
    </Text>
  );
}
