import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
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
  useToast,
  Badge,
  useColorModeValue,
  Spinner,
  Center,
  Text,
  Switch,
  VStack,
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
  Input,
  IconButton,
} from '@chakra-ui/react';
import { FiArrowLeft, FiLink, FiXCircle } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import type { EventRegistration } from '@/lib/registrations';
import { disciplinePublicLabel } from '@/lib/eventDisciplines';
import type { Discipline } from '@/types/scores';

interface RegistrationsResponse {
  eventId: string;
  eventTitle: string;
  maxParticipants: number;
  registrations: EventRegistration[];
  summary: {
    total: number;
    members: number;
    guests: number;
    paid: number;
    unpaid: number;
  };
}

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

export default function EventRegistrationsAdmin() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const router = useRouter();
  const { id } = router.query;
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [data, setData] = useState<RegistrationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [linkTarget, setLinkTarget] = useState<EventRegistration | null>(null);
  const [memberIdInput, setMemberIdInput] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const eventId = typeof id === 'string' ? id : '';

  const fetchRegistrations = useCallback(async () => {
    if (!isAdmin || !eventId) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/admin/events/${eventId}/registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load registrations');
      }

      setData(await response.json());
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load registrations',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, eventId, toast]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const patchRegistration = async (
    registrationId: string,
    body: Record<string, unknown>
  ) => {
    const token = await getToken();
    if (!token) return;

    setUpdatingId(registrationId);
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Update failed');
      }

      await fetchRegistrations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Update failed';
      toast({ title: 'Error', description: message, status: 'error', duration: 3000 });
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaidToggle = (reg: EventRegistration, paid: boolean) => {
    patchRegistration(reg.id, { paid });
  };

  const handleCancel = (reg: EventRegistration) => {
    if (!confirm(`Cancel registration for ${reg.name}?`)) return;
    patchRegistration(reg.id, { status: 'cancelled' });
  };

  const openLinkModal = (reg: EventRegistration) => {
    setLinkTarget(reg);
    setMemberIdInput(reg.memberId || '');
    onOpen();
  };

  const handleLinkMember = async () => {
    if (!linkTarget || !memberIdInput.trim()) return;
    await patchRegistration(linkTarget.id, { memberId: memberIdInput.trim() });
    onClose();
    setLinkTarget(null);
    setMemberIdInput('');
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const paymentLabel = (method: EventRegistration['paymentMethod']) => {
    if (!method) return '—';
    if (method === 'payfast') return 'PayFast';
    if (method === 'eft') return 'EFT';
    if (method === 'free') return 'Free';
    return method;
  };

  if (authLoading) {
    return (
      <AdminLayout title="Event Registrations">
        <Center py={20}>
          <Spinner size="xl" color="satrf.navy" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  const summary = data?.summary;
  const capacity =
    data && data.maxParticipants > 0
      ? `${summary?.total ?? 0} registered / ${data.maxParticipants}`
      : `${summary?.total ?? 0} registered`;

  return (
    <AdminLayout title="Event Registrations">
      <Head>
        <title>{data?.eventTitle || 'Event'} Registrations — SATRF Admin</title>
      </Head>

      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <Button
            as={Link}
            href="/admin/events"
            variant="ghost"
            leftIcon={<FiArrowLeft />}
            size="sm"
          >
            Back to Events
          </Button>
        </HStack>

        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="satrf.navy">
            {data?.eventTitle || 'Loading…'}
          </Text>
          {summary && (
            <Text color="gray.600" mt={1}>
              {summary.total} registered — {summary.members} members, {summary.guests} guests
              {data && data.maxParticipants > 0 ? ` · ${capacity}` : ''}
              {' · '}
              {summary.paid} paid, {summary.unpaid} unpaid
            </Text>
          )}
        </Box>

        {loading ? (
          <Center py={16}>
            <Spinner size="lg" color="satrf.navy" />
          </Center>
        ) : (
          <Box
            bg={cardBg}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            overflowX="auto"
          >
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Club</Th>
                  <Th>Discipline</Th>
                  <Th>Registered</Th>
                  <Th>Payment</Th>
                  <Th>Member</Th>
                  <Th>Paid</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {!data?.registrations.length ? (
                  <Tr>
                    <Td colSpan={9} textAlign="center" py={10}>
                      <Text color="gray.500">No registrations yet</Text>
                    </Td>
                  </Tr>
                ) : (
                  data.registrations.map((reg) => (
                    <Tr key={reg.id}>
                      <Td fontWeight="medium">{reg.name}</Td>
                      <Td>{reg.email}</Td>
                      <Td>{reg.club}</Td>
                      <Td>
                        {reg.discipline
                          ? disciplinePublicLabel(reg.discipline as Discipline)
                          : '—'}
                      </Td>
                      <Td whiteSpace="nowrap">{formatDate(reg.createdAt)}</Td>
                      <Td>{paymentLabel(reg.paymentMethod)}</Td>
                      <Td>
                        {reg.isMember && reg.memberId ? (
                          <Button
                            as={Link}
                            href={`/admin/users?search=${encodeURIComponent(reg.email)}`}
                            size="xs"
                            colorScheme="green"
                            variant="solid"
                          >
                            Member
                          </Button>
                        ) : (
                          <Badge colorScheme="gray">Guest</Badge>
                        )}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Switch
                            size="sm"
                            colorScheme="green"
                            isChecked={reg.paid}
                            isDisabled={updatingId === reg.id}
                            onChange={(e) => handlePaidToggle(reg, e.target.checked)}
                          />
                          <Badge colorScheme={reg.paid ? 'green' : 'gray'}>
                            {reg.paid ? 'Paid' : 'Unpaid'}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          {!reg.isMember && (
                            <IconButton
                              aria-label="Link to member"
                              icon={<FiLink />}
                              size="sm"
                              variant="ghost"
                              onClick={() => openLinkModal(reg)}
                            />
                          )}
                          <IconButton
                            aria-label="Cancel registration"
                            icon={<FiXCircle />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            isDisabled={updatingId === reg.id}
                            onClick={() => handleCancel(reg)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Link guest to member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.600" mb={4}>
              {linkTarget
                ? `Link "${linkTarget.name}" (${linkTarget.email}) to an existing member record by user ID.`
                : ''}
            </Text>
            <FormControl>
              <FormLabel>Member user ID</FormLabel>
              <Input
                value={memberIdInput}
                onChange={(e) => setMemberIdInput(e.target.value)}
                placeholder="Firestore users document ID"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleLinkMember} isDisabled={!memberIdInput.trim()}>
              Link member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
