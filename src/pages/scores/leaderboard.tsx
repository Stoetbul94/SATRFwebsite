'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiFilter, FiTarget } from 'react-icons/fi';
import {
  Box,
  Card,
  CardBody,
  HStack,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  Badge,
  Icon,
  Flex,
} from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import { DISCIPLINES, CATEGORIES } from '@/lib/issf';
import type { Discipline } from '@/types/scores';

interface FinalsRankRow {
  rank: number;
  shooterName: string;
  club: string;
  category: string;
  discipline: string;
  decimalTotal: number;
  finalRank: number | null;
  eventName: string;
  date: string;
}

const FINALS_DISCIPLINES: Discipline[] = ['prone_50m', 'three_position_50m'];

export default function Leaderboard() {
  const [discipline, setDiscipline] = useState<Discipline>('prone_50m');
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<FinalsRankRow[]>([]);

  useEffect(() => {
    const fetchFinals = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ discipline });
        if (category !== 'all') params.append('category', category);
        const res = await fetch(`/api/leaderboard/finals?${params.toString()}`);
        const data = await res.json();
        setRows(data.data || []);
      } catch (error) {
        console.error('Error fetching finals leaderboard:', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFinals();
  }, [discipline, category]);

  const disciplineLabel = DISCIPLINES[discipline]?.label ?? discipline;

  return (
    <Layout>
      <Head>
        <title>Finals Leaderboard - SATRF</title>
      </Head>
      <PublicPageShell>
        <VStack align="stretch" spacing={8}>
          <PublicPageHeader
            eyebrow="Performance"
            title="Finals Leaderboard"
            subtitle="Finals results only — ranked by final score. Qualification standings are on the Scores page."
          />

          <Card>
            <CardBody>
              <Flex direction={{ base: 'column', lg: 'row' }} gap={4} justify="space-between" mb={6}>
                <HStack spacing={3} wrap="wrap" flex={1}>
                  <Icon as={FiFilter} color="text.muted" />
                  <Select
                    size="sm"
                    maxW="220px"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value as Discipline)}
                    bg="bg.surface"
                  >
                    {FINALS_DISCIPLINES.map((id) => (
                      <option key={id} value={id}>
                        {DISCIPLINES[id].label} Final
                      </option>
                    ))}
                  </Select>
                  <Select
                    size="sm"
                    maxW="160px"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    bg="bg.surface"
                  >
                    <option value="all">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </HStack>
              </Flex>

              <Text fontSize="sm" color="text.muted" mb={4}>
                {disciplineLabel} finals
                {category !== 'all' ? ` · ${CATEGORIES.find((c) => c.id === category)?.label ?? category}` : ''}
              </Text>

              {loading ? (
                <Box textAlign="center" py={12}>
                  <Spinner size="lg" color="brand" />
                </Box>
              ) : rows.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg="brand">
                      <Tr>
                        <Th color="white">Rank</Th>
                        <Th color="white">Shooter</Th>
                        <Th color="white">Club</Th>
                        <Th color="white">Category</Th>
                        <Th color="white">Event</Th>
                        <Th color="white" isNumeric>
                          Final Total
                        </Th>
                        <Th color="white" isNumeric>
                          Final Place
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {rows.map((entry) => (
                        <Tr key={`${entry.shooterName}-${entry.eventName}-${entry.date}`}>
                          <Td fontWeight="bold">{entry.rank}</Td>
                          <Td fontWeight="medium">{entry.shooterName}</Td>
                          <Td color="text.muted">{entry.club}</Td>
                          <Td>
                            <Badge variant="discipline" textTransform="capitalize">
                              {entry.category}
                            </Badge>
                          </Td>
                          <Td fontSize="sm" color="text.muted">
                            {entry.eventName}
                          </Td>
                          <Td isNumeric fontWeight="semibold" color="accent">
                            {entry.decimalTotal.toFixed(1)}
                          </Td>
                          <Td isNumeric color="text.muted">
                            {entry.finalRank ?? '—'}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <VStack py={12} spacing={3}>
                  <Icon as={FiTarget} boxSize={10} color="text.muted" />
                  <Text fontWeight="semibold" color="text.primary">
                    No finals results yet
                  </Text>
                  <Text fontSize="sm" color="text.muted" textAlign="center">
                    {disciplineLabel} finals for this category will appear here once official final scores are
                    recorded.
                  </Text>
                </VStack>
              )}
            </CardBody>
          </Card>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
