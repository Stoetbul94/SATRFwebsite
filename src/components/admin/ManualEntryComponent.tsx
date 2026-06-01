'use client';

import { useMemo, useState } from 'react';
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

interface StagedScore {
  id: string;
  shooterName: string;
  club: string;
  category: Category;
  veteran: boolean;
  discipline: Discipline;
  decimalTotal: number;
}

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
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

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

  const positionTotals = useMemo(() => {
    const totals: Partial<Record<Position, number>> = {};
    spec.positions.forEach((pos) => {
      totals[pos] = round1(
        (seriesByPosition[pos] ?? []).reduce((sum, s) => sum + (parseFloat(s.decimal) || 0), 0)
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
    setShooterName('');
    setClub('');
    setVeteran(false);
    setSeriesByPosition(makePositionSeries(discipline));
  };

  const buildInput = () => ({
    shooterName: shooterName.trim(),
    club: club.trim(),
    category,
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
        decimal: parseFloat(s.decimal) || 0,
        integer: parseInt(s.integer, 10) || 0,
      })),
    })),
  });

  const validateLocal = (): string | null => {
    if (!eventName.trim()) return 'Event name is required';
    if (!shooterName.trim()) return 'Shooter name is required';
    if (!club.trim()) return 'Club is required';
    const anyScore = spec.positions.some((pos) =>
      seriesByPosition[pos].some((s) => (parseFloat(s.decimal) || 0) > 0)
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
    if (shooterName.trim() && !validateLocal()) {
      inputs.push(buildInput());
    }
    if (inputs.length === 0) {
      onImportError('No scores to save');
      return;
    }

    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Authentication required. Please log in again.');

      const response = await fetch('/api/admin/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scores: inputs }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to save scores');
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
          <FormLabel>Event name</FormLabel>
          <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. National Prone League R1" />
        </FormControl>
        <FormControl>
          <FormLabel>Date</FormLabel>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormControl>
      </SimpleGrid>

      <Divider />

      {/* Shooter fields */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <FormControl>
          <FormLabel>Shooter name</FormLabel>
          <Input value={shooterName} onChange={(e) => setShooterName(e.target.value)} placeholder="First Last" />
        </FormControl>
        <FormControl>
          <FormLabel>Club</FormLabel>
          <Input value={club} onChange={(e) => setClub(e.target.value)} />
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
