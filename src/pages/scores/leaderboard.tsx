'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { FiFilter, FiDownload, FiPrinter, FiTarget } from 'react-icons/fi';
import { FaTrophy } from 'react-icons/fa';
import {
  Box,
  Button,
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
import { leaderboardAPI } from '@/lib/api';
import type { LeaderboardEntry } from '@/lib/api';

type LeaderboardType = 'overall' | 'event' | 'club';
type TimePeriod = 'all' | 'year' | 'month' | 'week';

export default function Leaderboard() {
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('overall');
  const [discipline, setDiscipline] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<{
    data: LeaderboardEntry[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  } | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let data;
      if (leaderboardType === 'club') {
        data = await leaderboardAPI.getClubLeaderboard({ time_period: timePeriod, page, limit });
      } else {
        data = await leaderboardAPI.getOverall({
          discipline: discipline || undefined,
          category: category || undefined,
          time_period: timePeriod,
          page,
          limit,
        });
      }
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, discipline, category, timePeriod, page]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <FaTrophy color="#C99A3B" />;
    if (rank === 2) return <FaTrophy color="#A0AEC0" />;
    if (rank === 3) return <FaTrophy color="#DD6B20" />;
    return <Text fontWeight="medium" color="text.muted">{rank}</Text>;
  };

  return (
    <Layout>
      <Head>
        <title>Leaderboard - SATRF</title>
      </Head>
      <PublicPageShell>
        <VStack align="stretch" spacing={8}>
          <PublicPageHeader
            eyebrow="Performance"
            title="Leaderboard"
            subtitle="View rankings and performance statistics across disciplines."
          />

          <Card>
            <CardBody>
              <Flex direction={{ base: 'column', lg: 'row' }} gap={4} justify="space-between" mb={6}>
                <HStack spacing={3} wrap="wrap" flex={1}>
                  <Icon as={FiFilter} color="text.muted" />
                  <Select
                    size="sm"
                    maxW="200px"
                    value={leaderboardType}
                    onChange={(e) => {
                      setLeaderboardType(e.target.value as LeaderboardType);
                      setPage(1);
                    }}
                    bg="bg.surface"
                  >
                    <option value="overall">Overall Rankings</option>
                    <option value="club">Club Rankings</option>
                  </Select>
                  {leaderboardType === 'overall' && (
                    <>
                      <Select
                        size="sm"
                        maxW="200px"
                        value={discipline}
                        onChange={(e) => {
                          setDiscipline(e.target.value);
                          setPage(1);
                        }}
                        bg="bg.surface"
                      >
                        <option value="">All Disciplines</option>
                        <option value="50m Rifle Prone">50m Rifle Prone</option>
                        <option value="50m Rifle 3 Positions">50m Rifle 3 Positions</option>
                      </Select>
                      <Select
                        size="sm"
                        maxW="160px"
                        value={category}
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setPage(1);
                        }}
                        bg="bg.surface"
                      >
                        <option value="">All Categories</option>
                        <option value="junior">Junior</option>
                        <option value="open">Open</option>
                        <option value="veteran">Veteran</option>
                      </Select>
                    </>
                  )}
                  <Select
                    size="sm"
                    maxW="160px"
                    value={timePeriod}
                    onChange={(e) => {
                      setTimePeriod(e.target.value as TimePeriod);
                      setPage(1);
                    }}
                    bg="bg.surface"
                  >
                    <option value="all">All Time</option>
                    <option value="year">This Year</option>
                    <option value="month">This Month</option>
                    <option value="week">This Week</option>
                  </Select>
                </HStack>
                <HStack>
                  <Button size="sm" variant="satrfOutline" leftIcon={<FiDownload />} onClick={() => console.log('export')}>
                    Export
                  </Button>
                  <Button size="sm" variant="satrfOutline" leftIcon={<FiPrinter />} onClick={() => window.print()}>
                    Print
                  </Button>
                </HStack>
              </Flex>

              {loading && !leaderboardData ? (
                <Box textAlign="center" py={12}>
                  <Spinner size="lg" color="brand" />
                </Box>
              ) : leaderboardData && leaderboardData.data.length > 0 ? (
                <>
                  <Box overflowX="auto">
                    <Table variant="simple" size="sm">
                      <Thead bg="brand">
                        <Tr>
                          <Th color="white">Rank</Th>
                          <Th color="white">Name</Th>
                          <Th color="white">Club</Th>
                          {leaderboardType === 'overall' && <Th color="white">Category</Th>}
                          <Th color="white" isNumeric>Best</Th>
                          <Th color="white" isNumeric>Average</Th>
                          <Th color="white" isNumeric>Events</Th>
                          {leaderboardType === 'club' && <Th color="white" isNumeric>Members</Th>}
                        </Tr>
                      </Thead>
                      <Tbody>
                        {leaderboardData.data.map((entry) => (
                          <Tr key={entry.userId || entry.club} _hover={{ bg: 'satrf.green.50' }}>
                            <Td>{getRankIcon(entry.rank)}</Td>
                            <Td fontWeight="medium">{entry.userName}</Td>
                            <Td color="text.muted">{entry.club}</Td>
                            {leaderboardType === 'overall' && (
                              <Td>
                                <Badge variant="discipline" textTransform="capitalize">
                                  {entry.category}
                                </Badge>
                              </Td>
                            )}
                            <Td isNumeric fontWeight="semibold" color="accent">
                              {entry.bestScore}
                            </Td>
                            <Td isNumeric color="text.muted">{entry.averageScore}</Td>
                            <Td isNumeric color="text.muted">{entry.eventCount}</Td>
                            {leaderboardType === 'club' && (
                              <Td isNumeric color="text.muted">{entry.memberCount}</Td>
                            )}
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                  {leaderboardData.total_pages > 1 && (
                    <HStack justify="center" mt={6} spacing={2}>
                      <Button
                        size="sm"
                        variant="satrfOutline"
                        onClick={() => setPage(page - 1)}
                        isDisabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Text fontSize="sm" color="text.muted">
                        Page {page} of {leaderboardData.total_pages}
                      </Text>
                      <Button
                        size="sm"
                        variant="satrfOutline"
                        onClick={() => setPage(page + 1)}
                        isDisabled={page === leaderboardData.total_pages}
                      >
                        Next
                      </Button>
                    </HStack>
                  )}
                </>
              ) : (
                <VStack py={12} spacing={3}>
                  <Icon as={FiTarget} boxSize={10} color="text.muted" />
                  <Text fontWeight="semibold" color="text.primary">
                    No rankings found
                  </Text>
                  <Text fontSize="sm" color="text.muted" textAlign="center">
                    Try adjusting your filters or check back later.
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
