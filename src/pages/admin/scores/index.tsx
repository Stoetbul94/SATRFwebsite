import { useState, useEffect } from 'react';
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
  NumberInput,
  NumberInputField,
  VStack,
} from '@chakra-ui/react';
import { FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { Score } from '@/lib/api';

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
  const [selectedScore, setSelectedScore] = useState<Score | null>(null);
  const [editScore, setEditScore] = useState<Partial<Score>>({});
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (router.query.status) {
      setStatusFilter(router.query.status as string);
    }
  }, [router.query]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!isAdmin) return;

      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) return;

        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (searchTerm) {
          params.append('search', searchTerm);
        }

        const response = await fetch(`/api/admin/scores?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setScores(data.scores || []);
        } else {
          toast({
            title: 'Error',
            description: 'Failed to fetch scores',
            status: 'error',
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error fetching scores:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch scores',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, [isAdmin, statusFilter, searchTerm, toast]);

  const handleEdit = (score: Score) => {
    setSelectedScore(score);
    setEditScore({
      score: score.score,
      xCount: score.xCount,
      status: score.status,
      notes: score.notes,
    });
    onOpen();
  };

  const handleSave = async () => {
    if (!selectedScore) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`/api/admin/scores/${selectedScore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editScore),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Score updated successfully',
          status: 'success',
          duration: 3000,
        });
        onClose();
        // Refresh scores
        const refreshResponse = await fetch(`/api/admin/scores?status=${statusFilter}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setScores(data.scores || []);
        }
      } else {
        throw new Error('Failed to update score');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update score',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDelete = async (scoreId: string) => {
    if (!confirm('Are you sure you want to delete this score? This action cannot be undone.')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const response = await fetch(`/api/admin/scores/${scoreId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Score deleted successfully',
          status: 'success',
          duration: 3000,
        });
        setScores(scores.filter(s => s.id !== scoreId));
      } else {
        throw new Error('Failed to delete score');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete score',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'green',
      pending: 'yellow',
      rejected: 'red',
    };
    return (
      <Badge colorScheme={colors[status as keyof typeof colors] || 'gray'}>
        {status}
      </Badge>
    );
  };

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const filteredScores = scores.filter(score => {
    const matchesSearch = !searchTerm || 
      score.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.club?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.discipline?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <AdminLayout title="Score Management" description="View, edit, and manage all scores">
      <Head>
        <title>Admin Scores - SATRF</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Filters */}
      <Box bg={cardBg} p={4} borderRadius="lg" border="1px" borderColor={borderColor} mb={6}>
        <HStack spacing={4}>
          <Box flex="1">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Search by name, club, or discipline..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Box>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            w="200px"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </HStack>
      </Box>

      {/* Scores Table */}
      <Box bg={cardBg} borderRadius="lg" border="1px" borderColor={borderColor} overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>User</Th>
              <Th>Club</Th>
              <Th>Discipline</Th>
              <Th>Score</Th>
              <Th>X Count</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredScores.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" py={8}>
                  <Text color="gray.500">No scores found</Text>
                </Td>
              </Tr>
            ) : (
              filteredScores.map((score) => (
                <Tr key={score.id}>
                  <Td>{score.userName || 'Unknown'}</Td>
                  <Td>{score.club || '-'}</Td>
                  <Td>{score.discipline || '-'}</Td>
                  <Td fontWeight="semibold">{score.score}</Td>
                  <Td>{score.xCount || 0}</Td>
                  <Td>{getStatusBadge(score.status)}</Td>
                  <Td>{new Date(score.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit score"
                        icon={<FiEdit />}
                        size="sm"
                        onClick={() => handleEdit(score)}
                      />
                      <IconButton
                        aria-label="Delete score"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDelete(score.id)}
                      />
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
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Score</FormLabel>
                <NumberInput
                  value={editScore.score}
                  onChange={(_, value) => setEditScore({ ...editScore, score: value })}
                  min={0}
                  max={109}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>X Count</FormLabel>
                <NumberInput
                  value={editScore.xCount || 0}
                  onChange={(_, value) => setEditScore({ ...editScore, xCount: value })}
                  min={0}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={editScore.status}
                  onChange={(e) => setEditScore({ ...editScore, status: e.target.value as any })}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}

