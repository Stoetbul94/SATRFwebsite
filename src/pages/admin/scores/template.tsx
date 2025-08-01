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
        'Event Name': 'Prone Match 1',
        'Match Number': '001',
        'Shooter Name': 'John Doe',
        'Club': 'SATRF Club',
        'Division/Class': 'Open',
        'Veteran': 'N',
        'Series 1': 95.5,
        'Series 2': 96.2,
        'Series 3': 94.8,
        'Series 4': 97.1,
        'Series 5': 95.9,
        'Series 6': 96.5,
        'Total': 576.0,
        'Place': 1,
      },
      {
        'Event Name': 'Prone Match 1',
        'Match Number': '001',
        'Shooter Name': 'Jane Smith',
        'Club': 'Target Club',
        'Division/Class': 'Junior',
        'Veteran': 'N',
        'Series 1': 92.3,
        'Series 2': 94.1,
        'Series 3': 93.7,
        'Series 4': 95.2,
        'Series 5': 92.8,
        'Series 6': 94.5,
        'Total': 562.6,
        'Place': 2,
      },
      {
        'Event Name': 'Air Rifle',
        'Match Number': '002',
        'Shooter Name': 'Bob Johnson',
        'Club': 'Precision Club',
        'Division/Class': 'Veteran',
        'Veteran': 'Y',
        'Series 1': 98.5,
        'Series 2': 97.8,
        'Series 3': 99.1,
        'Series 4': 98.2,
        'Series 5': 97.9,
        'Series 6': 98.7,
        'Total': 590.2,
        'Place': 1,
      },
    ];

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Event Name
      { wch: 12 }, // Match Number
      { wch: 20 }, // Shooter Name
      { wch: 15 }, // Club
      { wch: 15 }, // Division/Class
      { wch: 8 },  // Veteran
      { wch: 10 }, // Series 1
      { wch: 10 }, // Series 2
      { wch: 10 }, // Series 3
      { wch: 10 }, // Series 4
      { wch: 10 }, // Series 5
      { wch: 10 }, // Series 6
      { wch: 10 }, // Total
      { wch: 8 },  // Place
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Score Template');

    // Write to file and download
    XLSX.writeFile(wb, 'SATRF_Score_Template.xlsx');
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
                      <Td>Prone Match 1, Prone Match 2, 3P, Air Rifle</Td>
                      <Td>The type of shooting event</Td>
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