import { HStack, Badge } from '@chakra-ui/react';
import { disciplineShortLabel, parseEventDisciplines } from '@/lib/eventDisciplines';
import type { Discipline } from '@/types/scores';

interface EventDisciplinePillsProps {
  disciplines?: Discipline[];
  /** Legacy event document fields */
  type?: string;
  size?: 'sm' | 'md';
}

export default function EventDisciplinePills({
  disciplines: disciplineIds,
  type,
  size = 'sm',
}: EventDisciplinePillsProps) {
  const ids = disciplineIds?.length
    ? disciplineIds
    : parseEventDisciplines({ type });

  if (ids.length === 0 && type) {
    return (
      <Badge colorScheme="green" fontSize={size} px={2} py={0.5}>
        {type}
      </Badge>
    );
  }

  return (
    <HStack spacing={2} flexWrap="wrap">
      {ids.map((id) => (
        <Badge key={id} colorScheme="green" variant="subtle" fontSize={size} px={2} py={0.5}>
          {disciplineShortLabel(id)}
        </Badge>
      ))}
    </HStack>
  );
}
