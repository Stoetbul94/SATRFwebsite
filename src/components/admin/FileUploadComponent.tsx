'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  FormLabel,
  Select,
  Input,
  useColorModeValue,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
} from '@chakra-ui/react';
import { FiUpload, FiX, FiEye, FiAlertCircle } from 'react-icons/fi';
import { auth } from '@/lib/firebase';
import { parseMatchWorkbook, type ParsedImportRow } from '@/lib/excelImport';
import type { ScoreInput } from '@/types/scores';

interface FileUploadComponentProps {
  onImportSuccess: (result: unknown) => void;
  onImportError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface EventOption {
  id: string;
  title: string;
  date?: string;
}

export default function FileUploadComponent({
  onImportSuccess,
  onImportError,
  isLoading,
  setIsLoading,
}: FileUploadComponentProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [matchDate, setMatchDate] = useState(() => new Date().toISOString().slice(0, 10));

  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const [isDragOver, setIsDragOver] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const getToken = async (): Promise<string | null> => {
    if (typeof window !== 'undefined' && localStorage.getItem('__e2e_admin_bypass__') === '1') {
      return localStorage.getItem('access_token');
    }
    const fresh = await auth.currentUser?.getIdToken().catch(() => null);
    if (fresh) return fresh;
    return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await fetch('/api/admin/events', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = (data.events || []) as { id: string; title?: string; name?: string; date?: string }[];
          setEvents(
            list.map((e) => ({
              id: e.id,
              title: e.title || e.name || 'Untitled',
              date: e.date,
            }))
          );
        }
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, []);

  const onEventSelect = (id: string) => {
    setSelectedEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev?.date) {
      const d = ev.date.includes('T') ? ev.date.slice(0, 10) : ev.date;
      setMatchDate(d);
    }
  };

  const parseFile = useCallback(
    (file: File) => {
      if (!selectedEventId) {
        onImportError('Select an event before uploading the workbook');
        return;
      }
      const ev = events.find((e) => e.id === selectedEventId);
      if (!ev) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const rows = parseMatchWorkbook(buffer, {
            eventId: ev.id,
            eventName: ev.title,
            date: matchDate,
          });

          if (rows.length === 0) {
            onImportError('No score rows found. Fill a score sheet (Prone 50m, F-Class, etc.).');
            return;
          }

          const allErrors = rows.flatMap((r) => r.errors ?? []);
          setParsedData(rows);
          setValidationErrors(allErrors);
          setUploadedFile(file);
        } catch {
          onImportError('Failed to parse workbook. Use SATRF_Match_Template.xlsx from the template link.');
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [selectedEventId, events, matchDate, onImportError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  const handleImport = async () => {
    const validRows = parsedData.filter((r) => r.input && !r.errors?.length);
    if (validRows.length === 0) {
      onImportError('No valid rows to import');
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Please log in again');

      const response = await fetch('/api/admin/scores/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scores: validRows.map((r) => r.input as ScoreInput),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail =
          typeof data.details === 'object'
            ? JSON.stringify(data.details).slice(0, 500)
            : data.details;
        throw new Error([data.error, detail].filter(Boolean).join(' — ') || 'Import failed');
      }

      const result = data;
      const errorRows = parsedData.filter((r) => r.errors?.length);

      onImportSuccess({
        success: errorRows.length === 0,
        message: `Imported ${validRows.length} score(s) from ${uploadedFile?.name ?? 'workbook'}`,
        details: {
          imported: validRows.length,
          errors: errorRows.length,
          errorDetails: errorRows.flatMap((r) => r.errors ?? []),
        },
        ...result,
      });

      setUploadedFile(null);
      setParsedData([]);
      setValidationErrors([]);
    } catch (error) {
      onImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const validCount = parsedData.filter((r) => r.input && !r.errors?.length).length;

  if (loadingEvents) {
    return (
      <Box py={6} textAlign="center">
        <Spinner />
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Text fontSize="sm">
          Select the match event first, then upload{' '}
          <strong>SATRF_Match_Template.xlsx</strong>. All sheets in the file are imported (Prone, F-Class,
          3P, Finals).
        </Text>
      </Alert>

      <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
        <FormControl isRequired>
          <FormLabel>Event (links all rows)</FormLabel>
          <Select placeholder="Select event" value={selectedEventId} onChange={(e) => onEventSelect(e.target.value)}>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Default match date</FormLabel>
          <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
        </FormControl>
      </Box>

      <Box
        data-testid="file-drop-zone"
        border="2px dashed"
        borderColor={isDragOver ? 'blue.400' : borderColor}
        borderRadius="lg"
        p={8}
        textAlign="center"
        bg={isDragOver ? 'blue.50' : bgColor}
        cursor={selectedEventId ? 'pointer' : 'not-allowed'}
        opacity={selectedEventId ? 1 : 0.6}
        onClick={() => selectedEventId && document.getElementById('file-input')?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <VStack spacing={4}>
          <FiUpload size={48} />
          <Text fontWeight="medium">{uploadedFile ? uploadedFile.name : 'Drop match workbook here'}</Text>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </VStack>
      </Box>

      {uploadedFile && (
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600">
            {parsedData.length} rows · {validCount} valid
          </Text>
          <HStack>
            <IconButton aria-label="Preview" icon={<FiEye />} size="sm" onClick={onOpen} />
            <Button size="sm" variant="outline" leftIcon={<FiX />} onClick={() => {
              setUploadedFile(null);
              setParsedData([]);
              setValidationErrors([]);
            }}>
              Clear
            </Button>
          </HStack>
        </HStack>
      )}

      {validationErrors.length > 0 && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box maxH="160px" overflowY="auto">
            {validationErrors.slice(0, 8).map((err, i) => (
              <Text key={i} fontSize="sm">
                • {err}
              </Text>
            ))}
          </Box>
        </Alert>
      )}

      {parsedData.length > 0 && (
        <Button
          colorScheme="blue"
          size="lg"
          w="full"
          isLoading={isLoading}
          isDisabled={validCount === 0}
          onClick={handleImport}
        >
          Import {validCount} score{validCount === 1 ? '' : 's'}
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Sheet</Th>
                  <Th>Shooter</Th>
                  <Th>Discipline</Th>
                  <Th>Stage</Th>
                  <Th>Scores</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {parsedData.map((row, i) => (
                  <Tr key={i} bg={row.errors?.length ? 'red.50' : undefined}>
                    <Td>{row.sheet}</Td>
                    <Td>{row.preview.shooterName}</Td>
                    <Td>{row.preview.discipline}</Td>
                    <Td>{row.preview.stage}</Td>
                    <Td>{row.preview.summary}</Td>
                    <Td>
                      {row.errors?.length ? (
                        <Badge colorScheme="red">Errors</Badge>
                      ) : (
                        <Badge colorScheme="green">OK</Badge>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
