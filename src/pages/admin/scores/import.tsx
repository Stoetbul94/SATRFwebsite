'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Link,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiUpload, FiEdit3 } from 'react-icons/fi';
import FileUploadComponent from '@/components/admin/FileUploadComponent';
import ManualEntryComponent from '@/components/admin/ManualEntryComponent';
import Layout from '@/components/layout/Layout';
import { useProtectedRoute } from '@/contexts/AuthContext';
import { useAdminRoute } from '@/hooks/useAdminRoute';

interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    imported: number;
    errors: number;
    errorDetails?: string[];
  };
}

export default function AdminScoreImport() {
  const { isAdmin, isLoading: authLoading } = useAdminRoute();
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Protect route - require authentication and admin role
  useProtectedRoute();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </Layout>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  const handleImportSuccess = (result: ImportResult) => {
    setImportResult(result);
    toast({
      title: result.success ? 'Import Successful' : 'Import Completed with Errors',
      description: result.message,
      status: result.success ? 'success' : 'warning',
      duration: 5000,
      isClosable: true,
    });
  };

  const handleImportError = (error: string) => {
    setImportResult({
      success: false,
      message: error,
    });
    toast({
      title: 'Import Failed',
      description: error,
      status: 'error',
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Layout>
      <Container maxW="7xl" py={8}>
        <Box mb={8}>
          <Heading as="h1" size="xl" mb={2} color="blue.900">
            Admin Score Import & Entry
          </Heading>
          <Text color="gray.600" fontSize="lg" mb={4}>
            Upload Excel/CSV files or manually enter scores for matches
          </Text>
          <Link href="/admin/scores/template" color="blue.500" fontSize="sm">
            📥 Download Excel Template
          </Link>
        </Box>

        {importResult && (
          <Alert
            status={importResult.success ? 'success' : 'warning'}
            mb={6}
            borderRadius="md"
          >
            <AlertIcon />
            <Box>
              <AlertTitle>
                {importResult.success ? 'Import Successful' : 'Import Completed with Errors'}
              </AlertTitle>
              <AlertDescription>
                {importResult.message}
                {importResult.details && (
                  <Box mt={2}>
                    <Text fontSize="sm">
                      Imported: {importResult.details.imported} | 
                      Errors: {importResult.details.errors}
                    </Text>
                    {importResult.details.errorDetails && importResult.details.errorDetails.length > 0 && (
                      <Box mt={2}>
                        <Text fontSize="sm" fontWeight="semibold">Error Details:</Text>
                        <Box maxH="200px" overflowY="auto" mt={1}>
                          {importResult.details.errorDetails.map((error, index) => (
                            <Text key={index} fontSize="xs" color="red.600">
                              • {error}
                            </Text>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <FiUpload style={{ marginRight: '8px' }} />
              Upload Excel/CSV
            </Tab>
            <Tab>
              <FiEdit3 style={{ marginRight: '8px' }} />
              Manual Entry
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <FileUploadComponent
                onImportSuccess={handleImportSuccess}
                onImportError={handleImportError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </TabPanel>
            <TabPanel>
              <ManualEntryComponent
                onImportSuccess={handleImportSuccess}
                onImportError={handleImportError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
} 