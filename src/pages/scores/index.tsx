import {
  Box,
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
  Card,
  CardBody,
} from '@chakra-ui/react';
import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import { DISCIPLINES, CATEGORIES } from '@/lib/issf';
import { formatEventsCell, qualScoreVariant } from '@/lib/rankingsDisplay';
import type { Discipline } from '@/types/scores';
import RankingsClubCell from '@/components/scores/RankingsClubCell';
import RankingsScorePair from '@/components/scores/RankingsScorePair';

interface RankRow {
  rank: number;
  userId: string | null;
  shooterName: string;
  club: string;
  category: string;
  isVeteran?: boolean;
  discipline: string;
  average: number;
  best: number;
  eventCount: number;
  averageRings?: number | null;
  bestRings?: number | null;
  seasonEventTotal?: number | null;
  province?: string | null;
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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load rankings');
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
      <PublicPageShell>
        <Stack spacing={8}>
          <PublicPageHeader
            eyebrow="Season rankings"
            title="Rankings & Scores"
            subtitle="Qualification results only — season averages by discipline. Finals rankings are on the Leaderboard page."
          />

          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Card>
            <CardBody>
              <HStack spacing={3} wrap="wrap" mb={loading || filtered.length === 0 ? 0 : 4}>
                {Object.values(DISCIPLINES).map((d) => (
                  <Button
                    key={d.id}
                    size="sm"
                    variant={discipline === d.id ? 'satrf' : 'satrfOutline'}
                    onClick={() => setDiscipline(d.id)}
                  >
                    {d.label.replace('50m Rifle ', '').replace('F-Class ', 'F-')}
                  </Button>
                ))}
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  maxW="200px"
                  size="sm"
                  bg="bg.surface"
                >
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
                  size="sm"
                  bg="bg.surface"
                />
              </HStack>

              {loading ? (
                <Box textAlign="center" py={12}>
                  <Spinner size="xl" color="brand" />
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead bg="brand">
                      <Tr>
                        <Th color="white">Rank</Th>
                        <Th color="white">Shooter</Th>
                        <Th color="white">Club</Th>
                        <Th color="white">Category</Th>
                        <Th color="white" isNumeric>
                          Average
                        </Th>
                        <Th color="white" isNumeric>
                          Best
                        </Th>
                        <Th color="white" isNumeric>
                          Events
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filtered.length === 0 ? (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={10}>
                            <Text color="text.muted">No ranked scores yet for this discipline.</Text>
                          </Td>
                        </Tr>
                      ) : (
                        filtered.map((r) => (
                          <Tr key={`${r.userId ?? r.shooterName}-${r.club}`} _hover={{ bg: 'satrf.green.50' }}>
                            <Td>
                              {r.rank <= 3 ? (
                                <Badge
                                  colorScheme={r.rank === 1 ? 'yellow' : r.rank === 2 ? 'gray' : 'orange'}
                                >
                                  {r.rank}
                                </Badge>
                              ) : (
                                r.rank
                              )}
                            </Td>
                            <Td fontWeight="medium" color="text.primary">
                              {r.shooterName}
                            </Td>
                            <Td>
                              <RankingsClubCell club={r.club} province={r.province} />
                            </Td>
                            <Td textTransform="capitalize">
                              {r.category}
                              {r.isVeteran && (
                                <Badge ml={1} colorScheme="yellow" fontSize="0.65em">
                                  Vet
                                </Badge>
                              )}
                            </Td>
                            <Td isNumeric>
                              <RankingsScorePair
                                decimal={r.average}
                                rings={r.averageRings}
                                variant={qualScoreVariant(discipline)}
                              />
                            </Td>
                            <Td isNumeric>
                              <RankingsScorePair
                                decimal={r.best}
                                rings={r.bestRings}
                                variant={qualScoreVariant(discipline)}
                              />
                            </Td>
                            <Td isNumeric color="text.muted">
                              {formatEventsCell(r.eventCount, r.seasonEventTotal)}
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </Stack>
      </PublicPageShell>
    </Layout>
  );
}
