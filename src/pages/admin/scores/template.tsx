'use client';

import { useEffect } from 'react';
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

export default function ScoreTemplate() {
  const downloadTemplate = () => {
    // Create sample data
  const sampleData = [
      {
        'Date (YYYY-MM-DD)': '2026-06-10',
        'Event Name': 'Nationals',
        'Discipline': 'prone_50m',
        'Shooter Name': 'Arnold Bailie',
        'Club': 'Modderbee',
        'Category': 'open',
        'Veteran (Y/N)': 'N',
        'Series 1': 100.0,
        'Series 2': 100.0,
        'Series 3': 100.0,
        'Series 4': 102.0,
        'Series 5': 101.0,
        'Series 6': 100.0,
      },
      {
        'Date (YYYY-MM-DD)': '2026-06-10',
        'Event Name': 'Nationals',
        'Discipline': 'prone_50m',
        'Shooter Name': 'Jane Member',
        'Club': 'SATRF Club',
        'Category': 'ladies',
        'Veteran (Y/N)': 'N',
        'Series 1': 98.5,
        'Series 2': 99.1,
        'Series 3': 97.8,
        'Series 4': 100.2,
        'Series 5': 99.0,
        'Series 6': 98.7,
      },
    ];

    const instructions = [
      { Topic: 'Discipline', Value: 'prone_50m or three_position_50m' },
      { Topic: 'Category', Value: 'open, junior, veteran, ladies' },
      { Topic: 'Series', Value: 'Decimal series totals (max 109.0 per series for prone)' },
      { Topic: 'Members', Value: 'Use exact first + last name + club as on the website for auto-linking' },
      { Topic: 'Tip', Value: 'Manual entry in admin can pick member & event from dropdowns (recommended)' },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 10 },
      { wch: 12 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Prone Scores');
    const wsInfo = XLSX.utils.json_to_sheet(instructions);
    wsInfo['!cols'] = [{ wch: 18 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Instructions');
    XLSX.writeFile(wb, 'SATRF_ISSF_Score_Template.xlsx');
  };

  return (
    <Layout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <HStack mb={4}>
              <Link href="/admin/scores/import" color="blue.500">
                <FiArrowLeft style={{ marginRight: '8px' }} />
                Back to Import
              </Link>
            </HStack>
            <Heading as="h1" size="xl" mb={2} color="blue.900">
              Score Import Template
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Download the template and follow the format guidelines below
            </Text>
          </Box>

          {/* Download Section */}
          <Box
            border="2px dashed"
            borderColor="blue.300"
            borderRadius="lg"
            p={6}
            textAlign="center"
            bg="blue.50"
          >
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="medium">
                Download Excel Template
              </Text>
              <Text color="gray.600">
                Click the button below to download a sample Excel file with the correct format
              </Text>
              <Button
                leftIcon={<FiDownload />}
                colorScheme="blue"
                size="lg"
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
            </VStack>
          </Box>

          {/* Format Guidelines */}
          <Box>
            <Heading as="h2" size="lg" mb={4} color="blue.900">
              Format Guidelines
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="semibold">Required Columns:</Text>
                  <Text fontSize="sm" mt={1}>
                    Your Excel file must include these exact column headers (case-sensitive)
                  </Text>
                </Box>
              </Alert>

              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Column</Th>
                      <Th>Type</Th>
                      <Th>Required</Th>
                      <Th>Valid Values</Th>
                      <Th>Description</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td fontWeight="semibold">Event Name</Td>
                      <Td>Text</Td>
                      <Td>Yes</Td>
                      <Td>Any text (e.g., Prone Match 1, Air Rifle, 3P, etc.)</Td>
                      <Td>The type of shooting event (manual entry - any event name)</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Match Number</Td>
                      <Td>Text</Td>
                      <Td>Yes</Td>
                      <Td>Any text</Td>
                      <Td>Unique identifier for the match</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Shooter Name</Td>
                      <Td>Text</Td>
                      <Td>Yes</Td>
                      <Td>Any text</Td>
                      <Td>Full name of the shooter</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Club</Td>
                      <Td>Text</Td>
                      <Td>Yes</Td>
                      <Td>Any text</Td>
                      <Td>Shooter's club or organization</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Division/Class</Td>
                      <Td>Text</Td>
                      <Td>Yes</Td>
                      <Td>Open, Junior, Veteran, Master</Td>
                      <Td>Shooter's division classification</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Veteran</Td>
                      <Td>Text</Td>
                      <Td>Yes</Td>
                      <Td>Y or N</Td>
                      <Td>Whether the shooter is a veteran</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Series 1-6</Td>
                      <Td>Number</Td>
                      <Td>Yes</Td>
                      <Td>0.0 - 109.0</Td>
                      <Td>Individual series scores</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Total</Td>
                      <Td>Number</Td>
                      <Td>Yes</Td>
                      <Td>Sum of Series 1-6</Td>
                      <Td>Total score (auto-calculated)</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight="semibold">Place</Td>
                      <Td>Number</Td>
                      <Td>No</Td>
                      <Td>1, 2, 3, etc.</Td>
                      <Td>Shooter's finishing position</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </Box>

              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="semibold">Important Notes:</Text>
                  <Text fontSize="sm" mt={1}>
                    • All series scores must be between 0.0 and 109.0<br/>
                    • Total must equal the sum of all series scores<br/>
                    • Veteran field must be exactly "Y" or "N"<br/>
                    • Event names and divisions must match the valid values exactly<br/>
                    • Rows with errors will be skipped during import
                  </Text>
                </Box>
              </Alert>
            </VStack>
          </Box>

          {/* Sample Data Preview */}
          <Box>
            <Heading as="h2" size="lg" mb={4} color="blue.900">
              Sample Data Preview
            </Heading>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Event Name</Th>
                    <Th>Match #</Th>
                    <Th>Shooter Name</Th>
                    <Th>Club</Th>
                    <Th>Division</Th>
                    <Th>Veteran</Th>
                    <Th>S1</Th>
                    <Th>S2</Th>
                    <Th>S3</Th>
                    <Th>S4</Th>
                    <Th>S5</Th>
                    <Th>S6</Th>
                    <Th>Total</Th>
                    <Th>Place</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>Prone Match 1</Td>
                    <Td>001</Td>
                    <Td>John Doe</Td>
                    <Td>SATRF Club</Td>
                    <Td>Open</Td>
                    <Td>N</Td>
                    <Td>95.5</Td>
                    <Td>96.2</Td>
                    <Td>94.8</Td>
                    <Td>97.1</Td>
                    <Td>95.9</Td>
                    <Td>96.5</Td>
                    <Td>576.0</Td>
                    <Td>1</Td>
                  </Tr>
                  <Tr>
                    <Td>Prone Match 1</Td>
                    <Td>001</Td>
                    <Td>Jane Smith</Td>
                    <Td>Target Club</Td>
                    <Td>Junior</Td>
                    <Td>N</Td>
                    <Td>92.3</Td>
                    <Td>94.1</Td>
                    <Td>93.7</Td>
                    <Td>95.2</Td>
                    <Td>92.8</Td>
                    <Td>94.5</Td>
                    <Td>562.6</Td>
                    <Td>2</Td>
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