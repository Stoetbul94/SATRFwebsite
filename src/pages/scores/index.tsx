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
  Button,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import { DISCIPLINES, CATEGORIES } from '@/lib/issf';
import type { Discipline } from '@/types/scores';

interface RankRow {
  rank: number;
  userId: string | null;
  shooterName: string;
  club: string;
  category: string;
  discipline: string;
  average: number;
  best: number;
  eventCount: number;
}

export default function Scores() {
  const [discipline, setDiscipline] = useState<Discipline>('prone_50m');
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ discipline });
        if (category !== 'all') params.append('category', category);
        const res = await fetch(`/api/leaderboard/overall?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load rankings');
        setRows(data.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load rankings');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, [discipline, category]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.shooterName.toLowerCase().includes(q) || r.club.toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <Layout>
      <Head>
        <title>Rankings & Scores - SATRF</title>
        <meta
          name="description"
          content="SATRF national rankings for ISSF 50m Rifle Prone and 50m Rifle 3 Positions, ranked by average score."
        />
      </Head>
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <Box>
            <Heading size="xl" mb={2}>
              Rankings &amp; Scores
            </Heading>
            <Text color="gray.600">
              National rankings by average decimal total. Public — open to everyone.
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <HStack spacing={4} wrap="wrap">
            {Object.values(DISCIPLINES).map((d) => (
              <Button
                key={d.id}
                colorScheme={discipline === d.id ? 'blue' : 'gray'}
                onClick={() => setDiscipline(d.id)}
              >
                {d.label}
              </Button>
            ))}

            <Select value={category} onChange={(e) => setCategory(e.target.value)} maxW="200px">
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>

            <Input
              placeholder="Search by name or club"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxW="300px"
            />
          </HStack>

          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="xl" color="blue.500" />
            </Box>
          ) : (
            <Box overflowX="auto" bg="white" rounded="lg" shadow="md">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Rank</Th>
                    <Th>Shooter</Th>
                    <Th>Club</Th>
                    <Th>Category</Th>
                    <Th isNumeric>Average</Th>
                    <Th isNumeric>Best</Th>
                    <Th isNumeric>Events</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filtered.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={8}>
                        <Text color="gray.500">No ranked scores yet for this discipline.</Text>
                      </Td>
                    </Tr>
                  ) : (
                    filtered.map((r) => (
                      <Tr key={`${r.userId ?? r.shooterName}-${r.club}`}>
                        <Td>
                          {r.rank <= 3 ? (
                            <Badge colorScheme={['yellow', 'gray', 'orange'][r.rank - 1]}>
                              {r.rank}
                            </Badge>
                          ) : (
                            r.rank
                          )}
                        </Td>
                        <Td fontWeight="medium">{r.shooterName}</Td>
                        <Td>{r.club}</Td>
                        <Td textTransform="capitalize">{r.category}</Td>
                        <Td isNumeric fontWeight="semibold">
                          {r.average.toFixed(1)}
                        </Td>
                        <Td isNumeric>{r.best.toFixed(1)}</Td>
                        <Td isNumeric>{r.eventCount}</Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          )}
        </Stack>
      </Container>
    </Layout>
  );
}
