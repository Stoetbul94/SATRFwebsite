'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  SimpleGrid,
  Text,
  Button,
  Input,
  Select,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Divider,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';
import { auth } from '@/lib/firebase';
import { isE2eAdminBypassActive } from '@/lib/e2eBypass';
import { DISCIPLINES, CATEGORIES, POSITION_LABELS, SHOTS_PER_SERIES } from '@/lib/issf';
import type { Category, Discipline, Position } from '@/types/scores';

interface ManualEntryComponentProps {
  onImportSuccess: (result: any) => void;
  onImportError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface SeriesEntry {
  decimal: string; // kept as string for input control
  integer: string;
}

/** Accepts "70.9" or "70,9" (common on ZA keyboards). */
function parseDecimalValue(raw: string): number {
  const normalized = raw.trim().replace(',', '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

interface StagedScore {
  id: string;
  shooterName: string;
  club: string;
  category: Category;
  veteran: boolean;
  discipline: Discipline;
  decimalTotal: number;
}

interface MemberOption {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  club: string;
  status?: string;
}

interface EventOption {
  id: string;
  title: string;
  date?: string;
}

const GUEST_MEMBER = '__guest__';
const CUSTOM_EVENT = '__custom__';

const getToken = async (): Promise<string | null> => {
  if (isE2eAdminBypassActive()) {
    return localStorage.getItem('access_token');
  }
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

function emptySeries(): SeriesEntry {
  return { decimal: '', integer: '' };
}

function makePositionSeries(discipline: Discipline): Record<Position, SeriesEntry[]> {
  const spec = DISCIPLINES[discipline];
  const map = {} as Record<Position, SeriesEntry[]>;
  spec.positions.forEach((pos) => {
    map[pos] = Array.from({ length: spec.seriesPerPosition }, emptySeries);
  });
  return map;
}

export default function ManualEntryComponent({
  onImportSuccess,
  onImportError,
  isLoading,
  setIsLoading,
}: ManualEntryComponentProps) {
  const [discipline, setDiscipline] = useState<Discipline>('prone_50m');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [events, setEvents] = useState<EventOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [shooterName, setShooterName] = useState('');
  const [club, setClub] = useState('');
  const [category, setCategory] = useState<Category>('open');
  const [veteran, setVeteran] = useState(false);
  const [seriesByPosition, setSeriesByPosition] = useState<Record<Position, SeriesEntry[]>>(
    makePositionSeries('prone_50m')
  );

  const [staged, setStaged] = useState<StagedScore[]>([]);
  const [stagedInputs, setStagedInputs] = useState<any[]>([]); // ScoreInput[] kept in parallel

  const spec = DISCIPLINES[discipline];

  const loadMembersAndEvents = useCallback(async () => {
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
          email?: string;
          club?: string;
          status?: string;
          role?: string;
          isActive?: boolean;
        }[];
        const active = list.filter((u) => {
          const s = u.status || (u.isActive === false ? 'suspended' : 'active');
          return s === 'active';
        });
        setMembers(
          active.map((u) => ({
            id: u.id,
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            club: u.club || '',
            status: u.status,
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
            title: e.title || e.name || 'Untitled event',
            date: e.date,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to load members/events:', err);
    } finally {
      setLoadingRefs(false);
    }
  }, []);

  useEffect(() => {
    loadMembersAndEvents();
  }, [loadMembersAndEvents]);

  const onEventSelect = (value: string) => {
    setSelectedEventId(value);
    if (value === CUSTOM_EVENT) {
      setEventName('');
      return;
    }
    const ev = events.find((e) => e.id === value);
    if (ev) {
      setEventName(ev.title);
      if (ev.date) {
        const d = ev.date.includes('T') ? ev.date.slice(0, 10) : ev.date;
        setDate(d);
      }
    }
  };

  const onMemberSelect = (value: string) => {
    setSelectedMemberId(value);
    if (value === GUEST_MEMBER) {
      setShooterName('');
      setClub('');
      return;
    }
    const m = members.find((x) => x.id === value);
    if (m) {
      setShooterName(`${m.firstName} ${m.lastName}`.trim());
      setClub(m.club);
    }
  };

  const positionTotals = useMemo(() => {
    const totals: Partial<Record<Position, number>> = {};
    spec.positions.forEach((pos) => {
      totals[pos] = round1(
        (seriesByPosition[pos] ?? []).reduce((sum, s) => sum + parseDecimalValue(s.decimal), 0)
      );
    });
    return totals;
  }, [seriesByPosition, spec.positions]);

  const grandTotal = useMemo(
    () => round1(Object.values(positionTotals).reduce((a, b) => a + (b || 0), 0)),
    [positionTotals]
  );

  const changeDiscipline = (d: Discipline) => {
    setDiscipline(d);
    setSeriesByPosition(makePositionSeries(d));
  };

  const updateSeries = (pos: Position, idx: number, field: keyof SeriesEntry, value: string) => {
    setSeriesByPosition((prev) => {
      const next = { ...prev, [pos]: [...prev[pos]] };
      next[pos][idx] = { ...next[pos][idx], [field]: value };
      return next;
    });
  };

  const resetShooter = () => {
    setSelectedMemberId('');
    setShooterName('');
    setClub('');
    setVeteran(false);
    setSeriesByPosition(makePositionSeries(discipline));
  };

  const buildInput = () => ({
    userId: selectedMemberId && selectedMemberId !== GUEST_MEMBER ? selectedMemberId : null,
    shooterName: shooterName.trim(),
    club: club.trim(),
    category,
    eventId: selectedEventId && selectedEventId !== CUSTOM_EVENT ? selectedEventId : '',
    eventName: eventName.trim(),
    date,
    discipline,
    scoringType: 'decimal' as const,
    status: 'official' as const,
    source: 'manual' as const,
    positions: spec.positions.map((pos) => ({
      position: pos,
      series: seriesByPosition[pos].map((s, i) => ({
        seriesNumber: i + 1,
        decimal: parseDecimalValue(s.decimal),
        integer: parseInt(s.integer, 10) || 0,
      })),
    })),
  });

  const validateLocal = (): string | null => {
    if (!eventName.trim() && selectedEventId !== CUSTOM_EVENT && !selectedEventId) {
      return 'Select an event or enter a custom event name';
    }
    if (!eventName.trim()) return 'Event name is required';
    if (!shooterName.trim()) return 'Select a member or enter shooter name (guest)';
    if (!club.trim()) return 'Club is required';
    const anyScore = spec.positions.some((pos) =>
      seriesByPosition[pos].some((s) => parseDecimalValue(s.decimal) > 0)
    );
    if (!anyScore) return 'Enter at least one series score';
    return null;
  };

  const addToBatch = () => {
    const err = validateLocal();
    if (err) {
      onImportError(err);
      return;
    }
    const input = buildInput();
    setStagedInputs((prev) => [...prev, input]);
    setStaged((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        shooterName: input.shooterName,
        club: input.club,
        category: input.category,
        veteran,
        discipline,
        decimalTotal: grandTotal,
      },
    ]);
    resetShooter();
  };

  const removeStaged = (idx: number) => {
    setStaged((prev) => prev.filter((_, i) => i !== idx));
    setStagedInputs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    // Include the current (un-staged) shooter if filled in.
    const inputs = [...stagedInputs];
    const localErr = validateLocal();
    if (shooterName.trim()) {
      if (localErr) {
        onImportError(localErr);
        return;
      }
      inputs.push(buildInput());
    }
    if (inputs.length === 0) {
      onImportError(
        stagedInputs.length > 0
          ? 'No scores to save'
          : localErr || 'Enter shooter details and scores, or add rows with "+ Add another shooter" first'
      );
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication required. Please log in again.');

      const response = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scores: inputs }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail =
          typeof data.details === 'string'
            ? data.details
            : data.details
              ? JSON.stringify(data.details)
              : '';
        throw new Error([data.error, detail].filter(Boolean).join(' — ') || 'Failed to save scores');
      }

      onImportSuccess({
        success: true,
        message: data.message || `Saved ${inputs.length} score(s)`,
      });
      setStaged([]);
      setStagedInputs([]);
      resetShooter();
    } catch (error) {
      onImportError(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Match-level fields */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <FormControl>
          <FormLabel>Discipline</FormLabel>
          <Select value={discipline} onChange={(e) => changeDiscipline(e.target.value as Discipline)}>
            {Object.values(DISCIPLINES).map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Event</FormLabel>
          <Select
            placeholder={loadingRefs ? 'Loading events…' : 'Select event'}
            value={selectedEventId}
            onChange={(e) => onEventSelect(e.target.value)}
          >
            <option value={CUSTOM_EVENT}>— Custom event name —</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
                {e.date ? ` (${String(e.date).slice(0, 10)})` : ''}
              </option>
            ))}
          </Select>
          {(selectedEventId === CUSTOM_EVENT || !selectedEventId) && (
            <Input
              mt={2}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Event name (required if not selected above)"
              isRequired
            />
          )}
          {!selectedEventId && (
            <Text fontSize="xs" color="orange.400" mt={1}>
              Pick an event from the list, or choose &quot;Custom event name&quot; and type the match name.
            </Text>
          )}
        </FormControl>
        <FormControl>
          <FormLabel>Date</FormLabel>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormControl>
      </SimpleGrid>

      <Divider />

      {/* Shooter fields */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <FormControl gridColumn={{ md: 'span 2' }}>
          <FormLabel>Member</FormLabel>
          <Select
            placeholder={loadingRefs ? 'Loading members…' : 'Select active member'}
            value={selectedMemberId}
            onChange={(e) => onMemberSelect(e.target.value)}
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
            onChange={(e) => {
              setShooterName(e.target.value);
              if (selectedMemberId && selectedMemberId !== GUEST_MEMBER) setSelectedMemberId(GUEST_MEMBER);
            }}
            placeholder="First Last"
            isDisabled={!!selectedMemberId && selectedMemberId !== GUEST_MEMBER}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Club</FormLabel>
          <Input
            value={club}
            onChange={(e) => setClub(e.target.value)}
            isDisabled={!!selectedMemberId && selectedMemberId !== GUEST_MEMBER}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Category</FormLabel>
          <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl display="flex" alignItems="flex-end">
          <Checkbox isChecked={veteran} onChange={(e) => setVeteran(e.target.checked)}>
            Veteran
          </Checkbox>
        </FormControl>
      </SimpleGrid>

      {/* Series inputs per position */}
      {spec.positions.map((pos) => (
        <Box key={pos} borderWidth="1px" borderRadius="md" p={4}>
          <HStack justify="space-between" mb={3}>
            <Heading size="sm">{POSITION_LABELS[pos]}</Heading>
            <Badge colorScheme="blue">Subtotal: {positionTotals[pos]?.toFixed(1)}</Badge>
          </HStack>
          <SimpleGrid columns={{ base: 2, md: spec.seriesPerPosition }} spacing={3}>
            {seriesByPosition[pos].map((s, i) => (
              <Box key={i}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  Series {i + 1} (max {(SHOTS_PER_SERIES * 10.9).toFixed(1)})
                </Text>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="109"
                  placeholder="decimal"
                  value={s.decimal}
                  onChange={(e) => updateSeries(pos, i, 'decimal', e.target.value)}
                  size="sm"
                  mb={1}
                />
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="ring (opt)"
                  value={s.integer}
                  onChange={(e) => updateSeries(pos, i, 'integer', e.target.value)}
                  size="sm"
                />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      ))}

      <HStack justify="space-between">
        <Badge fontSize="md" colorScheme="green" px={3} py={1}>
          Grand total: {grandTotal.toFixed(1)}
        </Badge>
        <Button leftIcon={<FiPlus />} onClick={addToBatch} variant="outline" colorScheme="blue">
          Add another shooter
        </Button>
      </HStack>

      {/* Staged batch */}
      {staged.length > 0 && (
        <Box overflowX="auto" borderWidth="1px" borderRadius="md">
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Shooter</Th>
                <Th>Club</Th>
                <Th>Category</Th>
                <Th>Discipline</Th>
                <Th isNumeric>Total</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {staged.map((row, idx) => (
                <Tr key={row.id}>
                  <Td>{row.shooterName}</Td>
                  <Td>{row.club}</Td>
                  <Td>{row.category}</Td>
                  <Td>{DISCIPLINES[row.discipline].label}</Td>
                  <Td isNumeric>{row.decimalTotal.toFixed(1)}</Td>
                  <Td>
                    <IconButton
                      aria-label="Remove"
                      icon={<FiTrash2 />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeStaged(idx)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Button
        leftIcon={<FiSave />}
        colorScheme="blue"
        size="lg"
        onClick={handleSave}
        isLoading={isLoading}
        loadingText="Saving..."
        w="full"
      >
        Save {staged.length + (shooterName.trim() ? 1 : 0)} score(s)
      </Button>
    </VStack>
  );
}
