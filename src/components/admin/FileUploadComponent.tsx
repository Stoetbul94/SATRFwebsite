'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FiUpload, FiX, FiEye, FiAlertCircle } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import {
  type ExcelScoreRow,
  excelRowToScoreInput,
  mapRawRowToExcelRow,
  rowArraysToRecord,
} from '@/lib/excelImport';

interface FileUploadComponentProps {
  onImportSuccess: (result: unknown) => void;
  onImportError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function FileUploadComponent({
  onImportSuccess,
  onImportError,
  isLoading,
  setIsLoading,
}: FileUploadComponentProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ExcelScoreRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const [isDragOver, setIsDragOver] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const parseFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName =
            workbook.SheetNames.find((n) => n.toLowerCase().includes('prone')) ??
            workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length < 2) {
            onImportError('File must contain a header row and at least one data row');
            return;
          }

          const headers = (jsonData[0] as string[]).map((h) => String(h ?? ''));
          const rows = jsonData.slice(1) as unknown[][];

          const parsedRows: ExcelScoreRow[] = [];
          const allErrors: string[] = [];

          rows.forEach((row, index) => {
            if (!row || row.every((c) => c == null || String(c).trim() === '')) return;

            const rowData = rowArraysToRecord(headers, row);
            const excelRow = mapRawRowToExcelRow(rowData, index);
            if (excelRow.errors?.length) {
              allErrors.push(...excelRow.errors);
            }
            parsedRows.push(excelRow);
          });

          if (parsedRows.length === 0) {
            onImportError('No data rows found on the Prone Scores sheet');
            return;
          }

          setParsedData(parsedRows);
          setValidationErrors(allErrors);
          setUploadedFile(file);
        } catch {
          onImportError("Failed to parse file. Use the SATRF prone template (.xlsx).");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [onImportError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        if (
          file.type.includes('spreadsheet') ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.xls')
        ) {
          parseFile(file);
        } else {
          onImportError('Please upload an Excel (.xlsx, .xls) or CSV file');
        }
      }
    },
    [parseFile, onImportError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleImport = async () => {
    const validRows = parsedData.filter((row) => !row.errors?.length);
    if (validRows.length === 0) {
      onImportError('No valid rows to import');
      return;
    }

    setIsLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) throw new Error('Authentication required. Please log in again.');

      const response = await fetch('/api/admin/scores/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scores: validRows.map((row) => excelRowToScoreInput(row)),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to import scores' }));
        throw new Error(errorData.error || errorData.details || 'Failed to import scores');
      }

      const result = await response.json();
      const errorRows = parsedData.filter((row) => row.errors?.length);

      onImportSuccess({
        success: errorRows.length === 0,
        message: `Imported ${validRows.length} score(s)`,
        details: {
          imported: validRows.length,
          errors: errorRows.length,
          errorDetails: errorRows.flatMap((row) => row.errors ?? []),
        },
        ...result,
      });

      setUploadedFile(null);
      setParsedData([]);
      setValidationErrors([]);
    } catch (error) {
      onImportError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setUploadedFile(null);
    setParsedData([]);
    setValidationErrors([]);
  };

  const validCount = parsedData.filter((row) => !row.errors?.length).length;
  const seriesTotal = (row: ExcelScoreRow) =>
    row.series.reduce((sum, s) => sum + s.decimal, 0).toFixed(1);

  return (
    <VStack spacing={6} align="stretch">
      <Box
        data-testid="file-drop-zone"
        border="2px dashed"
        borderColor={isDragOver ? 'blue.400' : borderColor}
        borderRadius="lg"
        p={8}
        textAlign="center"
        bg={isDragOver ? 'blue.50' : bgColor}
        transition="all 0.2s"
        cursor="pointer"
        onClick={() => document.getElementById('file-input')?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <VStack spacing={4}>
          <FiUpload size={48} color={isDragOver ? '#3182ce' : '#718096'} />
          <Text fontSize="lg" fontWeight="medium">
            {uploadedFile ? uploadedFile.name : 'Drag & drop prone score Excel here'}
          </Text>
          <Text color="gray.500">
            Use the template from Admin → Scores → Import (Prone Scores sheet)
          </Text>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </VStack>
      </Box>

      {uploadedFile && (
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600">
            {parsedData.length} rows · {validCount} valid
          </Text>
          <HStack>
            <Tooltip label="Preview Data">
              <IconButton aria-label="Preview data" icon={<FiEye />} size="sm" onClick={onOpen} />
            </Tooltip>
            <Button leftIcon={<FiX />} variant="outline" size="sm" onClick={clearFile}>
              Clear
            </Button>
          </HStack>
        </HStack>
      )}

      {validationErrors.length > 0 && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">Found {validationErrors.length} validation issue(s):</Text>
            <Box maxH="200px" overflowY="auto" mt={2}>
              {validationErrors.slice(0, 10).map((error, index) => (
                <Text key={index} fontSize="sm" color="orange.600">
                  • {error}
                </Text>
              ))}
              {validationErrors.length > 10 && (
                <Text fontSize="sm" color="orange.600">
                  ... and {validationErrors.length - 10} more
                </Text>
              )}
            </Box>
          </Box>
        </Alert>
      )}

      {parsedData.length > 0 && (
        <Box>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleImport}
            isLoading={isLoading}
            loadingText="Importing..."
            isDisabled={validCount === 0}
            w="full"
          >
            Import {validCount} score{validCount === 1 ? '' : 's'}
          </Button>
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>#</Th>
                    <Th>Date</Th>
                    <Th>Event</Th>
                    <Th>Shooter</Th>
                    <Th>Club</Th>
                    <Th>Cat.</Th>
                    <Th>S1–S6</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {parsedData.map((row, index) => (
                    <Tr key={index} bg={row.errors?.length ? 'red.50' : 'white'}>
                      <Td>{index + 1}</Td>
                      <Td>{row.date}</Td>
                      <Td>{row.eventName}</Td>
                      <Td>{row.shooterName}</Td>
                      <Td>{row.club}</Td>
                      <Td>{row.category}</Td>
                      <Td>{row.series.map((s) => s.decimal).join(' / ')}</Td>
                      <Td>{seriesTotal(row)}</Td>
                      <Td>
                        {row.errors?.length ? (
                          <Badge colorScheme="red">
                            <FiAlertCircle style={{ marginRight: '4px' }} />
                            Errors
                          </Badge>
                        ) : (
                          <Badge colorScheme="green">Valid</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
