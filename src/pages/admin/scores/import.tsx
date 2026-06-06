'use client';

import { useState } from 'react';
import {
  Box,
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
  Text,
} from '@chakra-ui/react';
import { FiUpload, FiEdit3, FiFileText } from 'react-icons/fi';
import FileUploadComponent from '@/components/admin/FileUploadComponent';
import ManualEntryComponent from '@/components/admin/ManualEntryComponent';
import PdfImportComponent from '@/components/admin/PdfImportComponent';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminLoadingPanel from '@/components/admin/AdminLoadingPanel';
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
      <AdminLayout>
        <AdminLoadingPanel />
      </AdminLayout>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  const handleImportSuccess = (result: unknown) => {
    const r = result as ImportResult;
    setImportResult(r);
    toast({
      title: r.success ? 'Import Successful' : 'Import Completed with Errors',
      description: r.message,
      status: r.success ? 'success' : 'warning',
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
    <AdminLayout>
      <AdminPageHeader
        title="Score Import & Entry"
        subtitle="Upload Excel/CSV files or manually enter scores for matches"
        actions={
          <Link href="/admin/scores/template">
            <Box as="span" fontSize="sm" color="brand" fontWeight="semibold">
              Download Excel Template →
            </Box>
          </Link>
        }
      />

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
                        <Text fontSize="sm" fontWeight="semibold">Error Details (first 10 shown):</Text>
                        <Box maxH="200px" overflowY="auto" mt={1}>
                          {importResult.details.errorDetails.slice(0, 10).map((error, index) => (
                            <Text key={index} fontSize="xs" color="red.600">
                              • {error}
                            </Text>
                          ))}
                          {importResult.details.errorDetails.length > 10 && (
                            <Text fontSize="xs" color="gray.600">
                              ...and {importResult.details.errorDetails.length - 10} more
                            </Text>
                          )}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        <Box bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.default" boxShadow="sm" p={{ base: 3, md: 4 }}>
        <Tabs variant="enclosed" colorScheme="green">
          <TabList>
            <Tab>
              <FiUpload style={{ marginRight: '8px' }} />
              Upload Excel/CSV
            </Tab>
            <Tab>
              <FiEdit3 style={{ marginRight: '8px' }} />
              Manual Entry
            </Tab>
            <Tab>
              <FiFileText style={{ marginRight: '8px' }} />
              PDF Import
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
            <TabPanel>
              <PdfImportComponent
                onImportSuccess={handleImportSuccess}
                onImportError={handleImportError}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        </Box>
    </AdminLayout>
  );
} 