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
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  useToast,
  Badge,
  IconButton,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  VStack,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { DISCIPLINES } from '@/lib/issf';
import type { Score, ScoreStatus } from '@/types/scores';

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
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [editStatus, setEditStatus] = useState<ScoreStatus>('official');

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
  }, [isAdmin, statusFilter, disciplineFilter, searchTerm, toast]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const handleEdit = (score: Score) => {
    setSelectedScore(score);
    setEditStatus(score.status);
    onOpen();
  };

  const handleSave = async () => {
    if (!selectedScore) return;
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(`/api/admin/scores/${selectedScore.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: editStatus }),
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Score updated', status: 'success', duration: 3000 });
        onClose();
        fetchScores();
      } else {
        throw new Error('Failed to update score');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update score', status: 'error', duration: 3000 });
    }
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

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = { official: 'green', provisional: 'yellow' };
    return <Badge colorScheme={colors[status] || 'gray'} textTransform="capitalize">{status}</Badge>;
  };

  const disciplineLabel = (d: string) => DISCIPLINES[d as keyof typeof DISCIPLINES]?.label || d;

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout title="Scores" description="Review, edit, and manage submitted scores">
      <Head>
        <title>Admin Scores - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Filters */}
      <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor} mb={6}>
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
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} w="180px">
            <option value="all">All Status</option>
            <option value="official">Official</option>
            <option value="provisional">Provisional</option>
          </Select>
        </HStack>
      </Box>

      {/* Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Shooter</Th>
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
                <Td colSpan={9} textAlign="center" py={8}>
                  <Text color="gray.500">No scores found</Text>
                </Td>
              </Tr>
            ) : (
              scores.map((score) => (
                <Tr key={score.id}>
                  <Td fontWeight="medium">
                    {score.shooterName}
                    {!score.userId && (
                      <Badge ml={2} colorScheme="gray" fontSize="0.6em">unlinked</Badge>
                    )}
                  </Td>
                  <Td>{score.club || '-'}</Td>
                  <Td>{disciplineLabel(score.discipline)}</Td>
                  <Td textTransform="capitalize">{score.category}</Td>
                  <Td isNumeric fontWeight="semibold">{score.decimalTotal?.toFixed(1)}</Td>
                  <Td isNumeric>{score.innerTens || 0}</Td>
                  <Td>{getStatusBadge(score.status)}</Td>
                  <Td>{score.date ? new Date(score.date).toLocaleDateString() : '-'}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton aria-label="Edit score" icon={<FiEdit />} size="sm" onClick={() => handleEdit(score)} />
                      <IconButton aria-label="Delete score" icon={<FiTrash2 />} size="sm" colorScheme="red" onClick={() => handleDelete(score.id)} />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Score</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                {selectedScore?.shooterName} — {selectedScore && disciplineLabel(selectedScore.discipline)} —{' '}
                <strong>{selectedScore?.decimalTotal?.toFixed(1)}</strong>
              </Text>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ScoreStatus)}>
                  <option value="official">Official</option>
                  <option value="provisional">Provisional</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSave}>Save</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
