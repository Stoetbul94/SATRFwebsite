import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
} from '@chakra-ui/react';
import { STAGE_LABELS } from '@/lib/athleteAnalytics';
import { DISCIPLINES } from '@/lib/issf';
import type { LinkedScorePreview } from '@/lib/memberLink';

interface MemberLinkedScoresTableProps {
  scores: LinkedScorePreview[];
}

export default function MemberLinkedScoresTable({ scores }: MemberLinkedScoresTableProps) {
  if (scores.length === 0) {
    return (
      <Text color="gray.500" fontSize="sm">
        No scores linked to this member yet.
      </Text>
    );
  }

  const disciplineLabel = (d: string) => DISCIPLINES[d as keyof typeof DISCIPLINES]?.label || d;

  return (
    <Table variant="admin" size="sm">
      <Thead>
        <Tr>
          <Th>Event</Th>
          <Th>Stage</Th>
          <Th isNumeric>Total</Th>
          <Th>Club</Th>
          <Th>Date</Th>
        </Tr>
      </Thead>
      <Tbody>
        {scores.map((score) => (
          <Tr key={score.id}>
            <Td maxW="200px" isTruncated title={score.eventName}>
              {score.eventName || '—'}
            </Td>
            <Td whiteSpace="nowrap">
              {STAGE_LABELS[score.stage] ?? score.stage}
              <Text as="span" fontSize="xs" color="gray.500" ml={1}>
                ({disciplineLabel(score.discipline)})
              </Text>
            </Td>
            <Td isNumeric fontWeight="semibold">
              {score.totalDisplay}
            </Td>
            <Td>{score.club || '—'}</Td>
            <Td whiteSpace="nowrap">
              {score.date ? new Date(score.date).toLocaleDateString() : '—'}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
}
