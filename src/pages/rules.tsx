import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  HStack,
  VStack,
  Icon,
  Heading,
  Badge,
} from '@chakra-ui/react';
import {
  FiDownload,
  FiExternalLink,
  FiSearch,
  FiFileText,
  FiShield,
  FiTarget,
  FiAlertTriangle,
} from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import {
  issfRuleCategories,
  issfRuleDocuments,
  issfSourceUrl,
  type IssfRuleDocument,
} from '@/data/issf-rules';

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

export default function RulesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(
    () =>
      issfRuleCategories.filter(
        (cat) =>
          cat.id === 'all' || issfRuleDocuments.some((doc) => doc.category === cat.id),
      ),
    [],
  );

  const filteredDocuments = issfRuleDocuments.filter((doc) => {
    const label = displayTitle(doc.title).toLowerCase();
    const matchesSearch =
      label.includes(searchTerm.toLowerCase()) ||
      doc.section.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadAll = () => {
    issfRuleDocuments.forEach((doc) => {
      const href = pdfHref(doc);
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <Layout>
      <Head>
        <title>ISSF Rules & Documentation - SATRF</title>
        <meta
          name="description"
          content="Official ISSF rules for 2026: rule book, integrity, safeguarding, disciplinary regulations, eligibility, forms, and rifle guides — mirrored for SATRF members."
        />
      </Head>
      <PublicPageShell>
        <VStack align="stretch" spacing={8}>
          <PublicPageHeader
            eyebrow="Governance"
            title="ISSF Rules & Documentation"
            subtitle="Official ISSF rules and regulations mirrored from issf-sports.org — effective 1 January 2026. Download PDFs locally or view the source pages on ISSF."
          />

          <Card>
            <CardBody>
              <HStack justify="center" mb={4} flexWrap="wrap" gap={2}>
                <Button
                  as="a"
                  href={issfSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  variant="satrfOutline"
                  leftIcon={<FiExternalLink />}
                >
                  View on ISSF
                </Button>
                <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
                  {issfRuleDocuments.length} documents available
                </Badge>
              </HStack>
              <InputGroup maxW="md" mx="auto" mb={6}>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiSearch} color="text.muted" />
                </InputLeftElement>
                <Input
                  placeholder="Search rules and documentation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  bg="bg.surface"
                />
              </InputGroup>
              <HStack spacing={2} wrap="wrap" justify="center">
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    size="sm"
                    variant={selectedCategory === cat.id ? 'satrf' : 'satrfOutline'}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </HStack>
            </CardBody>
          </Card>

          <Box textAlign="center">
            <Button variant="satrfGold" leftIcon={<FiDownload />} onClick={handleDownloadAll}>
              Download All PDFs
            </Button>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} h="100%">
                <CardBody>
                  <HStack mb={2} align="flex-start">
                    <Icon as={categoryIcon(doc.category)} boxSize={6} color="brand" mt={0.5} />
                    <Box flex="1" minW={0}>
                      <Heading size="sm" lineHeight="short">
                        {displayTitle(doc.title)}
                      </Heading>
                      <Text fontSize="xs" color="text.muted" mt={1}>
                        {doc.section}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack spacing={2} flexWrap="wrap" mt={4}>
                    {doc.webUrl && (
                      <Button
                        as="a"
                        href={doc.webUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        variant="satrf"
                        leftIcon={<FiExternalLink />}
                      >
                        View on ISSF
                      </Button>
                    )}
                    {pdfHref(doc) && (
                      <Button
                        as="a"
                        href={pdfHref(doc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        variant="satrfOutline"
                        leftIcon={<FiDownload />}
                        download={doc.localPath ? displayTitle(doc.title) : undefined}
                      >
                        {doc.localPath ? 'Download PDF' : 'Open PDF'}
                      </Button>
                    )}
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {filteredDocuments.length === 0 && (
            <Card>
              <CardBody textAlign="center" py={10}>
                <Icon as={FiSearch} boxSize={10} color="text.muted" mb={4} />
                <Text fontWeight="semibold" mb={2}>
                  No documents found
                </Text>
                <Text color="text.muted" fontSize="sm">
                  Try adjusting your search or category filter.
                </Text>
              </CardBody>
            </Card>
          )}

          <Card bg="satrf.green.50" borderColor="satrf.green.200">
            <CardBody>
              <Heading size="md" mb={4}>
                Important Information
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {[
                  [
                    'Rule Updates',
                    'ISSF published the 2026 Rule Book (effective 1 January 2026). PDFs on this page are mirrored from the official ISSF rules portal.',
                  ],
                  [
                    'Competition Requirements',
                    'All SATRF competitions follow ISSF rules. Familiarize yourself with these documents before competing.',
                  ],
                  [
                    'Local Copies',
                    'PDFs are hosted on satrf.org.za for faster access. Always confirm the latest version on issf-sports.org/rules if in doubt.',
                  ],
                  [
                    'Contact Support',
                    'For rule interpretation questions, contact SATRF officials or consult official ISSF documentation.',
                  ],
                ].map(([title, body]) => (
                  <Box key={title}>
                    <Text fontWeight="semibold" mb={1}>
                      {title}
                    </Text>
                    <Text fontSize="sm" color="text.muted">
                      {body}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </CardBody>
          </Card>

          <Box textAlign="center">
            <Button as={Link} href="/" variant="satrfOutline">
              ← Back to Home
            </Button>
          </Box>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
