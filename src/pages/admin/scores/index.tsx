import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useToast,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton';
import AdminStatusBadge from '@/components/admin/AdminStatusBadge';
import AdminIconActions from '@/components/admin/AdminIconActions';
import ManualEntryComponent from '@/components/admin/ManualEntryComponent';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { DISCIPLINES } from '@/lib/issf';
import { formatScoreTotalDisplay } from '@/lib/rankingsDisplay';
import type { Score } from '@/types/scores';

type AdminScoreRow = Score & { linkedMemberName?: string | null };

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function AdminScores() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [scores, setScores] = useState<AdminScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [linkFilter, setLinkFilter] = useState<string>('all');

  const [selectedScore, setSelectedScore] = useState<Score | null>(null);

  useEffect(() => {
    if (router.query.status) setStatusFilter(router.query.status as string);
  }, [router.query]);

  const fetchScores = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (disciplineFilter !== 'all') params.append('discipline', disciplineFilter);
      if (linkFilter !== 'all') params.append('link', linkFilter);
      if (searchTerm) params.append('search', searchTerm);
      const response = await fetch(`/api/admin/scores?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setScores(data.scores || []);
      } else {
        toast({ title: 'Error', description: 'Failed to fetch scores', status: 'error', duration: 3000 });
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
      toast({ title: 'Error', description: 'Failed to fetch scores', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, statusFilter, disciplineFilter, linkFilter, searchTerm, toast]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const handleEdit = (score: Score) => {
    setSelectedScore(score);
    onOpen();
  };

  const handleEditSuccess = (result: { message?: string }) => {
    toast({
      title: 'Success',
      description: result.message || 'Score updated',
      status: 'success',
      duration: 3000,
    });
    onClose();
    setSelectedScore(null);
    fetchScores();
  };

  const handleEditError = (error: string) => {
    toast({ title: 'Error', description: error, status: 'error', duration: 5000 });
  };

  const handleDelete = async (scoreId: string) => {
    if (!confirm('Delete this score? This cannot be undone.')) return;
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/scores/${scoreId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Score deleted', status: 'success', duration: 3000 });
        setScores((prev) => prev.filter((s) => s.id !== scoreId));
      } else {
        throw new Error('Failed to delete score');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete score', status: 'error', duration: 3000 });
    }
  };

  const disciplineLabel = (d: string) => DISCIPLINES[d as keyof typeof DISCIPLINES]?.label || d;

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <AdminPageHeader title="Scores" subtitle="Review, edit, and manage submitted scores" />
        <AdminTableSkeleton columns={11} />
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout>
      <Head>
        <title>Admin Scores - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminPageHeader title="Scores" subtitle="Review, edit, and manage submitted scores" />

      <Box bg="bg.surface" p={4} borderRadius="lg" borderWidth="1px" borderColor="border.default" mb={4} boxShadow="sm">
        <HStack spacing={4} wrap="wrap">
          <Box flex="1" minW="240px">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Search by shooter, club, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Box>
          <Select value={disciplineFilter} onChange={(e) => setDisciplineFilter(e.target.value)} w="220px">
            <option value="all">All Disciplines</option>
            {Object.values(DISCIPLINES).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} w="180px">
            <option value="all">All Status</option>
            <option value="official">Official</option>
            <option value="provisional">Provisional</option>
          </Select>
          <Select value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)} w="180px">
            <option value="all">All Links</option>
            <option value="linked">Linked</option>
            <option value="unlinked">Unlinked</option>
          </Select>
        </HStack>
      </Box>

      <AdminTableCard>
        <Table variant="admin" size="sm">
          <Thead>
            <Tr>
              <Th>Shooter</Th>
              <Th>Event</Th>
              <Th>Member</Th>
              <Th>Club</Th>
              <Th>Discipline</Th>
              <Th>Category</Th>
              <Th isNumeric>Total</Th>
              <Th isNumeric>Inner 10s</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {scores.length === 0 ? (
              <Tr>
                <Td colSpan={11} p={0} border={0}>
                  <AdminEmptyState
                    icon={FiSearch}
                    title="No scores found"
                    description="Try adjusting filters or import scores to get started."
                  />
                </Td>
              </Tr>
            ) : (
              scores.map((score) => (
                <Tr key={score.id}>
                  <Td fontWeight="medium">{score.shooterName}</Td>
                  <Td maxW="180px" isTruncated title={score.eventName}>
                    {score.eventName || '—'}
                  </Td>
                  <Td>
                    {score.linkedMemberName ? (
                      <Text color="teal.600" fontSize="sm" fontWeight="medium">
                        {score.linkedMemberName}
                      </Text>
                    ) : (
                      <Badge colorScheme="gray" fontSize="0.65em">
                        Unlinked
                      </Badge>
                    )}
                  </Td>
                  <Td>{score.club || '-'}</Td>
                  <Td>{disciplineLabel(score.discipline)}</Td>
                  <Td textTransform="capitalize">
                    {score.category}
                    {score.isVeteran && (
                      <Badge ml={1} colorScheme="yellow" fontSize="0.65em">
                        Vet
                      </Badge>
                    )}
                  </Td>
                  <Td isNumeric fontWeight="semibold">
                    {formatScoreTotalDisplay(score)}
                  </Td>
                  <Td isNumeric>{score.innerTens || 0}</Td>
                  <Td>
                    <AdminStatusBadge status={score.status} />
                  </Td>
                  <Td>{score.date ? new Date(score.date).toLocaleDateString() : '-'}</Td>
                  <Td>
                    <AdminIconActions
                      actions={[
                        { label: 'Edit score', icon: <FiEdit />, onClick: () => handleEdit(score) },
                        {
                          label: 'Delete score',
                          icon: <FiTrash2 />,
                          colorScheme: 'red',
                          onClick: () => handleDelete(score.id),
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </AdminTableCard>

      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="960px">
          <ModalHeader>
            Edit score — {selectedScore?.shooterName}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedScore && (
              <ManualEntryComponent
                key={selectedScore.id}
                editScore={selectedScore}
                onEditCancel={onClose}
                onImportSuccess={handleEditSuccess}
                onImportError={handleEditError}
                isLoading={saving}
                setIsLoading={setSaving}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
