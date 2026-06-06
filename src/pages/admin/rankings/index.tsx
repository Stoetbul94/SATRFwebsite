import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Select,
  Badge,
  useColorModeValue,
  Spinner,
  Center,
  Text,
} from '@chakra-ui/react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { DISCIPLINES, CATEGORIES } from '@/lib/issf';

interface RankRow {
  rank: number;
  shooterName: string;
  club: string;
  category: string;
  average: number;
  best: number;
  eventCount: number;
}

export default function AdminRankings() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [discipline, setDiscipline] = useState<string>('prone_50m');
  const [category, setCategory] = useState<string>('all');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ discipline });
      if (category !== 'all') params.append('category', category);
      const res = await fetch(`/api/leaderboard/overall?${params.toString()}`);
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [discipline, category]);

  useEffect(() => {
    if (isAdmin) fetchRankings();
  }, [isAdmin, fetchRankings]);

  if (authLoading) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Rankings" subtitle="Official rankings by average decimal total" />
        <AdminTableSkeleton columns={7} />
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  const medal = (rank: number) => {
    const map: Record<number, string> = { 1: 'yellow', 2: 'gray', 3: 'orange' };
    return map[rank];
  };

  return (
    <AdminLayout>
      <Head>
        <title>Rankings - SATRF Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminPageHeader title="Rankings" subtitle="Official rankings by average decimal total" />

      <Box bg="bg.surface" p={4} borderRadius="lg" borderWidth="1px" borderColor="border.default" mb={4} boxShadow="sm">
        <HStack spacing={4} wrap="wrap">
          <Select value={discipline} onChange={(e) => setDiscipline(e.target.value)} w="240px">
            {Object.values(DISCIPLINES).map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)} w="180px">
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </Select>
        </HStack>
      </Box>

      <AdminTableCard>
        {loading ? (
          <AdminTableSkeleton columns={7} rows={8} />
        ) : rows.length === 0 ? (
          <AdminEmptyState
            title="No ranked results"
            description="No official scores for this discipline/category yet."
          />
        ) : (
          <Table variant="admin" size="sm">
            <Thead>
              <Tr>
                <Th isNumeric>Rank</Th>
                <Th>Shooter</Th>
                <Th>Club</Th>
                <Th>Category</Th>
                <Th isNumeric>Average</Th>
                <Th isNumeric>Best</Th>
                <Th isNumeric>Events</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((r) => (
                <Tr key={`${r.shooterName}-${r.club}-${r.rank}`}>
                  <Td isNumeric fontWeight="bold">
                    {medal(r.rank) ? <Badge colorScheme={medal(r.rank)}>{r.rank}</Badge> : r.rank}
                  </Td>
                  <Td fontWeight="semibold">{r.shooterName}</Td>
                  <Td>{r.club || '-'}</Td>
                  <Td textTransform="capitalize">{r.category}</Td>
                  <Td isNumeric fontWeight="bold" color="accent">{r.average.toFixed(1)}</Td>
                  <Td isNumeric>{r.best.toFixed(1)}</Td>
                  <Td isNumeric>{r.eventCount}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </AdminTableCard>
    </AdminLayout>
  );
}
