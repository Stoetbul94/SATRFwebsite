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
import type { LeaderboardEntry } from '@/lib/api';

const MotionBox = motion(Box);

const MEDAL = [
  { place: 1, label: '1st', color: 'satrf.gold.500', height: { base: '140px', md: '180px' } },
  { place: 2, label: '2nd', color: 'gray.300', height: { base: '120px', md: '150px' } },
  { place: 3, label: '3rd', color: 'orange.400', height: { base: '110px', md: '130px' } },
];

interface LeaderboardPodiumProps {
  entries: LeaderboardEntry[];
}

function PodiumCard({
  entry,
  medal,
  index,
  reducedMotion,
}: {
  entry: LeaderboardEntry;
  medal: (typeof MEDAL)[0];
  index: number;
  reducedMotion: boolean;
}) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

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
          bg={cardBg}
          borderWidth="2px"
          borderColor={borderColor}
          borderTopWidth="4px"
          borderTopColor={medal.color}
          borderRadius="lg"
          p={4}
          w="100%"
          minW={{ md: '160px' }}
          textAlign="center"
          boxShadow="md"
        >
          <Badge colorScheme={medal.place === 1 ? 'yellow' : medal.place === 2 ? 'gray' : 'orange'} mb={2}>
            {medal.label}
          </Badge>
          <Text fontWeight="bold" fontSize="md" noOfLines={2}>
            {entry.userName}
          </Text>
          <Text fontSize="xs" color="text.muted" noOfLines={1}>
            {entry.club}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="accent" mt={2}>
            {entry.bestScore}
          </Text>
          <Text fontSize="xs" color="text.muted">
            best score
          </Text>
        </Box>
        <Box
          w="100%"
          h={medal.height}
          bgGradient={`linear(to-t, ${medal.color}, transparent)`}
          borderRadius="md"
          opacity={0.35}
        />
      </VStack>
    </MotionBox>
  );
}

export default function LeaderboardPodium({ entries }: LeaderboardPodiumProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const topThree = entries
    .filter((e) => e.rank >= 1 && e.rank <= 3)
    .sort((a, b) => a.rank - b.rank);

  if (topThree.length === 0) return null;

  const ordered = isMobile
    ? topThree
    : [topThree.find((e) => e.rank === 2), topThree.find((e) => e.rank === 1), topThree.find((e) => e.rank === 3)].filter(
        Boolean
      ) as LeaderboardEntry[];

  return (
    <Box mb={8}>
      <Text fontSize="sm" fontWeight="semibold" color="text.muted" textTransform="uppercase" letterSpacing="wider" mb={4}>
        Top 3
      </Text>
      <HStack
        align="flex-end"
        justify="center"
        spacing={{ base: 3, md: 6 }}
        flexDirection={{ base: 'column', md: 'row' }}
      >
        {ordered.map((entry, index) => {
          const medal = MEDAL.find((m) => m.place === entry.rank)!;
          return (
            <PodiumCard
              key={entry.userId || entry.userName}
              entry={entry}
              medal={medal}
              index={index}
              reducedMotion={!!reducedMotion}
            />
          );
        })}
      </HStack>
    </Box>
  );
}
