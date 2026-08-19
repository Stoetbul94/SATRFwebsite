import React, { useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticProps } from 'next';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiDownload, FiFileText, FiShield, FiTarget, FiAlertTriangle } from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import RuleFinder from '@/components/rules/RuleFinder';
import PdfActionButtons from '@/components/rules/PdfActionButtons';
import { RULES_INDEX_META } from '@/data/rulesIndexMeta';
import {
  issfRuleCategories,
  issfRuleDocuments,
  issfSourceUrl,
  type IssfRuleDocument,
} from '@/data/issf-rules';
import { downloadLabelForDocument, formatFileSize } from '@/lib/rulesDownloads';
import { readIssfLocalFileSizes } from '@/lib/issfRuleFileSizes';

function displayTitle(title: string) {
  return title.replace(/\.(pdf|docx|xlsx|zip)$/i, '');
}

function categoryIcon(category: string) {
  switch (category) {
    case 'rifle':
      return FiTarget;
    case 'integrity':
    case 'safeguarding':
    case 'doping':
      return FiShield;
    case 'disciplinary':
      return FiAlertTriangle;
    default:
      return FiFileText;
  }
}

function pdfHref(doc: IssfRuleDocument) {
  return doc.localPath ?? doc.pdfUrl;
}

const PRIORITY_CATEGORIES = ['rulebook', 'rifle', 'technical'];
const CURRENT_RULEBOOK_PATH =
  '/documents/issf/issf-rule-book-2026-edition-2025-second-print-07-2026-effective-1-july-2026.pdf';

function statusRank(status?: IssfRuleDocument['status']) {
  if (status === 'current') return 0;
  if (status === 'superseded') return 2;
  return 1;
}

type RulesPageProps = {
  fileSizes?: Record<string, number>;
};

export default function RulesPage({ fileSizes = {} }: RulesPageProps) {
  const libraryRef = useRef<HTMLDivElement>(null);
  const [libraryFilter, setLibraryFilter] = useState('all');
  const [showAllInCategory, setShowAllInCategory] = useState<Record<string, boolean>>({});

  const categories = useMemo(
    () =>
      issfRuleCategories.filter(
        (cat) => cat.id === 'all' || issfRuleDocuments.some((doc) => doc.category === cat.id),
      ),
    [],
  );

  const grouped = useMemo(() => {
    const docs =
      libraryFilter === 'all'
        ? issfRuleDocuments
        : issfRuleDocuments.filter((d) => d.category === libraryFilter);
    const map = new Map<string, IssfRuleDocument[]>();
    for (const doc of docs) {
      const list = map.get(doc.category) || [];
      list.push(doc);
      map.set(doc.category, list);
    }
    const order = [
      ...PRIORITY_CATEGORIES,
      ...categories.map((c) => c.id).filter((id) => id !== 'all' && !PRIORITY_CATEGORIES.includes(id)),
    ];
    return order
      .filter((id) => map.has(id))
      .map((id) => ({
        id,
        name: categories.find((c) => c.id === id)?.name || id,
        docs: (map.get(id) || []).slice().sort((a, b) => statusRank(a.status) - statusRank(b.status)),
      }));
  }, [categories, libraryFilter]);

  const handleDownloadAll = () => {
    const hrefs = issfRuleDocuments.map((doc) => doc.localPath).filter((href): href is string => Boolean(href));
    hrefs.forEach((href, i) => {
      window.setTimeout(() => {
        const a = document.createElement('a');
        a.href = href;
        a.download = href.split('/').pop() || 'document.pdf';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, i * 200);
    });
  };

  const rb = RULES_INDEX_META.currentRulebook;

  return (
    <Layout>
      <Head>
        <title>ISSF Rifle Rules &amp; Rule Finder | SATRF</title>
        <meta
          name="description"
          content="Search ISSF rifle rules for 50 m 3-position, prone, competition timing, sighting, clothing, rifle equipment, equipment control, finals and more."
        />
      </Head>
      <PublicPageShell>
        <VStack align="stretch" spacing={8}>
          <Box as="nav" aria-label="Breadcrumb" fontSize="sm" color="text.muted">
            <HStack as="ol" spacing={2} listStyleType="none" m={0} p={0}>
              <Box as="li">
                <Box as={Link} href="/" color="brand" _hover={{ textDecoration: 'underline' }}>
                  Home
                </Box>
              </Box>
              <Box as="li" aria-hidden>
                &gt;
              </Box>
              <Box as="li" color="text.primary" fontWeight="medium" aria-current="page">
                Rules
              </Box>
            </HStack>
          </Box>

          <Box>
            <Text textStyle="eyebrow">Rules &amp; Competition Reference</Text>
            <Heading as="h1" size="xl" mt={1}>
              ISSF Rules &amp; Rule Finder
            </Heading>
            <Text color="text.muted" fontSize="lg" mt={3} maxW="3xl">
              Search rifle rules by discipline, topic, equipment or rule number. Find competition
              timing, shooting positions, clothing requirements, equipment control, finals
              procedures and more.
            </Text>
            <Text fontSize="sm" color="text.muted" mt={3} maxW="3xl">
              SATRF provides this searchable reference for convenience. Official ISSF documentation
              remains authoritative where ISSF rules apply.
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <Card data-testid="current-rulebook">
              <CardBody>
                <HStack justify="space-between" mb={2}>
                  <Heading size="sm">Current ISSF Rule Book</Heading>
                  <Badge colorScheme="green">CURRENT</Badge>
                </HStack>
                <Text fontWeight="medium">{rb.title}</Text>
                <Text fontSize="sm" color="text.muted">
                  {rb.edition}
                </Text>
                <Text fontSize="sm" color="text.muted">
                  {rb.print} · Effective {rb.effectiveDate}
                </Text>
                <Text fontSize="xs" color="text.muted" mt={2}>
                  Last checked against ISSF: {RULES_INDEX_META.lastCheckedAgainstIssf} (manual
                  check, not live sync)
                </Text>
                <Box mt={4}>
                  <PdfActionButtons
                    openHref={CURRENT_RULEBOOK_PATH}
                    openLabel="Open Rule Book"
                    downloadHref={CURRENT_RULEBOOK_PATH}
                    downloadLabel="Download PDF"
                    officialHref={issfSourceUrl}
                    officialLabel="View on ISSF"
                  />
                </Box>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Heading size="sm" mb={2}>
                  Discipline coverage
                </Heading>
                <Text fontSize="sm" color="text.muted">
                  SATRF competitions use the rule set applicable to each discipline. ISSF
                  documentation on this page applies to relevant ISSF-style rifle events (50 m
                  prone and 50 m Rifle 3 Positions). F-Class Open and F-TR are a separate
                  target-rifle family and are not governed by these ISSF rifle results.
                </Text>
                <Text fontSize="sm" color="text.muted" mt={3}>
                  F-Class rule PDFs are not currently hosted here. Check the event listing for the
                  applicable competition rules.
                </Text>
              </CardBody>
            </Card>
          </SimpleGrid>

          <RuleFinder onOpenLibrary={() => libraryRef.current?.scrollIntoView({ behavior: 'smooth' })} />

          <Box ref={libraryRef} id="official-documents">
            <Heading as="h2" size="lg" mb={2}>
              Official documents
            </Heading>
            <Text fontSize="sm" color="text.muted" mb={4}>
              SATRF hosts local copies for convenient access. Always consult the current official
              ISSF publication where rule interpretation or version conflicts arise. This Rule
              Finder is a navigation aid; official ISSF publications and applicable SATRF
              competition documentation remain authoritative.
            </Text>
            <HStack spacing={2} flexWrap="wrap" mb={4}>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={libraryFilter === cat.id ? 'satrf' : 'satrfOutline'}
                  onClick={() => setLibraryFilter(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </HStack>
            <Button
              size="sm"
              variant="satrfOutline"
              leftIcon={<FiDownload />}
              mb={2}
              minH="44px"
              onClick={handleDownloadAll}
            >
              Download all PDFs
            </Button>
            <Text fontSize="xs" color="text.muted" mb={4}>
              Starts a separate browser download for each locally hosted file. Browsers may ask you
              to allow multiple downloads.
            </Text>
            <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
              {grouped.map((group) => {
                const expanded = showAllInCategory[group.id];
                const visible = expanded ? group.docs : group.docs.slice(0, 8);
                return (
                  <AccordionItem key={group.id}>
                    <AccordionButton minH="48px">
                      <Box flex="1" textAlign="left" fontWeight="semibold">
                        {group.name}{' '}
                        <Text as="span" fontWeight="normal" color="text.muted">
                          ({group.docs.length})
                        </Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                        {visible.map((doc) => {
                          const sizeLabel = formatFileSize(fileSizes[doc.id]);
                          return (
                            <Card key={doc.id} size="sm">
                              <CardBody>
                                <HStack align="start" spacing={3}>
                                  <Icon as={categoryIcon(doc.category)} mt={1} color="brand" />
                                  <Box minW={0}>
                                    <Heading size="xs">{displayTitle(doc.title)}</Heading>
                                    <Text fontSize="xs" color="text.muted" mt={1}>
                                      {doc.section}
                                      {doc.edition ? ` · ${doc.edition}` : ''}
                                      {doc.effectiveDate ? ` · Effective ${doc.effectiveDate}` : ''}
                                      {sizeLabel ? ` · ${sizeLabel}` : ''}
                                    </Text>
                                    {doc.status === 'superseded' && (
                                      <Badge mt={1} colorScheme="orange">
                                        ARCHIVE / SUPERSEDED
                                      </Badge>
                                    )}
                                    {doc.status === 'current' && (
                                      <Badge mt={1} colorScheme="green">
                                        CURRENT
                                      </Badge>
                                    )}
                                    <Box mt={3}>
                                      <PdfActionButtons
                                        openHref={pdfHref(doc)}
                                        openLabel="Open"
                                        downloadHref={doc.localPath}
                                        downloadLabel={downloadLabelForDocument(doc.title)}
                                        officialHref={doc.webUrl}
                                        officialLabel="Official Source"
                                      />
                                    </Box>
                                  </Box>
                                </HStack>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </SimpleGrid>
                      {group.docs.length > 8 && (
                        <Button
                          mt={3}
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setShowAllInCategory((s) => ({ ...s, [group.id]: !s[group.id] }))
                          }
                        >
                          {expanded ? 'Show fewer' : `Show all ${group.docs.length}`}
                        </Button>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </Box>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<RulesPageProps> = async () => {
  return { props: { fileSizes: readIssfLocalFileSizes() } };
};

