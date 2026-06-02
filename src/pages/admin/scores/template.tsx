'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  Link,
} from '@chakra-ui/react';
import { FiDownload, FiArrowLeft } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import * as XLSX from 'xlsx';

const PRONE_SAMPLE = [
  {
    'Date (YYYY-MM-DD)': '2026-05-09',
    'Event Name': '50 Meter Rifle Prone',
    Discipline: 'prone_50m',
    'Shooter Name': 'Arnold Prone',
    Club: 'Modderbee',
    Category: 'open',
    'S1 Decimal': 100.7,
    'S2 Decimal': 101.6,
    'S3 Decimal': 97.4,
    'S4 Decimal': 100.7,
    'S5 Decimal': 99.3,
    'S6 Decimal': 100.7,
    'S1 Integer': 95,
    'S2 Integer': 95,
    'S3 Integer': 93,
    'S4 Integer': 95,
    'S5 Integer': 94,
    'S6 Integer': 95,
    Status: 'official',
    Notes: 'Example from electronic target — 60-shot match (series 1–6 only)',
  },
  {
    'Date (YYYY-MM-DD)': '2026-06-10',
    'Event Name': 'SATRF Nationals',
    Discipline: 'prone_50m',
    'Shooter Name': 'Jane Member',
    Club: 'SATRF Club',
    Category: 'ladies',
    'S1 Decimal': 98.5,
    'S2 Decimal': 99.1,
    'S3 Decimal': 97.8,
    'S4 Decimal': 100.2,
    'S5 Decimal': 99.0,
    'S6 Decimal': 98.7,
    Status: 'official',
    Notes: '',
  },
];

const INSTRUCTIONS = [
  { Topic: 'Purpose', Detail: 'Bulk import ISSF 50m Prone scores (6 series × 10 shots). Save this file and reuse for each event.' },
  { Topic: 'Sheet to fill', Detail: 'Prone Scores — one row per shooter per match.' },
  { Topic: 'Date', Detail: 'YYYY-MM-DD (e.g. 2026-05-09). Excel date cells also work.' },
  { Topic: 'Discipline', Detail: 'prone_50m (required for now). three_position_50m uses a separate template later.' },
  { Topic: 'Category', Detail: 'open | junior | veteran | ladies (lowercase)' },
  { Topic: 'Shooter Name', Detail: 'First name + surname exactly as on the member profile (for auto-linking).' },
  { Topic: 'Club', Detail: 'Must match the member’s club on the website.' },
  { Topic: 'Series decimals', Detail: 'Series totals from the target report (e.g. 100.7). Max 109.0 per series.' },
  { Topic: 'Series integers', Detail: 'Optional ring totals in brackets, e.g. 95 from "100.7 (95)".' },
  { Topic: 'Status', Detail: 'official (default) or provisional for incomplete training.' },
  { Topic: 'Total', Detail: 'Not required — the site calculates the match total from the six series.' },
  { Topic: 'PDF reports', Detail: 'Use Summary Report series lines S1–S6, or Target Report "TOTAL : decimal (integer)" per series.' },
];

const LOOKUPS = [
  { Field: 'Discipline', Values: 'prone_50m' },
  { Field: 'Category', Values: 'open, junior, veteran, ladies' },
  { Field: 'Status', Values: 'official, provisional' },
];

export default function ScoreTemplate() {
  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.json_to_sheet(PRONE_SAMPLE);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 28 },
      { wch: 14 },
      { wch: 22 },
      { wch: 16 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Prone Scores');

    const wsInfo = XLSX.utils.json_to_sheet(INSTRUCTIONS);
    wsInfo['!cols'] = [{ wch: 14 }, { wch: 72 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Instructions');

    const wsLook = XLSX.utils.json_to_sheet(LOOKUPS);
    wsLook['!cols'] = [{ wch: 14 }, { wch: 48 }];
    XLSX.utils.book_append_sheet(wb, wsLook, 'Lookups');

    XLSX.writeFile(wb, 'SATRF_Prone_50m_Score_Import.xlsx');
  };

  return (
    <Layout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <HStack mb={4}>
              <Link href="/admin/scores/import" color="blue.500">
                <FiArrowLeft style={{ marginRight: '8px' }} />
                Back to Import
              </Link>
            </HStack>
            <Heading as="h1" size="xl" mb={2} color="blue.900">
              Prone score import template
            </Heading>
            <Text color="gray.600" fontSize="lg">
              ISSF 50m prone — 6 decimal series totals per shooter. Matches admin manual entry and Firestore scores.
            </Text>
          </Box>

          <Box border="2px dashed" borderColor="blue.300" borderRadius="lg" p={6} textAlign="center" bg="blue.50">
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="medium">
                Download Excel template
              </Text>
              <Text color="gray.600">
                Three sheets: data entry, instructions, and allowed values. Fill &quot;Prone Scores&quot; and upload on Import.
              </Text>
              <Button leftIcon={<FiDownload />} colorScheme="blue" size="lg" onClick={downloadTemplate}>
                Download SATRF_Prone_50m_Score_Import.xlsx
              </Button>
            </VStack>
          </Box>

          <Box>
            <Heading as="h2" size="lg" mb={4} color="blue.900">
              Column reference
            </Heading>
            <Alert status="info" borderRadius="md" mb={4}>
              <AlertIcon />
              <Text fontSize="sm">
                Header row must match exactly (case-sensitive). Extra columns are ignored.
              </Text>
            </Alert>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Column</Th>
                    <Th>Required</Th>
                    <Th>Example</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td fontWeight="semibold">Date (YYYY-MM-DD)</Td>
                    <Td>Yes</Td>
                    <Td>2026-05-09</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Event Name</Td>
                    <Td>Yes</Td>
                    <Td>50 Meter Rifle Prone</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Discipline</Td>
                    <Td>Yes</Td>
                    <Td>prone_50m</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Shooter Name</Td>
                    <Td>Yes</Td>
                    <Td>Arnold Prone</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Club</Td>
                    <Td>Yes</Td>
                    <Td>Modderbee</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Category</Td>
                    <Td>Yes</Td>
                    <Td>open</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">S1 Decimal … S6 Decimal</Td>
                    <Td>Yes</Td>
                    <Td>100.7, 101.6, …</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">S1 Integer … S6 Integer</Td>
                    <Td>No</Td>
                    <Td>95 (from target PDF)</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Status</Td>
                    <Td>No</Td>
                    <Td>official</Td>
                  </Tr>
                  <Tr>
                    <Td fontWeight="semibold">Notes</Td>
                    <Td>No</Td>
                    <Td>Your reference only — not imported</Td>
                  </Tr>
                </Tbody>
              </Table>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
}
