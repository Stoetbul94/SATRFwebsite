import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Center,
  Checkbox,
  CheckboxGroup,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
  useDisclosure,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiArrowLeft, FiDownload, FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminEventSubNav from '@/components/admin/AdminEventSubNav';
import { useAdminRoute } from '@/hooks/useAdminRoute';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import type { CallForEntriesData } from '@/lib/eventDocuments/callForEntries/types';
import type { SerializedEventDocument } from '@/lib/eventDocuments/types';
import { formatEventDate } from '@/lib/eventDisplay';

type AdminDocument = SerializedEventDocument & { stale?: boolean };

type DocumentsResponse = {
  eventId: string;
  eventTitle: string;
  documents: AdminDocument[];
  selectableEvents: Array<{ id: string; title: string; date: string | null }>;
};

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

function statusColor(status: AdminDocument['status']): string {
  if (status === 'published') return 'green';
  if (status === 'archived') return 'orange';
  return 'gray';
}

export default function AdminEventDocumentsPage() {
  useProtectedRoute();
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const router = useRouter();
  const { id } = router.query;
  const eventId = typeof id === 'string' ? id : '';
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [data, setData] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [linkedEventIds, setLinkedEventIds] = useState<string[]>([]);
  const [form, setForm] = useState<CallForEntriesData | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!isAdmin || !eventId) return;
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const response = await fetch(`/api/admin/events/${eventId}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to load documents');
      setData(await response.json());
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load documents', status: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAdmin, eventId, toast]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  const callForEntriesDocs = useMemo(
    () => (data?.documents || []).filter((doc) => doc.type === 'call-for-entries'),
    [data?.documents],
  );

  const openGenerator = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      setGenerating(true);
      const response = await fetch(`/api/admin/events/${eventId}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'prefill', linkedEventIds: [eventId] }),
      });
      if (!response.ok) throw new Error('Failed to prefill form');
      const payload = await response.json();
      setForm(payload.prefill);
      setLinkedEventIds(payload.prefill.linkedEventIds || [eventId]);
      setPreviewHtml(null);
      onOpen();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not open generator', status: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const refreshPrefill = async (nextLinkedIds: string[]) => {
    const token = await getToken();
    if (!token) return;

    const response = await fetch(`/api/admin/events/${eventId}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'prefill', linkedEventIds: nextLinkedIds }),
    });
    if (!response.ok) return;
    const payload = await response.json();
    setForm(payload.prefill);
  };

  const handlePreview = async () => {
    if (!form) return;
    const token = await getToken();
    if (!token) return;

    try {
      setGenerating(true);
      const response = await fetch(
        `/api/admin/events/${eventId}/documents/call-for-entries`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...form, action: 'preview' }),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Preview failed');
      }
      const payload = await response.json();
      setPreviewHtml(payload.html);
    } catch (error: unknown) {
      toast({
        title: 'Preview failed',
        description: error instanceof Error ? error.message : 'Preview failed',
        status: 'error',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!form) return;
    const token = await getToken();
    if (!token) return;

    try {
      setGenerating(true);
      const response = await fetch(
        `/api/admin/events/${eventId}/documents/call-for-entries`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        },
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Generate failed');
      }
      toast({ title: 'Draft saved', status: 'success' });
      onClose();
      await fetchDocuments();
    } catch (error: unknown) {
      toast({
        title: 'Generate failed',
        description: error instanceof Error ? error.message : 'Generate failed',
        status: 'error',
      });
    } finally {
      setGenerating(false);
    }
  };

  const documentAction = async (documentId: string, action: 'publish' | 'archive' | 'delete') => {
    const token = await getToken();
    if (!token) return;

    setBusyId(documentId);
    try {
      const response = await fetch(`/api/admin/events/documents/${documentId}`, {
        method: action === 'delete' ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: action === 'delete' ? undefined : JSON.stringify({ action }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Action failed');
      }
      toast({ title: 'Updated', status: 'success' });
      await fetchDocuments();
    } catch (error: unknown) {
      toast({
        title: 'Action failed',
        description: error instanceof Error ? error.message : 'Action failed',
        status: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <AdminLayout title="Event Documents">
        <Center py={20}>
          <Spinner size="xl" color="satrf.navy" />
        </Center>
      </AdminLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <AdminLayout title="Event Documents">
      <Head>
        <title>{data?.eventTitle || 'Event'} Documents — SATRF Admin</title>
      </Head>

      <VStack align="stretch" spacing={6}>
        <Button
          as={Link}
          href="/admin/events"
          variant="ghost"
          leftIcon={<FiArrowLeft />}
          alignSelf="flex-start"
          size="sm"
        >
          Back to Events
        </Button>

        <Box>
          <Text fontSize="2xl" fontWeight="bold" color="satrf.navy">
            {data?.eventTitle || 'Loading…'}
          </Text>
          <Text color="text.muted" mt={1}>
            Event documents and Call for Entries
          </Text>
        </Box>

        <AdminEventSubNav eventId={eventId} />

        {loading ? (
          <Center py={12}>
            <Spinner color="satrf.navy" />
          </Center>
        ) : (
          <>
            <Box
              p={5}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              data-testid="admin-call-for-entries-section"
            >
              <Text fontWeight="bold" mb={1}>
                Call for Entries
              </Text>
              <Text fontSize="sm" color="text.muted" mb={4}>
                Generate a branded SATRF Call for Entries PDF. Drafts stay private until published.
              </Text>
              <Button colorScheme="green" onClick={openGenerator} isLoading={generating}>
                Generate Call for Entries
              </Button>
            </Box>

            <Divider />

            <Box data-testid="admin-documents-list">
              <Text fontWeight="bold" mb={4}>
                Documents
              </Text>
              {callForEntriesDocs.length === 0 ? (
                <Text color="text.muted">No Call for Entries documents yet.</Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  {callForEntriesDocs.map((doc) => (
                    <Box
                      key={doc.id}
                      p={4}
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="lg"
                    >
                      <HStack justify="space-between" flexWrap="wrap" gap={2}>
                        <Box>
                          <Text fontWeight="semibold">
                            {doc.title} v{doc.version}
                          </Text>
                          <HStack mt={1} spacing={2}>
                            <Badge colorScheme={statusColor(doc.status)}>{doc.status}</Badge>
                            {doc.updatedAt && (
                              <Text fontSize="sm" color="text.muted">
                                Updated {formatEventDate(doc.updatedAt)}
                              </Text>
                            )}
                          </HStack>
                          {doc.stale && (
                            <Alert status="warning" mt={3} borderRadius="md" py={2}>
                              <AlertIcon />
                              Event details have changed. This Call for Entries may be outdated.
                            </Alert>
                          )}
                        </Box>
                        <HStack flexWrap="wrap">
                          {doc.fileUrl && (
                            <>
                              <Button
                                as="a"
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="sm"
                                leftIcon={<FiExternalLink />}
                              >
                                View
                              </Button>
                              <Button
                                as="a"
                                href={doc.fileUrl}
                                download={doc.downloadFileName || undefined}
                                size="sm"
                                leftIcon={<FiDownload />}
                              >
                                Download
                              </Button>
                            </>
                          )}
                          {doc.status === 'draft' && (
                            <>
                              <Button
                                size="sm"
                                colorScheme="green"
                                isLoading={busyId === doc.id}
                                onClick={() => documentAction(doc.id, 'publish')}
                              >
                                Publish
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                isLoading={busyId === doc.id}
                                onClick={() => documentAction(doc.id, 'delete')}
                              >
                                Delete draft
                              </Button>
                            </>
                          )}
                          {doc.status === 'published' && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="orange"
                              isLoading={busyId === doc.id}
                              onClick={() => documentAction(doc.id, 'archive')}
                            >
                              Archive
                            </Button>
                          )}
                        </HStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </Box>
          </>
        )}
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="960px">
          <ModalHeader>Generate Call for Entries</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {form && (
              <VStack align="stretch" spacing={4}>
                <FormControl>
                  <FormLabel>Document title</FormLabel>
                  <Input
                    value={form.documentTitle}
                    onChange={(e) => setForm({ ...form, documentTitle: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Linked events</FormLabel>
                  <CheckboxGroup
                    value={linkedEventIds}
                    onChange={(values) => {
                      const next = values as string[];
                      setLinkedEventIds(next);
                      void refreshPrefill(next);
                    }}
                  >
                    <Stack spacing={2}>
                      {(data?.selectableEvents || []).map((event) => (
                        <Checkbox key={event.id} value={event.id}>
                          {event.title}
                          {event.date ? ` — ${formatEventDate(event.date)}` : ''}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                </FormControl>

                {form.events.map((eventBlock, index) => (
                  <Box
                    key={eventBlock.eventId}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    borderColor={borderColor}
                  >
                    <Text fontWeight="semibold" mb={3}>
                      Event {index + 1}
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      <FormControl>
                        <FormLabel>Title</FormLabel>
                        <Input
                          value={eventBlock.title}
                          onChange={(e) => {
                            const events = [...form.events];
                            events[index] = { ...events[index], title: e.target.value };
                            setForm({ ...form, events });
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Discipline</FormLabel>
                        <Input
                          value={eventBlock.disciplineLabel}
                          onChange={(e) => {
                            const events = [...form.events];
                            events[index] = { ...events[index], disciplineLabel: e.target.value };
                            setForm({ ...form, events });
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Date label</FormLabel>
                        <Input
                          value={eventBlock.dateLabel}
                          onChange={(e) => {
                            const events = [...form.events];
                            events[index] = { ...events[index], dateLabel: e.target.value };
                            setForm({ ...form, events });
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Start time</FormLabel>
                        <Input
                          value={eventBlock.startTime || ''}
                          onChange={(e) => {
                            const events = [...form.events];
                            events[index] = { ...events[index], startTime: e.target.value };
                            setForm({ ...form, events });
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Equipment inspection</FormLabel>
                        <Input
                          value={eventBlock.equipmentInspectionTime || ''}
                          onChange={(e) => {
                            const events = [...form.events];
                            events[index] = {
                              ...events[index],
                              equipmentInspectionTime: e.target.value,
                            };
                            setForm({ ...form, events });
                          }}
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Entries close</FormLabel>
                        <Input
                          value={eventBlock.registrationDeadlineLabel || ''}
                          onChange={(e) => {
                            const events = [...form.events];
                            events[index] = {
                              ...events[index],
                              registrationDeadlineLabel: e.target.value,
                            };
                            setForm({ ...form, events });
                          }}
                        />
                      </FormControl>
                      <FormControl gridColumn={{ md: 'span 2' }}>
                        <FormLabel>Venue</FormLabel>
                        <Input
                          value={eventBlock.venue}
                          onChange={(e) => {
                            const events = [...form.events];
                            events[index] = { ...events[index], venue: e.target.value };
                            setForm({ ...form, events });
                          }}
                        />
                      </FormControl>
                    </SimpleGrid>
                  </Box>
                ))}

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl>
                    <FormLabel>Entry fee</FormLabel>
                    <Input
                      value={form.entryFeeLabel || ''}
                      onChange={(e) => setForm({ ...form, entryFeeLabel: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Contact name</FormLabel>
                    <Input
                      value={form.contactName || ''}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Contact phone</FormLabel>
                    <Input
                      value={form.contactPhone || ''}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Contact email</FormLabel>
                    <Input
                      value={form.contactEmail || ''}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Registration info</FormLabel>
                  <Textarea
                    value={form.registrationInfo || ''}
                    onChange={(e) => setForm({ ...form, registrationInfo: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Payment information</FormLabel>
                  <Textarea
                    value={form.paymentInfo || ''}
                    onChange={(e) => setForm({ ...form, paymentInfo: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Map / directions</FormLabel>
                  <Textarea
                    value={form.mapDirections || ''}
                    onChange={(e) => setForm({ ...form, mapDirections: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Additional notes</FormLabel>
                  <Textarea
                    value={form.additionalNotes || ''}
                    onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
                  />
                </FormControl>

                {previewHtml && (
                  <Box
                    borderWidth="1px"
                    borderRadius="md"
                    overflow="hidden"
                    data-testid="call-for-entries-preview"
                  >
                    <iframe
                      title="Call for Entries preview"
                      srcDoc={previewHtml}
                      style={{ width: '100%', minHeight: '480px', border: 0 }}
                    />
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              leftIcon={<FiRefreshCw />}
              mr={3}
              onClick={handlePreview}
              isLoading={generating}
            >
              Preview
            </Button>
            <Button colorScheme="green" onClick={handleGenerateDraft} isLoading={generating}>
              Save Draft
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
