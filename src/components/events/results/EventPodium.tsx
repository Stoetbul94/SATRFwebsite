'use client';

import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { motion, useReducedMotion } from 'framer-motion';
import type { EventResultRow } from '@/lib/issf';

const MotionBox = motion(Box);

interface EventPodiumProps {
  rows: EventResultRow[];
}

const MEDAL = [
  { place: 1, label: '1st', color: 'yellow.400', height: { base: '140px', md: '180px' } },
  { place: 2, label: '2nd', color: 'gray.300', height: { base: '120px', md: '150px' } },
  { place: 3, label: '3rd', color: 'orange.400', height: { base: '110px', md: '130px' } },
];

function PodiumCard({
  row,
  medal,
  index,
  reducedMotion,
}: {
  row: EventResultRow;
  medal: (typeof MEDAL)[0];
  index: number;
  reducedMotion: boolean;
}) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accent = medal.color;

  return (
    <MotionBox
      flex={medal.place === 1 ? { base: 'none', md: 1.1 } : 1}
      w={{ base: '100%', md: 'auto' }}
      initial={reducedMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reducedMotion ? 0 : index * 0.08 }}
    >
      <VStack spacing={2}>
        <Box
          w="100%"
          minH={medal.height}
          bg={cardBg}
          borderRadius="xl"
          borderWidth="2px"
          borderColor={accent}
          boxShadow="lg"
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          p={4}
          mt={medal.place === 1 ? { base: 0, md: -4 } : 0}
        >
          <Badge
            alignSelf="flex-start"
            colorScheme={medal.place === 1 ? 'yellow' : medal.place === 2 ? 'gray' : 'orange'}
            fontSize="sm"
            textTransform="uppercase"
          >
            {medal.label}
          </Badge>
          <VStack align="stretch" spacing={1} w="100%" pt={2}>
            <Text fontWeight="bold" fontSize="lg" color="satrf.navy" noOfLines={2}>
              {row.shooterName}
            </Text>
            <Text fontSize="sm" color="gray.500" noOfLines={1}>
              {row.club}
            </Text>
            <Text fontSize="2xl" fontWeight="extrabold" color="satrf.lightBlue">
              {row.decimalTotal.toFixed(1)}
            </Text>
          </VStack>
        </Box>
      </VStack>
    </MotionBox>
  );
}

export default function EventPodium({ rows }: EventPodiumProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const top3 = rows.slice(0, 3);
  if (top3.length === 0) return null;

  const ordered = [
    top3.find((r) => r.place === 2) ?? top3[1],
    top3.find((r) => r.place === 1) ?? top3[0],
    top3.find((r) => r.place === 3) ?? top3[2],
  ].filter(Boolean) as EventResultRow[];

  if (isMobile) {
    const mobileOrder = [...top3].sort((a, b) => a.place - b.place);
    return (
      <VStack spacing={4} w="100%" mb={8}>
        {mobileOrder.map((row, i) => (
          <PodiumCard
            key={row.scoreId ?? row.shooterName}
            row={row}
            medal={MEDAL[row.place - 1] ?? MEDAL[2]}
            index={i}
            reducedMotion={!!reducedMotion}
          />
        ))}
      </VStack>
    );
  }

  return (
    <HStack align="flex-end" spacing={4} w="100%" mb={10} justify="center">
      {ordered.map((row, i) => (
        <PodiumCard
          key={row.scoreId ?? row.shooterName}
          row={row}
          medal={MEDAL[row.place - 1] ?? MEDAL[i]}
          index={i}
          reducedMotion={!!reducedMotion}
        />
      ))}
    </HStack>
  );
}
