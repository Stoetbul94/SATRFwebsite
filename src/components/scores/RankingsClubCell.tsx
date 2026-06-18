import { Text } from '@chakra-ui/react';
import { provinceAbbrev } from '@/lib/memberFields';

interface RankingsClubCellProps {
  club: string;
  province?: string | null;
}

export default function RankingsClubCell({ club, province }: RankingsClubCellProps) {
  const abbrev = provinceAbbrev(province);

  return (
    <Text color="text.muted">
      {club || '—'}
      {abbrev && (
        <Text as="span" color="text.muted" display={{ base: 'none', sm: 'inline' }}>
          {` · ${abbrev}`}
        </Text>
      )}
    </Text>
  );
}
