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
import {
  DISCIPLINES,
  CATEGORIES,
  POSITION_LABELS,
  SHOTS_PER_SERIES,
  MAX_5SHOT_SERIES_DECIMAL,
  MAX_DECIMAL_PER_POSITION_3P,
} from '@/lib/issf';
import type { Category, Discipline, Position, ScoreStage } from '@/types/scores';

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

type PositionEntryMode = 'series' | 'total';

function makePositionSeries(discipline: Discipline): Record<Position, SeriesEntry[]> {
  const spec = DISCIPLINES[discipline];
  const map = {} as Record<Position, SeriesEntry[]>;
  spec.positions.forEach((pos) => {
    map[pos] = Array.from({ length: spec.seriesPerPosition }, emptySeries);
  });
  return map;
}

function makePositionEntryMode(discipline: Discipline): Record<Position, PositionEntryMode> {
  const map = {} as Record<Position, PositionEntryMode>;
  DISCIPLINES[discipline].positions.forEach((pos) => {
    map[pos] = 'series';
  });
  return map;
}

function isThreePQual(discipline: Discipline, stage: ScoreStage): boolean {
  return discipline === 'three_position_50m' && stage === 'qualification';
}

export default function ManualEntryComponent({
  onImportSuccess,
  onImportError,
  isLoading,
  setIsLoading,
}: ManualEntryComponentProps) {
  const [discipline, setDiscipline] = useState<Discipline>('prone_50m');
  const [stage, setStage] = useState<ScoreStage>('qualification');
  const [finalRank, setFinalRank] = useState('');
  const [elimShots, setElimShots] = useState<string[]>(['', '', '', '', '']);
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
  const [positionEntryMode, setPositionEntryMode] = useState<Record<Position, PositionEntryMode>>(
    makePositionEntryMode('prone_50m')
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
    const threePQual = isThreePQual(discipline, stage);
    spec.positions.forEach((pos) => {
      const entries = seriesByPosition[pos] ?? [];
      if (threePQual && positionEntryMode[pos] === 'total') {
        totals[pos] = round1(parseDecimalValue(entries[0]?.decimal ?? ''));
      } else {
        totals[pos] = round1(entries.reduce((sum, s) => sum + parseDecimalValue(s.decimal), 0));
      }
    });
    return totals;
  }, [seriesByPosition, positionEntryMode, discipline, stage, spec.positions]);

  const grandTotal = useMemo(
    () => round1(Object.values(positionTotals).reduce((a, b) => a + (b || 0), 0)),
    [positionTotals]
  );

  const availableStages = useMemo((): ScoreStage[] => {
    if (discipline === 'three_position_50m') return ['qualification', '3p_final'];
    if (discipline === 'prone_50m') return ['qualification', 'prone_final'];
    return ['qualification'];
  }, [discipline]);

  const changeDiscipline = (d: Discipline) => {
    setDiscipline(d);
    setStage('qualification');
    setFinalRank('');
    setElimShots(['', '', '', '', '']);
    setSeriesByPosition(makePositionSeries(d));
    setPositionEntryMode(makePositionEntryMode(d));
  };

  const changeStage = (next: ScoreStage) => {
    setStage(next);
    setFinalRank('');
    setElimShots(['', '', '', '', '']);
    if (next === '3p_final') {
      setSeriesByPosition(makePositionSeries('three_position_50m'));
      setPositionEntryMode(makePositionEntryMode('three_position_50m'));
    } else if (next === 'prone_final') {
      setSeriesByPosition(makePositionSeries('prone_50m'));
      setPositionEntryMode(makePositionEntryMode('prone_50m'));
    } else {
      setSeriesByPosition(makePositionSeries(discipline));
      setPositionEntryMode(makePositionEntryMode(discipline));
    }
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
    setPositionEntryMode(makePositionEntryMode(discipline));
  };

  const changePositionEntryMode = (pos: Position, next: PositionEntryMode) => {
    if (positionEntryMode[pos] === next) return;

    const entries = seriesByPosition[pos] ?? [];
    const hasSeriesData = entries.some(
      (s, i) =>
        (positionEntryMode[pos] === 'series' && i < 2 && parseDecimalValue(s.decimal) > 0) ||
        (positionEntryMode[pos] === 'series' && i < 2 && parseInt(s.integer, 10) > 0)
    );
    const hasTotalData =
      positionEntryMode[pos] === 'total' &&
      (parseDecimalValue(entries[0]?.decimal ?? '') > 0 || parseInt(entries[0]?.integer ?? '', 10) > 0);

    if (next === 'total' && hasSeriesData) {
      const ok = window.confirm(
        `Switch ${POSITION_LABELS[pos]} to total-only? Series scores will be replaced by the position total.`
      );
      if (!ok) return;
      const decSum = round1(entries.reduce((sum, s) => sum + parseDecimalValue(s.decimal), 0));
      const intSum = entries.reduce((sum, s) => sum + (parseInt(s.integer, 10) || 0), 0);
      setSeriesByPosition((prev) => ({
        ...prev,
        [pos]: [
          {
            decimal: decSum > 0 ? String(decSum) : '',
            integer: intSum > 0 ? String(intSum) : '',
          },
          emptySeries(),
        ],
      }));
    } else if (next === 'series' && hasTotalData) {
      const ok = window.confirm(
        `Switch ${POSITION_LABELS[pos]} to series entry? The position total will be cleared.`
      );
      if (!ok) return;
      setSeriesByPosition((prev) => ({
        ...prev,
        [pos]: [emptySeries(), emptySeries()],
      }));
    } else if (next === 'series') {
      setSeriesByPosition((prev) => ({
        ...prev,
        [pos]: [emptySeries(), emptySeries()],
      }));
    }

    setPositionEntryMode((prev) => ({ ...prev, [pos]: next }));
  };

  const buildInput = () => {
    const threePQual = isThreePQual(discipline, stage);
    const positions = spec.positions.map((pos) => {
      if (threePQual && positionEntryMode[pos] === 'total') {
        const s = seriesByPosition[pos][0];
        return {
          position: pos,
          aggregate: true,
          series: [
            {
              seriesNumber: 1,
              decimal: parseDecimalValue(s.decimal),
              integer: parseInt(s.integer, 10) || 0,
            },
          ],
        };
      }
      return {
        position: pos,
        series: seriesByPosition[pos].map((s, i) => ({
          seriesNumber: i + 1,
          decimal: parseDecimalValue(s.decimal),
          integer: parseInt(s.integer, 10) || 0,
        })),
      };
    });
    const parsedElim = elimShots.map((s) => parseDecimalValue(s)).filter((v) => v > 0);
    const rank = parseInt(finalRank, 10);

    return {
      userId: selectedMemberId && selectedMemberId !== GUEST_MEMBER ? selectedMemberId : null,
      shooterName: shooterName.trim(),
      club: club.trim(),
      category,
      eventId: selectedEventId && selectedEventId !== CUSTOM_EVENT ? selectedEventId : '',
      eventName: eventName.trim(),
      date,
      discipline,
      stage,
      scoringType: 'decimal' as const,
      status: 'official' as const,
      source: 'manual' as const,
      positions: stage === '3p_final' ? positions : positions,
      finalShots: stage === '3p_final' && parsedElim.length > 0 ? parsedElim : undefined,
      finalRank: Number.isFinite(rank) && rank > 0 ? rank : undefined,
    };
  };

  const validateLocal = (): string | null => {
    if (!eventName.trim() && selectedEventId !== CUSTOM_EVENT && !selectedEventId) {
      return 'Select an event or enter a custom event name';
    }
    if (!eventName.trim()) return 'Event name is required';
    if (!shooterName.trim()) return 'Select a member or enter shooter name (guest)';
    if (stage === 'qualification' && !club.trim()) return 'Club is required';

    const threePQual = isThreePQual(discipline, stage);
    for (const pos of spec.positions) {
      if (threePQual && positionEntryMode[pos] === 'total') {
        const dec = parseDecimalValue(seriesByPosition[pos][0]?.decimal ?? '');
        const intVal = parseInt(seriesByPosition[pos][0]?.integer ?? '', 10) || 0;
        if (dec > 0 && dec > MAX_DECIMAL_PER_POSITION_3P) {
          return `${POSITION_LABELS[pos]} decimal must be ≤ ${MAX_DECIMAL_PER_POSITION_3P}`;
        }
        if (intVal > 200) {
          return `${POSITION_LABELS[pos]} ring total must be ≤ 200`;
        }
        continue;
      }
      for (const s of seriesByPosition[pos]) {
        const dec = parseDecimalValue(s.decimal);
        if (dec > 0 && dec > (stage === '3p_final' ? MAX_5SHOT_SERIES_DECIMAL : 109)) {
          return `${POSITION_LABELS[pos]} series decimal exceeds maximum`;
        }
      }
    }

    const anyScore = spec.positions.some((pos) => {
      if (threePQual && positionEntryMode[pos] === 'total') {
        return parseDecimalValue(seriesByPosition[pos][0]?.decimal ?? '') > 0;
      }
      return seriesByPosition[pos].some((s) => parseDecimalValue(s.decimal) > 0);
    });
    const anyElim = elimShots.some((s) => parseDecimalValue(s) > 0);
    if (stage === '3p_final') {
      if (!anyScore && !anyElim) return 'Enter position series and/or elimination shots';
    } else if (!anyScore) {
      return 'Enter at least one series score';
    }
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
        <FormControl>
          <FormLabel>Stage</FormLabel>
          <Select value={stage} onChange={(e) => changeStage(e.target.value as ScoreStage)}>
            {availableStages.map((s) => (
              <option key={s} value={s}>
                {s === 'qualification' ? 'Qualification' : s === 'prone_final' ? 'Prone Final' : '3P Final'}
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
      {spec.positions.map((pos) => {
        const showTotalToggle = isThreePQual(discipline, stage);
        const isTotalMode = showTotalToggle && positionEntryMode[pos] === 'total';
        return (
          <Box key={pos} borderWidth="1px" borderRadius="md" p={4}>
            <HStack justify="space-between" mb={3} flexWrap="wrap" gap={2}>
              <Heading size="sm">{POSITION_LABELS[pos]}</Heading>
              <HStack spacing={2}>
                {showTotalToggle && (
                  <HStack spacing={0}>
                    <Button
                      size="xs"
                      variant={positionEntryMode[pos] === 'series' ? 'satrf' : 'satrfOutline'}
                      onClick={() => changePositionEntryMode(pos, 'series')}
                      borderRightRadius={0}
                    >
                      Series
                    </Button>
                    <Button
                      size="xs"
                      variant={positionEntryMode[pos] === 'total' ? 'satrf' : 'satrfOutline'}
                      onClick={() => changePositionEntryMode(pos, 'total')}
                      borderLeftRadius={0}
                    >
                      Total only
                    </Button>
                  </HStack>
                )}
                <Badge colorScheme="blue">Subtotal: {positionTotals[pos]?.toFixed(1)}</Badge>
              </HStack>
            </HStack>
            {isTotalMode ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} maxW="md">
                <Box>
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Decimal total (max {MAX_DECIMAL_PER_POSITION_3P})
                  </Text>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max={MAX_DECIMAL_PER_POSITION_3P}
                    placeholder="decimal"
                    value={seriesByPosition[pos][0]?.decimal ?? ''}
                    onChange={(e) => updateSeries(pos, 0, 'decimal', e.target.value)}
                    size="sm"
                    mb={1}
                  />
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="200"
                    placeholder="ring total (opt)"
                    value={seriesByPosition[pos][0]?.integer ?? ''}
                    onChange={(e) => updateSeries(pos, 0, 'integer', e.target.value)}
                    size="sm"
                  />
                </Box>
              </SimpleGrid>
            ) : (
              <SimpleGrid columns={{ base: 2, md: spec.seriesPerPosition }} spacing={3}>
                {seriesByPosition[pos].map((s, i) => (
                  <Box key={i}>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Series {i + 1} (max{' '}
                      {stage === '3p_final' ? MAX_5SHOT_SERIES_DECIMAL : (SHOTS_PER_SERIES * 10.9).toFixed(1)})
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
            )}
          </Box>
        );
      })}

      {stage === '3p_final' && (
        <Box borderWidth="1px" borderRadius="md" p={4}>
          <Heading size="sm" mb={3}>
            Elimination shots (31–35)
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={3}>
            {elimShots.map((val, i) => (
              <FormControl key={i}>
                <FormLabel fontSize="xs">Elim {i + 1}</FormLabel>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10.9"
                  value={val}
                  onChange={(e) => {
                    const next = [...elimShots];
                    next[i] = e.target.value;
                    setElimShots(next);
                  }}
                  size="sm"
                />
              </FormControl>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {(stage === 'prone_final' || stage === '3p_final') && (
        <FormControl maxW="200px">
          <FormLabel>Final rank (optional)</FormLabel>
          <Input
            type="number"
            min="1"
            value={finalRank}
            onChange={(e) => setFinalRank(e.target.value)}
            placeholder="e.g. 1"
          />
        </FormControl>
      )}

      <HStack justify="space-between">
        <Badge fontSize="md" colorScheme="green" px={3} py={1}>
          {stage === 'qualification' ? 'Qual total' : 'Final total'}: {grandTotal.toFixed(1)}
          {stage === '3p_final' &&
            elimShots.some((s) => parseDecimalValue(s) > 0) &&
            ` + ${elimShots.reduce((a, s) => a + parseDecimalValue(s), 0).toFixed(1)} elim`}
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
