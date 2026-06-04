'use client';

import { Box, SimpleGrid, Text, useColorModeValue } from '@chakra-ui/react';
import { Collapse } from '@chakra-ui/react';
import { POSITION_LABELS } from '@/lib/issf';
import type { EventResultRow } from '@/lib/issf';
import type { Position } from '@/types/scores';

interface ScoreDetailPanelProps {
  row: EventResultRow;
  isOpen: boolean;
}

export default function ScoreDetailPanel({ row, isOpen }: ScoreDetailPanelProps) {
  const bg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const shotCellBg = useColorModeValue('white', 'gray.800');

  return (
    <Collapse in={isOpen} animateOpacity unmountOnExit>
      <Box mt={2} p={4} bg={bg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
        {row.stage === '3p_final' && row.finalShots && row.finalShots.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2} color="satrf.navy">
              35-shot ladder
            </Text>
            <SimpleGrid columns={{ base: 5, sm: 7, md: 10 }} spacing={2}>
              {row.finalShots.map((shot, i) => (
                <Box
                  key={i}
                  textAlign="center"
                  py={1}
                  px={1}
                  borderRadius="sm"
                  bg={shotCellBg}
                  fontSize="xs"
                >
                  <Text color="gray.500">{i + 1}</Text>
                  <Text fontWeight="medium">{shot.toFixed(1)}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {row.positions && row.positions.length > 0 && (
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
            {row.positions.map((p) => (
              <Box key={p.position}>
                <Text fontSize="xs" color="gray.500" textTransform="uppercase">
                  {POSITION_LABELS[p.position as Position] ?? p.position}
                </Text>
                <Text fontWeight="bold" fontSize="lg">
                  {p.decimalTotal.toFixed(1)}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {row.series && row.series.length > 0 && (
          <SimpleGrid columns={{ base: 3, sm: 6 }} spacing={2}>
            {row.series.map((s) => (
              <Box key={s.seriesNumber} textAlign="center">
                <Text fontSize="xs" color="gray.500">
                  S{s.seriesNumber}
                </Text>
                <Text fontWeight="semibold">{s.decimal.toFixed(1)}</Text>
              </Box>
            ))}
          </SimpleGrid>
        )}

        {!row.series?.length && !row.positions?.length && !row.finalShots?.length && (
          <Text fontSize="sm" color="gray.500">
            No detailed breakdown available.
          </Text>
        )}
      </Box>
    </Collapse>
  );
}
