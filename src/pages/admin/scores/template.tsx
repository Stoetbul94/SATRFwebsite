'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Link,
} from '@chakra-ui/react';
import { FiDownload, FiArrowLeft } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';

export default function ScoreTemplate() {
  return (
    <Layout>
      <Container maxW="3xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Link href="/admin/scores/import" color="blue.500">
            <FiArrowLeft style={{ marginRight: 8, display: 'inline' }} />
            Back to Import
          </Link>

          <Heading size="lg">Match score workbook</Heading>
          <Text color="gray.600">
            Download the official SATRF match template. Fill the sheets for this event (Prone, F-Class,
            3-Position, Finals), then upload the file on the Import page with the event selected.
          </Text>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              Column spec: see <code>docs/IMPORT_SPEC.md</code> in the repo. Totals and ranks in the
              sheet are ignored — the site recalculates everything.
            </Text>
          </Alert>

          <Button
            as="a"
            href="/templates/SATRF_Match_Template.xlsx"
            download="SATRF_Match_Template.xlsx"
            leftIcon={<FiDownload />}
            colorScheme="blue"
            size="lg"
          >
            Download SATRF_Match_Template.xlsx
          </Button>

          <Box fontSize="sm" color="gray.600">
            <Text fontWeight="semibold" mb={2}>
              Sheets imported:
            </Text>
            <Text>Prone 50m · F-Class · 3-Position 50m · Prone Final · 3P Final</Text>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
}
