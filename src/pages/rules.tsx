import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { FiDownload, FiExternalLink, FiSearch, FiFileText, FiShield, FiTarget, FiAlertTriangle } from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';

interface RuleDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  webUrl?: string;
  pdfUrl?: string;
  icon: React.ElementType;
}

const ruleDocuments: RuleDocument[] = [
  {
    id: 'general-technical',
    title: 'General Technical Rules',
    description:
      'Comprehensive technical regulations governing all ISSF shooting sports competitions and equipment standards.',
    category: 'technical',
    webUrl: 'https://www.issf-sports.org/rules/general-technical-rules',
    pdfUrl:
      'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=458&file=ISSF_-Technical-Rules-Rule_Book_2023_Approved_Version.pdf',
    icon: FiFileText,
  },
  {
    id: 'rifle-rules',
    title: 'Rifle Rules',
    description:
      'Specific regulations for rifle shooting events, including position requirements, scoring, and competition formats.',
    category: 'rifle',
    webUrl: 'https://www.issf-sports.org/rules/rifle',
    pdfUrl:
      'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=460&file=ISSF_Rifle-Rules_Book_2023_Approved_Version.pdf',
    icon: FiTarget,
  },
  {
    id: 'anti-doping',
    title: 'Anti-Doping Regulations',
    description:
      'Official anti-doping policies and procedures to ensure fair competition and athlete health protection.',
    category: 'doping',
    webUrl: 'https://www.issf-sports.org/rules/anti-doping',
    pdfUrl:
      'https://backoffice.issf-sports.org/getfile.aspx?mod=docf&pane=1&inst=457&file=ISSF_Doping-Rules-Rule_Book_2023_Approved_Version.pdf',
    icon: FiShield,
  },
  {
    id: 'disciplinary',
    title: 'Disciplinary Regulations',
    description:
      'Rules and procedures for handling violations, appeals, and disciplinary actions in shooting sports.',
    category: 'disciplinary',
    webUrl: 'https://www.issf-sports.org/rules/disciplinary-regulations',
    icon: FiAlertTriangle,
  },
];

const categories = [
  { id: 'all', name: 'All Documents' },
  { id: 'technical', name: 'Technical Rules' },
  { id: 'rifle', name: 'Rifle Rules' },
  { id: 'doping', name: 'Anti-Doping' },
  { id: 'disciplinary', name: 'Disciplinary' },
];

export default function RulesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDocuments = ruleDocuments.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownloadAll = () => {
    ruleDocuments.filter((d) => d.pdfUrl).forEach((doc) => {
      if (doc.pdfUrl) window.open(doc.pdfUrl, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <Layout>
      <Head>
        <title>ISSF Rules & Documentation - SATRF</title>
        <meta
          name="description"
          content="Access official ISSF shooting sport rules, technical regulations, anti-doping policies, and disciplinary procedures."
        />
      </Head>
      <PublicPageShell>
        <VStack align="stretch" spacing={8}>
          <PublicPageHeader
            eyebrow="Governance"
            title="ISSF Rules & Documentation"
            subtitle="Official ISSF rules and regulations essential for fair, safe competitive shooting in South Africa."
          />

          <Card>
            <CardBody>
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
                  <HStack mb={3}>
                    <Icon as={doc.icon} boxSize={6} color="brand" />
                    <Heading size="md">{doc.title}</Heading>
                  </HStack>
                  <Text color="text.muted" mb={6} fontSize="sm" lineHeight="tall">
                    {doc.description}
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
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
                        View Online
                      </Button>
                    )}
                    {doc.pdfUrl && (
                      <Button
                        as="a"
                        href={doc.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        variant="satrfOutline"
                        leftIcon={<FiDownload />}
                      >
                        Download PDF
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
                  ['Rule Updates', 'ISSF rules are updated periodically. Refer to the official ISSF website for the latest regulations.'],
                  ['Competition Requirements', 'All SATRF competitions follow ISSF rules. Familiarize yourself with these documents before competing.'],
                  ['Anti-Doping Compliance', 'All athletes must comply with anti-doping regulations for participation in competitive events.'],
                  ['Contact Support', 'For rule interpretation questions, contact SATRF officials or consult official ISSF documentation.'],
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
