'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Button,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Center,
  useColorModeValue,
  useBreakpointValue,
  IconButton,
  Flex,
} from '@chakra-ui/react';
import { FiChevronDown, FiChevronUp, FiTarget } from 'react-icons/fi';
import { motion, useReducedMotion } from 'framer-motion';
import { CATEGORIES, DISCIPLINES, EVENT_DISCIPLINE_ORDER } from '@/lib/issf';
import type { EventResultRow } from '@/lib/issf';
import type { Category, Discipline } from '@/types/scores';
import EventPodium from './EventPodium';
import ScoreDetailPanel from './ScoreDetailPanel';
import QualScoreText from '@/components/scores/QualScoreText';

const MotionTr = motion(Tr);
const MotionBox = motion(Box);

export interface EventResultsApiResponse {
  eventId: string;
  eventName: string;
  date?: string;
  discipline: Discipline;
  availableDisciplines: Discipline[];
  defaultDiscipline: Discipline;
  hasFinal: boolean;
  qualification: EventResultRow[];
  final?: EventResultRow[];
}

interface EventResultsTableProps {
  eventId: string;
  includeProvisional?: boolean;
  authToken?: string | null;
}

function isSeriesDiscipline(d: Discipline): boolean {
  return d === 'prone_50m' || d === 'fclass_open' || d === 'fclass_tr';
}

function FinalEliminationChip({ row }: { row: EventResultRow }) {
  if (row.stage !== '3p_final') return null;
  if (row.eliminatedAtShot == null) {
    return (
      <Badge colorScheme="yellow" fontSize="xs">
        Gold medal
      </Badge>
    );
  }
  return (
    <Badge colorScheme="orange" fontSize="xs">
      Out at shot {row.eliminatedAtShot}
    </Badge>
  );
}

function ResultRowExpand({
  row,
  isExpanded,
  onToggle,
  showSeriesColumns,
  is3pQual,
  reducedMotion,
  index,
}: {
  row: EventResultRow;
  isExpanded: boolean;
  onToggle: () => void;
  showSeriesColumns: boolean;
  is3pQual: boolean;
  reducedMotion: boolean;
  index: number;
}) {
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const pos = row.positions ?? [];
  const kneelPos = pos.find((p) => p.position === 'kneeling');
  const pronePos = pos.find((p) => p.position === 'prone');
  const standPos = pos.find((p) => p.position === 'standing');
  const series = row.series ?? [];
  const scoreVariant = is3pQual ? 'ringPrimary' : 'decimalPrimary';

  return (
    <>
      <MotionTr
        cursor="pointer"
        onClick={onToggle}
        _hover={{ bg: hoverBg }}
        initial={reducedMotion ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: reducedMotion ? 0 : index * 0.03 }}
      >
        <Td fontWeight="bold" color="satrf.navy">
          {row.place}
        </Td>
        <Td>
          <Text fontWeight="semibold">{row.shooterName}</Text>
          {row.isProvisional && (
            <Badge ml={2} size="sm" colorScheme="yellow">
              Provisional
            </Badge>
          )}
          {row.isVeteran && (
            <Badge ml={2} size="sm" colorScheme="yellow">
              Veteran
            </Badge>
          )}
          <Box mt={1}>
            <FinalEliminationChip row={row} />
          </Box>
        </Td>
        <Td display={{ base: 'none', sm: 'table-cell' }}>{row.club}</Td>
        <Td display={{ base: 'none', md: 'table-cell' }} textTransform="capitalize">
          {row.category}
          {row.isVeteran && (
            <Badge ml={1} size="sm" colorScheme="yellow">
              Vet
            </Badge>
          )}
        </Td>
        {showSeriesColumns &&
          [0, 1, 2, 3, 4, 5].map((i) => (
            <Td key={i} isNumeric display={{ base: 'none', lg: 'table-cell' }} fontSize="sm">
              {series[i]?.decimal?.toFixed(1) ?? '—'}
            </Td>
          ))}
        {is3pQual && (
          <>
            <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>
              {kneelPos ? (
                <QualScoreText
                  decimal={kneelPos.decimalTotal}
                  rings={kneelPos.integerTotal}
                  variant={scoreVariant}
                />
              ) : (
                '—'
              )}
            </Td>
            <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>
              {pronePos ? (
                <QualScoreText
                  decimal={pronePos.decimalTotal}
                  rings={pronePos.integerTotal}
                  variant={scoreVariant}
                />
              ) : (
                '—'
              )}
            </Td>
            <Td isNumeric display={{ base: 'none', md: 'table-cell' }}>
              {standPos ? (
                <QualScoreText
                  decimal={standPos.decimalTotal}
                  rings={standPos.integerTotal}
                  variant={scoreVariant}
                />
              ) : (
                '—'
              )}
            </Td>
          </>
        )}
        <Td isNumeric fontWeight="bold" color="satrf.lightBlue">
          <QualScoreText
            decimal={row.decimalTotal}
            rings={row.integerTotal}
            variant={scoreVariant}
            fontWeight="bold"
          />
        </Td>
        <Td w="40px">
          <IconButton
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            icon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          />
        </Td>
      </MotionTr>
      {isExpanded && (
        <Tr>
          <Td colSpan={20} py={0} border="none">
            <ScoreDetailPanel row={row} isOpen={isExpanded} />
          </Td>
        </Tr>
      )}
    </>
  );
}

function MobileResultCard({
  row,
  isExpanded,
  onToggle,
  reducedMotion,
  index,
  is3pQual,
}: {
  row: EventResultRow;
  isExpanded: boolean;
  onToggle: () => void;
  reducedMotion: boolean;
  index: number;
  is3pQual: boolean;
}) {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <MotionBox
      bg={cardBg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      p={4}
      w="100%"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: reducedMotion ? 0 : index * 0.03 }}
      onClick={onToggle}
      cursor="pointer"
    >
      <Flex justify="space-between" align="flex-start">
        <HStack align="flex-start" spacing={3}>
          <Text fontSize="2xl" fontWeight="bold" color="satrf.navy" minW="8">
            {row.place}
          </Text>
          <Box>
            <Text fontWeight="semibold">{row.shooterName}</Text>
            <Text fontSize="sm" color="gray.500">
              {row.club}
            </Text>
            <HStack mt={1} spacing={2} flexWrap="wrap">
              <Badge textTransform="capitalize">{row.category}</Badge>
              {row.isVeteran && (
                <Badge colorScheme="yellow">Veteran</Badge>
              )}
              {row.isProvisional && <Badge colorScheme="yellow">Provisional</Badge>}
              <FinalEliminationChip row={row} />
            </HStack>
          </Box>
        </HStack>
        <QualScoreText
          decimal={row.decimalTotal}
          rings={row.integerTotal}
          variant={is3pQual ? 'ringPrimary' : 'decimalPrimary'}
          fontSize="xl"
          fontWeight="extrabold"
          color="satrf.lightBlue"
        />
      </Flex>
      <ScoreDetailPanel row={row} isOpen={isExpanded} />
    </MotionBox>
  );
}

function ResultsBlock({
  title,
  rows,
  discipline,
  accentBorder,
}: {
  title?: string;
  rows: EventResultRow[];
  discipline: Discipline;
  accentBorder?: boolean;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const reducedMotion = useReducedMotion();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const showSeries = isSeriesDiscipline(discipline) || rows[0]?.stage === 'prone_final';
  const is3pQual = discipline === 'three_position_50m' && rows[0]?.stage === 'qualification';
  const headerBg = useColorModeValue('satrf.navy', 'gray.800');
  const blockBg = useColorModeValue(accentBorder ? 'blue.50' : 'white', accentBorder ? 'gray.800' : 'gray.700');
  const accentBorderColor = useColorModeValue('satrf.lightBlue', 'blue.600');
  const defaultBorderColor = useColorModeValue('gray.200', 'gray.600');
  const tableHeadBg = useColorModeValue('gray.100', 'gray.900');
  const borderColor = accentBorder ? accentBorderColor : defaultBorderColor;

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  const rowKey = (r: EventResultRow) => r.scoreId ?? `${r.shooterName}-${r.place}`;

  if (rows.length === 0) return null;

  return (
    <Box
      bg={blockBg}
      borderRadius="xl"
      overflow="hidden"
      borderWidth={accentBorder ? '2px' : '1px'}
      borderColor={borderColor}
      borderLeftWidth={accentBorder ? '4px' : undefined}
      mb={6}
    >
      {title && (
        <Box px={4} py={3} bg={headerBg}>
          <Text color="white" fontWeight="bold" fontSize="lg">
            {title}
          </Text>
        </Box>
      )}
      {isMobile ? (
        <VStack p={4} spacing={3} align="stretch">
          {rows.map((row, i) => (
            <MobileResultCard
              key={rowKey(row)}
              row={row}
              isExpanded={!!expanded[rowKey(row)]}
              onToggle={() => toggle(rowKey(row))}
              reducedMotion={!!reducedMotion}
              index={i}
              is3pQual={is3pQual}
            />
          ))}
        </VStack>
      ) : (
        <Box overflowX="auto">
          <Table size="md" variant="simple">
            <Thead bg={tableHeadBg}>
              <Tr>
                <Th>Place</Th>
                <Th>Name</Th>
                <Th display={{ base: 'none', sm: 'table-cell' }}>Club</Th>
                <Th display={{ base: 'none', md: 'table-cell' }}>Cat</Th>
                {showSeries &&
                  [1, 2, 3, 4, 5, 6].map((n) => (
                    <Th key={n} isNumeric display={{ base: 'none', lg: 'table-cell' }}>
                      S{n}
                    </Th>
                  ))}
                {is3pQual && (
                  <>
                    <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>
                      Kneel
                    </Th>
                    <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>
                      Prone
                    </Th>
                    <Th isNumeric display={{ base: 'none', md: 'table-cell' }}>
                      Stand
                    </Th>
                  </>
                )}
                <Th isNumeric>Total</Th>
                <Th w="40px" />
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row, i) => (
                <ResultRowExpand
                  key={rowKey(row)}
                  row={row}
                  isExpanded={!!expanded[rowKey(row)]}
                  onToggle={() => toggle(rowKey(row))}
                  showSeriesColumns={showSeries}
                  is3pQual={is3pQual}
                  reducedMotion={!!reducedMotion}
                  index={i}
                />
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

export default function EventResultsTable({
  eventId,
  includeProvisional = false,
  authToken,
}: EventResultsTableProps) {
  /** null = server picks defaultDiscipline (initial load only). */
  const [disciplineOverride, setDisciplineOverride] = useState<Discipline | null>(null);
  const [category, setCategory] = useState<string>('all');
  const [data, setData] = useState<EventResultsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pillInactiveBg = useColorModeValue('bg.surface', 'gray.700');
  const pillInactiveBorder = useColorModeValue('border.default', 'gray.500');
  const pillInactiveColor = useColorModeValue('text.muted', 'gray.100');
  const pillActiveBg = useColorModeValue('brand', 'satrf.green.500');
  const pillActiveColor = 'white';

  const fetchResults = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (disciplineOverride) params.set('discipline', disciplineOverride);
      if (category !== 'all') params.set('category', category);
      if (includeProvisional) params.set('includeProvisional', 'true');

      const headers: HeadersInit = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const res = await fetch(`/api/events/${eventId}/results?${params.toString()}`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load results');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load results');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [eventId, disciplineOverride, category, includeProvisional, authToken]);

  const activeDiscipline = disciplineOverride ?? data?.discipline ?? data?.defaultDiscipline ?? 'prone_50m';

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const pills = EVENT_DISCIPLINE_ORDER.filter(
    (d) => !data?.availableDisciplines?.length || data.availableDisciplines.includes(d)
  );

  const podiumRows =
    data?.hasFinal && data.final?.length
      ? data.final
      : data?.qualification ?? [];

  const isEmpty =
    !data ||
    ((data.qualification?.length ?? 0) === 0 && (data.final?.length ?? 0) === 0);

  if (loading && !data) {
    return (
      <Center py={12}>
        <Spinner size="lg" color="satrf.lightBlue" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={8}>
        <Text color="red.500">{error}</Text>
      </Center>
    );
  }

  return (
    <VStack align="stretch" spacing={6} w="100%">
      <Flex wrap="wrap" gap={2} align="center" justify="space-between">
        <HStack spacing={2} flexWrap="wrap">
          {pills.map((d) => {
            const isActive = activeDiscipline === d;
            return (
            <Button
              key={d}
              size="sm"
              borderRadius="full"
              variant="outline"
              bg={isActive ? pillActiveBg : pillInactiveBg}
              color={isActive ? pillActiveColor : pillInactiveColor}
              borderColor={isActive ? pillActiveBg : pillInactiveBorder}
              borderWidth="1.5px"
              onClick={() => setDisciplineOverride(d)}
              fontWeight={isActive ? 'bold' : 'medium'}
              _hover={{
                bg: isActive ? pillActiveBg : pillInactiveBg,
                borderColor: isActive ? pillActiveBg : 'satrf.green.400',
                color: isActive ? pillActiveColor : 'satrf.green.800',
              }}
            >
              {DISCIPLINES[d].label.replace('50m Rifle ', '').replace('F-Class ', 'F-')}
            </Button>
            );
          })}
        </HStack>
        <Select
          size="sm"
          w={{ base: '100%', sm: '180px' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </Flex>

      {isEmpty ? (
        <Center py={16} flexDirection="column">
          <FiTarget size={48} color="#a0aec0" />
          <Text mt={4} fontSize="lg" color="gray.500" fontWeight="medium">
            Results not published yet
          </Text>
          <Text fontSize="sm" color="gray.400" mt={1}>
            Check back after match scores are entered.
          </Text>
        </Center>
      ) : (
        <>
          <EventPodium rows={podiumRows} discipline={activeDiscipline} />
          {data && (
            <>
              {data.hasFinal && data.final && data.final.length > 0 && (
                <ResultsBlock
                  title="Final"
                  rows={data.final}
                  discipline={activeDiscipline}
                  accentBorder
                />
              )}
              <ResultsBlock
                title="Qualification"
                rows={data.qualification}
                discipline={activeDiscipline}
              />
            </>
          )}
        </>
      )}
    </VStack>
  );
}
