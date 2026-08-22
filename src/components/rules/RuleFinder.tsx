import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';
import {
  CLOTHING_SUBTOPICS,
  DISCIPLINE_SHORTCUTS,
  EXAMPLE_QUERIES,
  PRONE_SUBTOPICS,
  QUESTION_SHORTCUTS,
  THREE_P_SUBTOPICS,
  TOPIC_SHORTCUTS,
} from '@/data/rulesTaxonomy';
import {
  excerptAround,
  highlightParts,
  searchRules,
  type RuleSearchEntry,
  type RulesIndexPayload,
} from '@/lib/rulesSearch';
import { downloadLabelForDocument, officialSourceHref, ruleViewerHref, stripHash } from '@/lib/rulesDownloads';
import PdfActionButtons from '@/components/rules/PdfActionButtons';

type Props = {
  onOpenLibrary?: () => void;
};

export default function RuleFinder({ onOpenLibrary }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [payload, setPayload] = useState<RulesIndexPayload | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [topic, setTopic] = useState('all');
  const [discipline, setDiscipline] = useState('all');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (typeof fetch === 'undefined') {
      setLoadError(true);
      return;
    }
    fetch('/data/rules-search-index.json')
      .then((r) => {
        if (!r.ok) throw new Error('index missing');
        return r.json();
      })
      .then((data: RulesIndexPayload) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!router.isReady || hydrated) return;
    const query = router.query;
    if (typeof query.q === 'string') setQ(query.q);
    if (typeof query.topic === 'string') setTopic(query.topic);
    if (typeof query.discipline === 'string') setDiscipline(query.discipline);
    setHydrated(true);
  }, [router.isReady, router.query, hydrated]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!hydrated || !router.isReady) return;
    const nextQuery: Record<string, string> = {};
    if (debouncedQ.trim()) nextQuery.q = debouncedQ.trim();
    if (topic !== 'all') nextQuery.topic = topic;
    if (discipline !== 'all') nextQuery.discipline = discipline;
    const same =
      JSON.stringify(nextQuery) ===
      JSON.stringify(
        Object.fromEntries(
          Object.entries(router.query).filter(([k, v]) =>
            ['q', 'topic', 'discipline'].includes(k) && typeof v === 'string',
          ),
        ),
      );
    if (same) return;
    void router.replace({ pathname: '/rules', query: nextQuery }, undefined, { shallow: true, scroll: false });
  }, [debouncedQ, topic, discipline, hydrated, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = useMemo(() => {
    if (!payload) return [];
    const hasQuery = debouncedQ.trim().length > 0;
    const hasFilter = topic !== 'all' || discipline !== 'all';
    if (!hasQuery && !hasFilter) return [];
    return searchRules(payload.entries, {
      q: debouncedQ,
      topic,
      discipline,
      limit: 40,
    });
  }, [payload, debouncedQ, topic, discipline]);

  const runSearch = useCallback((value: string, next?: { topic?: string; discipline?: string }) => {
    setQ(value);
    if (next?.topic) setTopic(next.topic);
    if (next?.discipline) setDiscipline(next.discipline);
  }, []);

  const showResults = debouncedQ.trim() || topic !== 'all' || discipline !== 'all';

  return (
    <VStack align="stretch" spacing={6}>
      <Box
        position={{ base: 'static', md: 'sticky' }}
        top={{ md: '72px' }}
        zIndex={5}
        bg="bg.canvas"
        py={{ md: 2 }}
      >
        <InputGroup size="lg">
          <InputLeftElement pointerEvents="none" h="100%">
            <Icon as={FiSearch} color="text.muted" />
          </InputLeftElement>
          <Input
            ref={inputRef}
            aria-label="Search ISSF rifle rules"
            placeholder='Search rules — e.g. “3P timing”, “prone sighters”, “shooting jacket”, “rifle weight”...'
            value={q}
            onChange={(e) => setQ(e.target.value)}
            bg="bg.surface"
            fontSize={{ base: 'md', md: 'lg' }}
            h={{ base: '52px', md: '56px' }}
          />
        </InputGroup>
        <Text fontSize="xs" color="text.muted" mt={2}>
          Press <Badge variant="subtle">/</Badge> to focus search. Try:{' '}
          {EXAMPLE_QUERIES.map((ex) => (
            <Button key={ex} variant="link" size="xs" mr={2} onClick={() => runSearch(ex)}>
              {ex}
            </Button>
          ))}
        </Text>
      </Box>

      <Box>
        <Heading size="sm" mb={3}>
          Quick find by discipline
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          {DISCIPLINE_SHORTCUTS.map((d) => (
            <Card
              key={d.id}
              as="button"
              textAlign="left"
              cursor="pointer"
              borderWidth="1px"
              borderColor={discipline === d.id ? 'brand' : 'border.subtle'}
              onClick={() => {
                setDiscipline(d.id);
                if (d.search) setQ(d.search);
              }}
              _focusVisible={{ outline: '2px solid', outlineColor: 'satrf.gold.400' }}
            >
              <CardBody py={4}>
                <Heading size="sm">{d.title}</Heading>
                <Text fontSize="sm" color="text.muted" mt={1}>
                  {d.blurb}
                </Text>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {discipline === '50m-rifle-3p' && (
        <HStack overflowX="auto" spacing={2} pb={1}>
          {THREE_P_SUBTOPICS.map((s) => (
            <Button key={s.label} size="sm" flexShrink={0} variant="satrfOutline" onClick={() => runSearch(s.q)}>
              {s.label}
            </Button>
          ))}
        </HStack>
      )}
      {discipline === '50m-rifle-prone' && (
        <HStack overflowX="auto" spacing={2} pb={1}>
          {PRONE_SUBTOPICS.map((s) => (
            <Button key={s.label} size="sm" flexShrink={0} variant="satrfOutline" onClick={() => runSearch(s.q)}>
              {s.label}
            </Button>
          ))}
        </HStack>
      )}

      <Box>
        <Heading size="sm" mb={3}>
          Quick find by topic
        </Heading>
        <HStack overflowX="auto" spacing={2} pb={1} flexWrap={{ md: 'wrap' }}>
          <Button
            size="sm"
            variant={topic === 'all' ? 'satrf' : 'satrfOutline'}
            onClick={() => setTopic('all')}
          >
            All topics
          </Button>
          {TOPIC_SHORTCUTS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              flexShrink={0}
              variant={topic === t.id ? 'satrf' : 'satrfOutline'}
              onClick={() => setTopic(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </HStack>
        {topic === 'clothing' && (
          <HStack overflowX="auto" spacing={2} mt={3} pb={1}>
            {CLOTHING_SUBTOPICS.map((s) => (
              <Button key={s.label} size="sm" flexShrink={0} variant="satrfOutline" onClick={() => runSearch(s.q, { topic: 'clothing' })}>
                {s.label}
              </Button>
            ))}
          </HStack>
        )}
      </Box>

      <Box>
        <Heading size="sm" mb={2}>
          Common questions
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
          {QUESTION_SHORTCUTS.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              justifyContent="flex-start"
              height="auto"
              py={2}
              whiteSpace="normal"
              onClick={() => runSearch(item.q)}
            >
              {item.label}
            </Button>
          ))}
        </SimpleGrid>
      </Box>

      {loadError && (
        <Text color="red.500">Rule index could not be loaded. Browse official documents below.</Text>
      )}
      {!payload && !loadError && (
        <HStack>
          <Spinner size="sm" />
          <Text fontSize="sm" color="text.muted">
            Loading searchable rule index…
          </Text>
        </HStack>
      )}

      {showResults && payload && (
        <Box>
          <Text fontSize="sm" color="text.muted" aria-live="polite" mb={3}>
            {results.length} matching rule section{results.length === 1 ? '' : 's'}
            {debouncedQ.trim() ? ` for “${debouncedQ.trim()}”` : ''}
          </Text>
          {results.length === 0 ? (
            <Card>
              <CardBody>
                <Text fontWeight="semibold">No rules found{debouncedQ.trim() ? ` for “${debouncedQ.trim()}”` : ''}.</Text>
                <Text fontSize="sm" color="text.muted" mt={2}>
                  Try a different term, browse by discipline, or open official documents.
                </Text>
                <HStack mt={3} spacing={2} flexWrap="wrap">
                  <Button size="sm" variant="satrfOutline" onClick={() => { setQ(''); setTopic('all'); setDiscipline('all'); }}>
                    Clear search
                  </Button>
                  <Button size="sm" variant="satrfOutline" onClick={() => onOpenLibrary?.()}>
                    Browse official documents
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          ) : (
            <VStack align="stretch" spacing={3}>
              {results.map((entry) => (
                <ResultCard key={entry.id} entry={entry} query={debouncedQ} />
              ))}
            </VStack>
          )}
        </Box>
      )}
    </VStack>
  );
}

function ResultCard({ entry, query }: { entry: RuleSearchEntry; query: string }) {
  const excerpt = excerptAround(entry.text, query);
  const parts = highlightParts(excerpt, query);
  return (
    <Card>
      <CardBody>
        <HStack justify="space-between" align="start" flexWrap="wrap" gap={2}>
          <Box>
            <Heading as="h3" size="sm">
              {entry.ruleNumber ? `${entry.ruleNumber} — ` : ''}
              {entry.heading || 'Rule excerpt'}
            </Heading>
            <Text fontSize="sm" color="text.muted" mt={1}>
              {entry.documentTitle}
              {entry.documentPrint ? ` · ${entry.documentPrint}` : ''}
              {entry.effectiveDate ? ` · Effective ${entry.effectiveDate}` : ''}
              {entry.page ? ` · Page ${entry.page}` : ''}
            </Text>
          </Box>
          <Badge colorScheme="green">CURRENT</Badge>
        </HStack>
        <Text fontSize="sm" mt={3} lineHeight="tall">
          {parts.map((p, i) =>
            p.hit ? (
              <Box as="mark" key={i} bg="satrf.gold.200" px="0.5">
                {p.t}
              </Box>
            ) : (
              <Box as="span" key={i}>
                {p.t}
              </Box>
            ),
          )}
        </Text>
        <HStack mt={2} spacing={2} flexWrap="wrap">
          {(entry.topicTags || []).slice(0, 4).map((tag) => (
            <Badge key={tag} variant="subtle">
              {tag}
            </Badge>
          ))}
        </HStack>
        <Box mt={4}>
          <PdfActionButtons
            openHref={ruleViewerHref({
              pdfUrl: entry.pdfUrl,
              page: entry.page,
              ruleNumber: entry.ruleNumber,
              heading: entry.heading,
            })}
            openInNewTab={false}
            openLabel={
              entry.page ? (
                <>
                  <Box as="span" display={{ base: 'inline', md: 'none' }}>
                    Open rule (page {entry.page})
                  </Box>
                  <Box as="span" display={{ base: 'none', md: 'inline' }}>
                    Open at page {entry.page}
                  </Box>
                </>
              ) : (
                'Open rule'
              )
            }
            downloadHref={stripHash(entry.pdfUrl)}
            downloadLabel={downloadLabelForDocument(entry.documentTitle)}
            officialHref={officialSourceHref(entry)}
            officialLabel="Official ISSF Source"
          />
        </Box>
      </CardBody>
    </Card>
  );
}
