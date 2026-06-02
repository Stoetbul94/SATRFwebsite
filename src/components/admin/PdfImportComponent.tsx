'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  FormControl,
  FormLabel,
  Input,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import { FiSave, FiFileText } from 'react-icons/fi';
import { auth } from '@/lib/firebase';
import { CATEGORIES } from '@/lib/issf';
import type { Category } from '@/types/scores';
import type { ParsePronePdfResult, PdfReportType } from '@/lib/pdfImport/types';
import { parsedPdfToScoreInput } from '@/lib/pdfImport/toScoreInput';

interface PdfImportComponentProps {
  onImportSuccess: (result: unknown) => void;
  onImportError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface MemberOption {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  club: string;
}

interface EventOption {
  id: string;
  title: string;
  date?: string;
}

const getToken = async (): Promise<string | null> => {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function PdfUploadPanel({
  reportType,
  label,
  hint,
  parsed,
  onParsed,
  onClear,
  file,
  onFile,
  onError,
}: {
  reportType: PdfReportType;
  label: string;
  hint: string;
  parsed: ParsePronePdfResult | null;
  onParsed: (r: ParsePronePdfResult | null) => void;
  onClear: () => void;
  file: File | null;
  onFile: (f: File | null) => void;
  onError: (msg: string) => void;
}) {
  const [parsing, setParsing] = useState(false);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      onError('Please upload a PDF file');
      onParsed(null);
      onFile(null);
      return;
    }
    onFile(f);
    onParsed(null);
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Please log in again');

      const pdfBase64 = await fileToBase64(file);
      const res = await fetch('/api/admin/scores/parse-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reportType, pdfBase64 }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.details || 'Failed to parse PDF');
      }
      onParsed(data as ParsePronePdfResult);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to parse PDF');
    } finally {
      setParsing(false);
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box fontSize="sm">
          <Text fontWeight="semibold">{label}</Text>
          <Text mt={1}>{hint}</Text>
        </Box>
      </Alert>

      <FormControl>
        <FormLabel>PDF file</FormLabel>
        <Input type="file" accept=".pdf" onChange={handleSelect} p={1} />
      </FormControl>

      {file && (
        <HStack>
          <Text fontSize="sm" color="gray.600">
            {file.name}
          </Text>
          <Button size="sm" variant="outline" onClick={() => { onFile(null); onParsed(null); onClear(); }}>
            Clear
          </Button>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<FiFileText />}
            onClick={handleParse}
            isLoading={parsing}
            isDisabled={parsing}
          >
            Analyse PDF
          </Button>
        </HStack>
      )}

      {parsed && (
        <Box>
          {parsed.warnings.length > 0 && (
            <Alert status="warning" borderRadius="md" mb={3}>
              <AlertIcon />
              <Box fontSize="sm">
                {parsed.warnings.map((w, i) => (
                  <Text key={i}>• {w}</Text>
                ))}
              </Box>
            </Alert>
          )}
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th>Series</Th>
                <Th>Decimal</Th>
                <Th>Integer</Th>
                <Th>Inner 10s</Th>
              </Tr>
            </Thead>
            <Tbody>
              {parsed.series.map((s) => (
                <Tr key={s.seriesNumber}>
                  <Td>S{s.seriesNumber}</Td>
                  <Td>{s.decimal}</Td>
                  <Td>{s.integer ?? '—'}</Td>
                  <Td>{s.innerTens ?? '—'}</Td>
                </Tr>
              ))}
              <Tr fontWeight="bold">
                <Td>Total</Td>
                <Td>{parsed.decimalTotal}</Td>
                <Td>{parsed.integerTotal ?? '—'}</Td>
                <Td />
              </Tr>
            </Tbody>
          </Table>
          {parsed.series.length < 6 && (
            <Badge colorScheme="orange" mt={2}>
              Need 6 series for official prone match
            </Badge>
          )}
        </Box>
      )}
    </VStack>
  );
}

export default function PdfImportComponent({
  onImportSuccess,
  onImportError,
  isLoading,
  setIsLoading,
}: PdfImportComponentProps) {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<Category>('open');

  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [summaryParsed, setSummaryParsed] = useState<ParsePronePdfResult | null>(null);
  const [targetParsed, setTargetParsed] = useState<ParsePronePdfResult | null>(null);
  const [activePdfTab, setActivePdfTab] = useState(0);
  const loadRefs = useCallback(async () => {
    try {
      setLoadingRefs(true);
      const token = await getToken();
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const [usersRes, eventsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/events', { headers }),
      ]);
      if (usersRes.ok) {
        const data = await usersRes.json();
        const list = (data.users || []) as {
          id: string;
          firstName?: string;
          lastName?: string;
          club?: string;
          status?: string;
          isActive?: boolean;
        }[];
        setMembers(
          list
            .filter((u) => (u.status || 'active') === 'active')
            .map((u) => ({
              id: u.id,
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              club: u.club || '',
              label: `${u.firstName || ''} ${u.lastName || ''}`.trim() + (u.club ? ` (${u.club})` : ''),
            }))
        );
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
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
      setLoadingRefs(false);
    }
  }, []);

  useEffect(() => {
    loadRefs();
  }, [loadRefs]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const activeParsed = activePdfTab === 0 ? summaryParsed : targetParsed;

  const onEventSelect = (id: string) => {
    setSelectedEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev?.date) {
      const d = ev.date.includes('T') ? ev.date.slice(0, 10) : ev.date;
      setDate(d);
    }
  };

  const handleSave = async () => {
    if (!selectedMember) {
      onImportError('Select a member');
      return;
    }
    if (!selectedEvent) {
      onImportError('Select an event');
      return;
    }
    if (!activeParsed || activeParsed.series.length < 6) {
      onImportError('Analyse a PDF with all 6 series first');
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Please log in again');

      const shooterName = `${selectedMember.firstName} ${selectedMember.lastName}`.trim();
      const input = parsedPdfToScoreInput(activeParsed, {
        userId: selectedMember.id,
        shooterName,
        club: selectedMember.club,
        category,
        eventId: selectedEvent.id,
        eventName: selectedEvent.title,
        date,
      });

      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scores: [input] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save score');
      }

      const result = await res.json();
      onImportSuccess({
        success: true,
        message: `Saved prone score (${activeParsed.decimalTotal}) for ${shooterName}`,
        details: { imported: 1, errors: 0 },
        ...result,
      });

      setSummaryFile(null);
      setTargetFile(null);
      setSummaryParsed(null);
      setTargetParsed(null);
    } catch (e) {
      onImportError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingRefs) {
    return (
      <Box py={8} textAlign="center">
        <Spinner />
        <Text mt={2} color="gray.600">
          Loading members and events…
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={6}>
      <Text color="gray.600" fontSize="sm">
        Upload an electronic-target PDF, pick member and event (not read from the file), then save to Firestore.
      </Text>

      <SimpleGridForm
        members={members}
        events={events}
        selectedMemberId={selectedMemberId}
        selectedEventId={selectedEventId}
        category={category}
        date={date}
        onMember={setSelectedMemberId}
        onEvent={onEventSelect}
        onCategory={setCategory}
        onDate={setDate}
      />

      <Divider />

      <Tabs
        index={activePdfTab}
        onChange={(i) => setActivePdfTab(i)}
        variant="soft-rounded"
        colorScheme="blue"
      >
        <TabList>
          <Tab>Summary report</Tab>
          <Tab>Target report</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <PdfUploadPanel
              reportType="summary"
              label="Summary report"
              hint='Looks for lines like "S1 100.7" — series 1–6 only.'
              file={summaryFile}
              onFile={setSummaryFile}
              parsed={summaryParsed}
              onParsed={setSummaryParsed}
              onClear={() => setSummaryParsed(null)}
              onError={onImportError}
            />
          </TabPanel>
          <TabPanel px={0}>
            <PdfUploadPanel
              reportType="target"
              label="Target / match report"
              hint='Reads "SERIES 1" … "TOTAL : 100.7 (95)" for each of the first 6 series.'
              file={targetFile}
              onFile={setTargetFile}
              parsed={targetParsed}
              onParsed={setTargetParsed}
              onClear={() => setTargetParsed(null)}
              onError={onImportError}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Button
        colorScheme="green"
        size="lg"
        leftIcon={<FiSave />}
        onClick={handleSave}
        isLoading={isLoading}
        isDisabled={!activeParsed || activeParsed.series.length < 6 || !selectedMemberId || !selectedEventId}
        w="full"
      >
        Save score from {activePdfTab === 0 ? 'summary' : 'target'} PDF
      </Button>
    </VStack>
  );
}

function SimpleGridForm({
  members,
  events,
  selectedMemberId,
  selectedEventId,
  category,
  date,
  onMember,
  onEvent,
  onCategory,
  onDate,
}: {
  members: MemberOption[];
  events: EventOption[];
  selectedMemberId: string;
  selectedEventId: string;
  category: Category;
  date: string;
  onMember: (id: string) => void;
  onEvent: (id: string) => void;
  onCategory: (c: Category) => void;
  onDate: (d: string) => void;
}) {
  return (
    <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
      <FormControl isRequired>
        <FormLabel>Member</FormLabel>
        <Select placeholder="Select member" value={selectedMemberId} onChange={(e) => onMember(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Event</FormLabel>
        <Select placeholder="Select event" value={selectedEventId} onChange={(e) => onEvent(e.target.value)}>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Match date</FormLabel>
        <Input type="date" value={date} onChange={(e) => onDate(e.target.value)} />
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Category</FormLabel>
        <Select value={category} onChange={(e) => onCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
