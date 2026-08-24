import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  HStack,
  Heading,
  Link as ChakraLink,
  Select,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import DisciplineTabs from '@/components/dashboard/DisciplineTabs';
import DisciplinePerformancePanel from '@/components/dashboard/DisciplinePerformancePanel';
import ResultHistoryTable from '@/components/dashboard/ResultHistoryTable';
import { useAuth, useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import {
  buildAthleteAnalytics,
  filterScoresByYear,
  isFinalStageForDiscipline,
  isQualificationStage,
  scoresForDiscipline,
} from '@/lib/athleteAnalytics';
import type { Score } from '@/types/scores';

async function getToken(): Promise<string | null> {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

function currentYear(): number {
  return new Date().getFullYear();
}

export default function MyPerformancePage() {
  useProtectedRoute();
  const { isAuthenticated, isInitialized } = useAuth();

  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState<number | 'all'>(currentYear());
  const [activeDiscipline, setActiveDiscipline] = useState('');
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null);

  const loadScores = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: '100' });
      const res = await fetch(`/api/scores/my-scores?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setError('Please sign in again.');
        setScores([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to load scores');
      const json = await res.json();
      setScores(json.data || []);
    } catch {
      setError('Could not load your performance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      void loadScores();
    } else if (isInitialized && !isAuthenticated) {
      setLoading(false);
    }
  }, [isInitialized, isAuthenticated, loadScores]);

  const filteredScores = useMemo(
    () => filterScoresByYear(scores, year),
    [scores, year],
  );

  const analytics = useMemo(() => buildAthleteAnalytics(filteredScores), [filteredScores]);

  useEffect(() => {
    if (!analytics.disciplines.length) {
      setActiveDiscipline('');
      return;
    }
    setActiveDiscipline((prev) =>
      prev && analytics.disciplines.some((d) => d.discipline === prev)
        ? prev
        : analytics.disciplines[0].discipline,
    );
  }, [analytics.disciplines]);

  const activePanel = analytics.disciplines.find((d) => d.discipline === activeDiscipline);
  const disciplineScores = activeDiscipline
    ? scoresForDiscipline(filteredScores, activeDiscipline as Score['discipline'])
    : [];

  const qualScores = disciplineScores.filter((s) => isQualificationStage(s.stage));
  const finalScores = disciplineScores.filter((s) =>
    isFinalStageForDiscipline(s.stage, s.discipline),
  );

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const s of scores) {
      const y = parseInt(String(s.date || '').slice(0, 4), 10);
      if (!Number.isNaN(y)) years.add(y);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [scores]);

  return (
    <Layout>
      <Head>
        <title>My Performance | South African Target Rifle Federation</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <PublicPageShell>
        <Container maxW="6xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 6 }}>
          <Box mb={6}>
            <HStack spacing={2} fontSize="sm" color="text.muted" mb={2} flexWrap="wrap">
              <ChakraLink as={Link} href="/dashboard" color="satrf.navy" fontWeight="600">
                My SATRF
              </ChakraLink>
              <Text>/</Text>
              <Text>My Performance</Text>
            </HStack>
            <Heading as="h1" size={{ base: 'lg', md: 'xl' }} color="satrf.navy" fontFamily="heading">
              My Performance
            </Heading>
            <Text mt={1} color="text.muted" fontSize="sm">
              Personal competition analysis — your linked scores only
            </Text>
            <Button
              as={Link}
              href="/dashboard"
              variant="link"
              color="satrf.navy"
              size="sm"
              mt={2}
              minH="44px"
            >
              ← Back to My SATRF
            </Button>
          </Box>

          {loading ? (
            <VStack spacing={4} align="stretch">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} height="120px" borderRadius="md" />
              ))}
            </VStack>
          ) : error ? (
            <Box borderWidth="1px" borderColor="red.200" bg="red.50" p={4} borderRadius="md">
              <Text color="red.700" mb={3}>
                {error}
              </Text>
              <Button size="sm" onClick={() => void loadScores()}>
                Retry
              </Button>
            </Box>
          ) : analytics.disciplines.length === 0 ? (
            <Box
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="md"
              p={8}
              bg="bg.surface"
              textAlign="center"
            >
              <Heading size="md" color="satrf.navy" mb={3}>
                My Performance
              </Heading>
              <Text color="text.muted" mb={6}>
                No competition results are linked to your account yet. Results recorded against your
                SATRF website account will appear here.
              </Text>
              <Button as={Link} href="/dashboard" colorScheme="green" minH="44px">
                Back to My SATRF
              </Button>
            </Box>
          ) : (
            <>
              <HStack mb={6} flexWrap="wrap" spacing={4}>
                <Box>
                  <Text fontSize="xs" fontWeight="600" color="text.muted" mb={1}>
                    Season / Year
                  </Text>
                  <Select
                    size="sm"
                    value={year === 'all' ? 'all' : String(year)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setYear(v === 'all' ? 'all' : parseInt(v, 10));
                    }}
                    maxW="160px"
                    bg="bg.surface"
                  >
                    <option value="all">All time</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </Select>
                </Box>
              </HStack>

              <DisciplineTabs
                disciplines={analytics.disciplines}
                active={activeDiscipline}
                onChange={setActiveDiscipline}
              />

              {activePanel ? (
                <DisciplinePerformancePanel
                  analytics={activePanel}
                  qualScores={qualScores}
                  finalScores={finalScores}
                  selectedScoreId={selectedScoreId}
                  onSelectScore={setSelectedScoreId}
                />
              ) : null}

              <ResultHistoryTable scores={disciplineScores} />
            </>
          )}
        </Container>
      </PublicPageShell>
    </Layout>
  );
}
