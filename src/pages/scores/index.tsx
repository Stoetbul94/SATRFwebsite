import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  Stack,
  Text,
  useColorModeValue,
  Button,
  HStack,
  IconButton,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import { FaDownload, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { scoresAPI, leaderboardAPI, Score, LeaderboardEntry } from '@/lib/api';

type SortField = 'score' | 'rank' | 'date';
type SortOrder = 'asc' | 'desc';

export default function Scores() {
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [scores, setScores] = useState<Score[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'scores' | 'leaderboard'>('scores');

  // Fetch public scores (approved scores only)
  useEffect(() => {
    fetchScores();
  }, [selectedEvent, selectedCategory, viewMode]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      setError(null);

      if (viewMode === 'leaderboard') {
        const filters: any = {};
        if (selectedCategory !== 'all') filters.category = selectedCategory;
        const leaderboardData = await leaderboardAPI.getOverall(filters);
        setLeaderboard(leaderboardData.data || []);
      } else {
        // For scores, we need to get event scores
        // Since we don't have a "get all public scores" endpoint, we'll use leaderboard
        // or fetch from a specific event if selected
        if (selectedEvent !== 'all') {
          const scoresData = await scoresAPI.getEventScores(selectedEvent, 1, 100);
          // Filter to only show approved scores (public visibility)
          const approvedScores = (scoresData.data || []).filter((s: Score) => s.status === 'approved');
          setScores(approvedScores);
        } else {
          // Use leaderboard as a proxy for public scores
          const leaderboardData = await leaderboardAPI.getOverall({});
          // Transform leaderboard to score-like format
          const transformedScores: Score[] = leaderboardData.data.map((entry: LeaderboardEntry, index: number) => ({
            id: `lb-${entry.userId}`,
            userId: entry.userId,
            eventId: '',
            discipline: entry.category || '',
            score: entry.bestScore,
            rank: index + 1,
            status: 'approved' as const,
            userName: entry.userName,
            club: entry.club,
            createdAt: new Date().toISOString(),
          }));
          setScores(transformedScores);
        }
      }
    } catch (err: any) {
      console.error('Error fetching scores:', err);
      setError(err.message || 'Failed to load scores');
      setScores([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredScores = useMemo(() => {
    const data = viewMode === 'leaderboard' ? leaderboard : scores;
    
    return data.filter((item) => {
      const score = viewMode === 'leaderboard' 
        ? (item as LeaderboardEntry)
        : (item as Score);
      
      const matchesCategory = selectedCategory === 'all' || 
        (viewMode === 'leaderboard' 
          ? (score as LeaderboardEntry).category === selectedCategory
          : true);
      const matchesSearch = viewMode === 'leaderboard'
        ? (score as LeaderboardEntry).userName.toLowerCase().includes(searchQuery.toLowerCase())
        : (score as Score).userName?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'score') {
        const scoreA = viewMode === 'leaderboard' ? (a as LeaderboardEntry).bestScore : (a as Score).score;
        const scoreB = viewMode === 'leaderboard' ? (b as LeaderboardEntry).bestScore : (b as Score).score;
        return (scoreA - scoreB) * multiplier;
      } else if (sortField === 'rank') {
        // Rank only exists for LeaderboardEntry, not Score
        if (viewMode === 'leaderboard') {
          const rankA = (a as LeaderboardEntry).rank;
          const rankB = (b as LeaderboardEntry).rank;
          return (rankA - rankB) * multiplier;
        } else {
          // For Score type, rank doesn't exist, so return 0 (no sorting)
          return 0;
        }
      } else {
        // For date, use createdAt if available
        const dateA = (a as Score).createdAt || '';
        const dateB = (b as Score).createdAt || '';
        return dateA.localeCompare(dateB) * multiplier;
      }
    });
  }, [scores, leaderboard, viewMode, selectedCategory, searchQuery, sortField, sortOrder]);

  const handleDownload = (format: 'csv' | 'pdf') => {
    // In a real app, this would generate and download the file
    console.log(`Downloading scores in ${format} format`);
  };

  return (
    <Layout>
      <Head>
        <title>Scores & Leaderboards - SATRF</title>
        <meta name="description" content="View public scores and leaderboards from SATRF shooting competitions. Track competition results and rankings." />
        <meta property="og:title" content="Scores & Leaderboards - SATRF" />
        <meta property="og:description" content="View public scores and leaderboards from SATRF shooting competitions." />
        <meta property="og:type" content="website" />
      </Head>
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <Box>
            <Heading size="xl" mb={2}>
              Event Scores & Leaderboards
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              View and track competition results (Public scores only)
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {loading && (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" color="blue.500" />
              <Text mt={4} color={useColorModeValue('gray.600', 'gray.400')}>
                Loading scores...
              </Text>
            </Box>
          )}

          <HStack spacing={4} wrap="wrap">
            <Button
              colorScheme={viewMode === 'scores' ? 'blue' : 'gray'}
              onClick={() => setViewMode('scores')}
            >
              Scores
            </Button>
            <Button
              colorScheme={viewMode === 'leaderboard' ? 'blue' : 'gray'}
              onClick={() => setViewMode('leaderboard')}
            >
              Leaderboard
            </Button>

            {viewMode === 'scores' && (
              <Select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                maxW="200px"
              >
                <option value="all">All Events</option>
                {/* Event options would be populated from API */}
              </Select>
            )}

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              maxW="200px"
            >
              <option value="all">All Categories</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Veteran">Veteran</option>
            </Select>

            <Input
              placeholder={viewMode === 'leaderboard' ? 'Search by name' : 'Search by athlete name'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxW="300px"
            />

            <Button
              leftIcon={<FaDownload />}
              onClick={() => handleDownload('csv')}
              variant="outline"
            >
              Download CSV
            </Button>
            <Button
              leftIcon={<FaDownload />}
              onClick={() => handleDownload('pdf')}
              variant="outline"
            >
              Download PDF
            </Button>
          </HStack>

          <Box
            overflowX="auto"
            bg={useColorModeValue('white', 'gray.700')}
            rounded="lg"
            shadow="md"
          >
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Rank</Th>
                  <Th>{viewMode === 'leaderboard' ? 'Athlete' : 'Athlete'}</Th>
                  <Th>{viewMode === 'leaderboard' ? 'Club' : 'Club'}</Th>
                  <Th>{viewMode === 'leaderboard' ? 'Category' : 'Discipline'}</Th>
                  <Th>
                    {viewMode === 'leaderboard' ? 'Best Score' : 'Score'}
                    <IconButton
                      aria-label="Sort by score"
                      icon={
                        sortField === 'score' ? (
                          sortOrder === 'asc' ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort />
                        )
                      }
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSort('score')}
                    />
                  </Th>
                  <Th>
                    {viewMode === 'leaderboard' ? 'Events' : 'Date'}
                    <IconButton
                      aria-label="Sort by date"
                      icon={
                        sortField === 'date' ? (
                          sortOrder === 'asc' ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort />
                        )
                      }
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSort('date')}
                    />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredScores.length === 0 && !loading ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={8}>
                      <Text color={useColorModeValue('gray.500', 'gray.400')}>
                        No scores found. Try adjusting your filters.
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredScores.map((item, index) => {
                    if (viewMode === 'leaderboard') {
                      const entry = item as LeaderboardEntry;
                      return (
                        <Tr key={entry.userId || index}>
                          <Td>{entry.rank}</Td>
                          <Td>{entry.userName}</Td>
                          <Td>{entry.club}</Td>
                          <Td>{entry.category}</Td>
                          <Td>{entry.bestScore}</Td>
                          <Td>{entry.eventCount} events</Td>
                        </Tr>
                      );
                    } else {
                      const score = item as Score;
                      return (
                        <Tr key={score.id || index}>
                          <Td>{score.rank || index + 1}</Td>
                          <Td>{score.userName || 'Unknown'}</Td>
                          <Td>{score.club || 'N/A'}</Td>
                          <Td>{score.discipline || 'N/A'}</Td>
                          <Td>{score.score}</Td>
                          <Td>{score.createdAt ? new Date(score.createdAt).toLocaleDateString() : 'N/A'}</Td>
                        </Tr>
                      );
                    }
                  })
                )}
              </Tbody>
            </Table>
          </Box>
        </Stack>
      </Container>
    </Layout>
  );
} 