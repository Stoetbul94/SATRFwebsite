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
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
} from '@chakra-ui/react';
import { FiSave, FiFileText } from 'react-icons/fi';
import { auth } from '@/lib/firebase';
import { CATEGORIES, POSITION_LABELS } from '@/lib/issf';
import type { Category, ScoreStage } from '@/types/scores';
import type {
  Parse3pPdfResult,
  ParsePronePdfResult,
  PdfReportType,
  ThreePImportMode,
} from '@/lib/pdfImport/types';
import { parsed3pPdfToScoreInput, parsedPdfToScoreInput } from '@/lib/pdfImport/toScoreInput';
import { is3pImportReady, threePImportReadyLabel } from '@/lib/pdfImport/is3pImportReady';
import { GUEST_MEMBER } from '@/lib/scoreFormState';
import { isRegisteredMember, shooterIsAssigned } from '@/lib/pdfImport/shooterAssignment';

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
  membershipType?: string;
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

function stagesForPdfTab(is3pTab: boolean): ScoreStage[] {
  return is3pTab ? ['qualification', '3p_final'] : ['qualification', 'prone_final'];
}

function stageLabel(stage: ScoreStage): string {
  if (stage === 'qualification') return 'Qualification';
  if (stage === 'prone_final') return 'Prone Final';
  return '3P Final';
}

function pdfSaveButtonLabel(
  is3pTab: boolean,
  stage: ScoreStage,
  activePdfTab: number,
  threePImportMode: ThreePImportMode,
): string {
  if (is3pTab) {
    const round = stage === '3p_final' ? '3P final' : '3P qualification';
    const mode = threePImportMode === 'position_aggregate' ? 'position totals' : '6 series';
    return `Save ${round} (${mode})`;
  }
  const round = stage === 'prone_final' ? 'prone final' : 'prone qualification';
  const source = activePdfTab === 0 ? 'summary' : 'target';
  return `Save ${round} from ${source} PDF`;
}

function pdfSaveSuccessMessage(
  is3pTab: boolean,
  stage: ScoreStage,
  decimalTotal: number,
  resolvedName: string,
): string {
  if (is3pTab) {
    const round = stage === '3p_final' ? '3P final' : '3P qualification';
    return `Saved ${round} (${decimalTotal}) for ${resolvedName}`;
  }
  const round = stage === 'prone_final' ? 'prone final' : 'prone qualification';
  return `Saved ${round} (${decimalTotal}) for ${resolvedName}`;
}

function formatApiError(result: Record<string, unknown>): string {
  const parts: string[] = [];
  if (typeof result.error === 'string') parts.push(result.error);
  const details = result.details;
  if (Array.isArray(details)) {
    for (const entry of details) {
      if (entry && typeof entry === 'object' && Array.isArray((entry as { issues?: unknown[] }).issues)) {
        for (const issue of (entry as { issues: { message?: string }[] }).issues) {
          if (issue?.message) parts.push(issue.message);
        }
      }
    }
  } else if (typeof details === 'string') {
    parts.push(details);
  }
  return parts.filter(Boolean).join(' — ') || 'Failed to save score';
}

function PdfSaveChecklist({
  hasShooter,
  hasEvent,
  pdfReady,
  is3pTab,
  threePMode,
}: {
  hasShooter: boolean;
  hasEvent: boolean;
  pdfReady: boolean;
  is3pTab: boolean;
  threePMode: ThreePImportMode;
}) {
  const items = [
    { label: 'Shooter assigned (member or manual name + club)', ok: hasShooter },
    { label: 'Event selected', ok: hasEvent },
    {
      label: is3pTab ? '3P PDF analysed' : 'PDF analysed (6 series)',
      ok: pdfReady,
    },
    ...(is3pTab
      ? [{ label: threePImportReadyLabel(threePMode), ok: pdfReady }]
      : []),
  ];

  return (
    <Box fontSize="sm" color="gray.600" mt={2}>
      {items.map((item) => (
        <Text key={item.label} color={item.ok ? 'green.600' : 'gray.500'}>
          {item.ok ? '✓' : '○'} {item.label}
        </Text>
      ))}
    </Box>
  );
}

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
  reportType: 'summary' | 'target';
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
        const parts = [data.error, data.details].filter(Boolean);
        if (Array.isArray(data.warnings) && data.warnings.length) {
          parts.push(data.warnings.join(' '));
        }
        throw new Error(parts.join(' — ') || 'Failed to parse PDF');
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
          {parsed.warnings.length > 0 && parsed.series.length >= 6 && (
            <Alert status="info" borderRadius="md" mb={3}>
              <AlertIcon />
              <Box fontSize="sm">
                {parsed.warnings.map((w, i) => (
                  <Text key={i}>• {w}</Text>
                ))}
              </Box>
            </Alert>
          )}
          {parsed.warnings.length > 0 && parsed.series.length < 6 && (
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

function ThreePUploadPanel({
  parsed,
  onParsed,
  onClear,
  file,
  onFile,
  onError,
  importMode,
  onImportMode,
}: {
  parsed: Parse3pPdfResult | null;
  onParsed: (r: Parse3pPdfResult | null) => void;
  onClear: () => void;
  file: File | null;
  onFile: (f: File | null) => void;
  onError: (msg: string) => void;
  importMode: ThreePImportMode;
  onImportMode: (m: ThreePImportMode) => void;
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
        body: JSON.stringify({ reportType: '3p_match', pdfBase64 }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const parts = [data.error, data.details].filter(Boolean);
        if (Array.isArray(data.warnings) && data.warnings.length) {
          parts.push(data.warnings.join(' '));
        }
        throw new Error(parts.join(' — ') || 'Failed to parse PDF');
      }
      onParsed(data as Parse3pPdfResult);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to parse PDF');
    } finally {
      setParsing(false);
    }
  };

  const ready = is3pImportReady(parsed, importMode);

  return (
    <VStack align="stretch" spacing={4}>
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box fontSize="sm">
          <Text fontWeight="semibold">3-Position match report (qualification)</Text>
          <Text mt={1}>
            Reads position totals like &quot;Kneeling (Total) : 189.6 (180)&quot; and series lines
            like &quot;Kneeling S1 … 94.6&quot;. Decimal and ring (integer) scores are both imported.
          </Text>
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              onFile(null);
              onParsed(null);
              onClear();
            }}
          >
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
            <Alert status={ready ? 'info' : 'warning'} borderRadius="md" mb={3}>
              <AlertIcon />
              <Box fontSize="sm">
                {parsed.warnings.map((w, i) => (
                  <Text key={i}>• {w}</Text>
                ))}
              </Box>
            </Alert>
          )}

          {parsed.shooterName && (
            <Text fontSize="sm" color="gray.600" mb={2}>
              Name on PDF: {parsed.shooterName} — filled into Shooter name if empty; you can edit or
              replace it.
            </Text>
          )}

          <Text fontWeight="semibold" fontSize="sm" mb={2}>
            Position totals (decimal + ring)
          </Text>
          <Table size="sm" variant="simple" mb={4}>
            <Thead>
              <Tr>
                <Th>Position</Th>
                <Th>Decimal</Th>
                <Th>Ring total</Th>
              </Tr>
            </Thead>
            <Tbody>
              {parsed.positionTotals.map((p) => (
                <Tr key={p.position}>
                  <Td>{POSITION_LABELS[p.position]}</Td>
                  <Td>{p.decimal}</Td>
                  <Td>{p.integer}</Td>
                </Tr>
              ))}
              <Tr fontWeight="bold">
                <Td>Match total</Td>
                <Td>{parsed.decimalTotal}</Td>
                <Td>{parsed.integerTotal ?? '—'}</Td>
              </Tr>
            </Tbody>
          </Table>

          <Text fontWeight="semibold" fontSize="sm" mb={2}>
            Series decimals (6 × 10 shots)
          </Text>
          <Table size="sm" variant="simple" mb={4}>
            <Thead>
              <Tr>
                <Th>Series</Th>
                <Th>Decimal</Th>
              </Tr>
            </Thead>
            <Tbody>
              {parsed.series.map((s) => (
                <Tr key={`${s.position}-S${s.seriesNumber}`}>
                  <Td>
                    {POSITION_LABELS[s.position]} S{s.seriesNumber}
                  </Td>
                  <Td>{s.decimal}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          <FormControl as="fieldset" mb={2}>
            <FormLabel as="legend" fontSize="sm" fontWeight="semibold">
              How to save this qualification score
            </FormLabel>
            <RadioGroup value={importMode} onChange={(v) => onImportMode(v as ThreePImportMode)}>
              <Stack spacing={2}>
                <Radio value="position_aggregate" size="sm">
                  Position totals — decimal + ring per position (matches manual &quot;Total only&quot;)
                </Radio>
                <Radio value="six_series" size="sm">
                  6 series — decimal per series; ring total split across S1/S2 per position
                </Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          {!ready && (
            <Badge colorScheme="orange" mt={2}>
              {threePImportReadyLabel(importMode)}
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
  const [shooterName, setShooterName] = useState('');
  const [club, setClub] = useState('');
  const [veteran, setVeteran] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<Category>('open');
  const [stage, setStage] = useState<ScoreStage>('qualification');

  const [summaryFile, setSummaryFile] = useState<File | null>(null);
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [summaryParsed, setSummaryParsed] = useState<ParsePronePdfResult | null>(null);
  const [targetParsed, setTargetParsed] = useState<ParsePronePdfResult | null>(null);
  const [threePFile, setThreePFile] = useState<File | null>(null);
  const [threePParsed, setThreePParsed] = useState<Parse3pPdfResult | null>(null);
  const [threePImportMode, setThreePImportMode] = useState<ThreePImportMode>('position_aggregate');
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
          membershipType?: string;
        }[];
        setMembers(
          list
            .filter((u) => (u.status || 'active') === 'active')
            .map((u) => ({
              id: u.id,
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              club: u.club || '',
              membershipType: u.membershipType,
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

  useEffect(() => {
    const pdfName = threePParsed?.shooterName?.trim();
    if (!pdfName) return;
    setShooterName((prev) => (prev.trim() ? prev : pdfName));
  }, [threePParsed]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const manualLocked = isRegisteredMember(selectedMemberId);

  const activeProneParsed = activePdfTab === 0 ? summaryParsed : activePdfTab === 1 ? targetParsed : null;
  const is3pTab = activePdfTab === 2;
  const availableStages = stagesForPdfTab(is3pTab);

  const onPdfTabChange = (index: number) => {
    setActivePdfTab(index);
    const nextStages = stagesForPdfTab(index === 2);
    setStage((current) => (nextStages.includes(current) ? current : 'qualification'));
  };

  const threePReady = is3pImportReady(threePParsed, threePImportMode);

  const proneReady = Boolean(activeProneParsed && activeProneParsed.series.length >= 6);

  const hasShooter = shooterIsAssigned(selectedMemberId, shooterName, club);

  const canSave =
    hasShooter &&
    selectedEventId &&
    (is3pTab ? threePReady : proneReady);

  const onMemberSelect = (value: string) => {
    setSelectedMemberId(value);
    if (!value || value === GUEST_MEMBER) {
      setVeteran(false);
      const pdfName = threePParsed?.shooterName?.trim();
      if (pdfName) {
        setShooterName((prev) => (prev.trim() ? prev : pdfName));
      }
      return;
    }
    const m = members.find((x) => x.id === value);
    if (m) {
      setShooterName(`${m.firstName} ${m.lastName}`.trim());
      setClub(m.club);
      setVeteran(m.membershipType === 'veteran');
    }
  };

  const onShooterNameChange = (value: string) => {
    setShooterName(value);
    if (isRegisteredMember(selectedMemberId)) {
      setSelectedMemberId(GUEST_MEMBER);
      setVeteran(false);
    }
  };

  const onClubChange = (value: string) => {
    setClub(value);
    if (isRegisteredMember(selectedMemberId)) {
      setSelectedMemberId(GUEST_MEMBER);
      setVeteran(false);
    }
  };

  const onEventSelect = (id: string) => {
    setSelectedEventId(id);
    const ev = events.find((e) => e.id === id);
    if (ev?.date) {
      const d = ev.date.includes('T') ? ev.date.slice(0, 10) : ev.date;
      setDate(d);
    }
  };

  const handleSave = async () => {
    if (!hasShooter) {
      onImportError('Select a member, or enter shooter name and club manually');
      return;
    }
    if (!selectedEvent) {
      onImportError('Select an event');
      return;
    }
    if (is3pTab) {
      if (!threePReady || !threePParsed) {
        onImportError(
          `Analyse a 3P PDF first — ${threePImportReadyLabel(threePImportMode).toLowerCase()}`
        );
        return;
      }
    } else if (!proneReady || !activeProneParsed) {
      onImportError('Analyse a PDF with all 6 series first');
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Please log in again');

      const isGuest = !isRegisteredMember(selectedMemberId);
      const resolvedName = isGuest
        ? shooterName.trim()
        : `${selectedMember!.firstName} ${selectedMember!.lastName}`.trim();
      const scoreOpts = {
        userId: isGuest ? null : selectedMemberId,
        shooterName: resolvedName,
        club: isGuest ? club.trim() : selectedMember!.club,
        category,
        isVeteran: veteran,
        eventId: selectedEvent.id,
        eventName: selectedEvent.title,
        date,
        stage,
      };

      const input = is3pTab
        ? parsed3pPdfToScoreInput(threePParsed!, threePImportMode, scoreOpts)
        : parsedPdfToScoreInput(activeProneParsed!, scoreOpts);

      const res = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scores: [input] }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(formatApiError(result));
      }

      const replaced = typeof result.replaced === 'number' ? result.replaced : 0;
      const message =
        typeof result.message === 'string'
          ? result.message
          : pdfSaveSuccessMessage(
              is3pTab,
              stage,
              is3pTab ? threePParsed!.decimalTotal : activeProneParsed!.decimalTotal,
              resolvedName,
            );

      onImportSuccess({
        success: true,
        message,
        details: { imported: 1, errors: 0, replaced },
        ...result,
      });

      setSummaryFile(null);
      setTargetFile(null);
      setThreePFile(null);
      setSummaryParsed(null);
      setTargetParsed(null);
      setThreePParsed(null);
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
        Upload an electronic-target PDF, assign a registered member or type a guest name and club,
        pick the event, then save.
      </Text>

      <SimpleGridForm
        members={members}
        events={events}
        selectedMemberId={selectedMemberId}
        selectedEventId={selectedEventId}
        shooterName={shooterName}
        club={club}
        veteran={veteran}
        manualLocked={manualLocked}
        category={category}
        date={date}
        stage={stage}
        availableStages={availableStages}
        onMember={onMemberSelect}
        onShooterName={onShooterNameChange}
        onClub={onClubChange}
        onVeteran={setVeteran}
        onEvent={onEventSelect}
        onCategory={setCategory}
        onDate={setDate}
        onStage={setStage}
      />

      <Divider />

      <Tabs
        index={activePdfTab}
        onChange={onPdfTabChange}
        variant="soft-rounded"
        colorScheme="blue"
      >
        <TabList flexWrap="wrap">
          <Tab>Prone summary</Tab>
          <Tab>Prone target</Tab>
          <Tab>3P match report</Tab>
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
          <TabPanel px={0}>
            <ThreePUploadPanel
              file={threePFile}
              onFile={setThreePFile}
              parsed={threePParsed}
              onParsed={setThreePParsed}
              onClear={() => setThreePParsed(null)}
              onError={onImportError}
              importMode={threePImportMode}
              onImportMode={setThreePImportMode}
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
        isDisabled={!canSave}
        w="full"
      >
        {pdfSaveButtonLabel(is3pTab, stage, activePdfTab, threePImportMode)}
      </Button>

      {!canSave && (
        <PdfSaveChecklist
          hasShooter={hasShooter}
          hasEvent={Boolean(selectedEventId)}
          pdfReady={is3pTab ? threePReady : proneReady}
          is3pTab={is3pTab}
          threePMode={threePImportMode}
        />
      )}
    </VStack>
  );
}

function SimpleGridForm({
  members,
  events,
  selectedMemberId,
  selectedEventId,
  shooterName,
  club,
  veteran,
  manualLocked,
  category,
  date,
  stage,
  availableStages,
  onMember,
  onShooterName,
  onClub,
  onVeteran,
  onEvent,
  onCategory,
  onDate,
  onStage,
}: {
  members: MemberOption[];
  events: EventOption[];
  selectedMemberId: string;
  selectedEventId: string;
  shooterName: string;
  club: string;
  veteran: boolean;
  manualLocked: boolean;
  category: Category;
  date: string;
  stage: ScoreStage;
  availableStages: ScoreStage[];
  onMember: (id: string) => void;
  onShooterName: (value: string) => void;
  onClub: (value: string) => void;
  onVeteran: (value: boolean) => void;
  onEvent: (id: string) => void;
  onCategory: (c: Category) => void;
  onDate: (d: string) => void;
  onStage: (stage: ScoreStage) => void;
}) {
  return (
    <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
      <FormControl gridColumn={{ md: 'span 2' }}>
        <FormLabel>Member</FormLabel>
        <Select
          placeholder="Select member or type name below"
          value={selectedMemberId}
          onChange={(e) => onMember(e.target.value)}
        >
          <option value={GUEST_MEMBER}>— Guest / manual name —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>
        <Text fontSize="xs" color="gray.500" mt={1}>
          Linked members see scores on their dashboard when saved.
        </Text>
      </FormControl>
      <FormControl>
        <FormLabel>Shooter name</FormLabel>
        <Input
          value={shooterName}
          onChange={(e) => onShooterName(e.target.value)}
          placeholder="First Last"
          isDisabled={manualLocked}
        />
      </FormControl>
      <FormControl>
        <FormLabel>Club</FormLabel>
        <Input
          value={club}
          onChange={(e) => onClub(e.target.value)}
          isDisabled={manualLocked}
        />
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
          {CATEGORIES.filter((c) => c.id !== 'veteran').map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormControl>
      <FormControl isRequired>
        <FormLabel>Round</FormLabel>
        <Select value={stage} onChange={(e) => onStage(e.target.value as ScoreStage)}>
          {availableStages.map((s) => (
            <option key={s} value={s}>
              {stageLabel(s)}
            </option>
          ))}
        </Select>
      </FormControl>
      {category === 'open' && (
        <FormControl display="flex" alignItems="flex-end">
          <Checkbox isChecked={veteran} onChange={(e) => onVeteran(e.target.checked)}>
            Veteran (Open category)
          </Checkbox>
        </FormControl>
      )}
    </Box>
  );
}
