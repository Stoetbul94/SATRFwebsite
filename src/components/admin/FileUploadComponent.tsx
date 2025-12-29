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
  Progress,
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

interface ScoreRow {
  eventName: string;
  matchNumber: string;
  shooterName: string;
  club: string;
  division: string; // Contains class: Prone A class, Prone B class, Prone C class, 3P, F-Class, H-class
  veteran: string;
  series1: number;
  series2: number;
  series3: number;
  series4: number;
  series5: number;
  series6: number;
  total: number;
  place?: number;
  errors?: string[];
}

interface FileUploadComponentProps {
  onImportSuccess: (result: any) => void;
  onImportError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const VALID_EVENTS = ['Prone Match 1', 'Prone Match 2', '3P', 'Air Rifle'];
// Division now contains the class values
const VALID_DIVISIONS = ['Prone A class', 'Prone B class', 'Prone C class', '3P', 'F-Class', 'H-class'];

// Header mapping from normalized headers to camelCase keys
// Handles both "Series 1" (with space) and "series1" (no space) formats
const HEADER_MAP: { [key: string]: string } = {
  'eventname': 'eventName',
  'event name': 'eventName',
  'matchnumber': 'matchNumber',
  'match number': 'matchNumber',
  'shootername': 'shooterName',
  'shooter name': 'shooterName',
  'club': 'club',
  'division': 'division',
  'divisionclass': 'division',
  'division/class': 'division',
  'division class': 'division',
  'class': 'division', // Map 'class' to 'division' since division now contains class values
  'veteran': 'veteran',
  'series1': 'series1',
  'series 1': 'series1',
  'series2': 'series2',
  'series 2': 'series2',
  'series3': 'series3',
  'series 3': 'series3',
  'series4': 'series4',
  'series 4': 'series4',
  'series5': 'series5',
  'series 5': 'series5',
  'series6': 'series6',
  'series 6': 'series6',
  'total': 'total',
  'place': 'place'
};

export default function FileUploadComponent({
  onImportSuccess,
  onImportError,
  isLoading,
  setIsLoading,
}: FileUploadComponentProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ScoreRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  // All useColorModeValue calls must be at the very top, before any other hooks
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.600');
  
  const [isDragOver, setIsDragOver] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const validateScore = (score: number): boolean => {
    return score >= 0 && score <= 109 && Number.isFinite(score);
  };

  const validateRow = (row: any, rowIndex: number): string[] => {
    const errors: string[] = [];

    // Required fields
    if (!row.eventName || !VALID_EVENTS.includes(row.eventName)) {
      errors.push(`Row ${rowIndex + 1}: Invalid or missing event name`);
    }

    if (!row.matchNumber) {
      errors.push(`Row ${rowIndex + 1}: Missing match number`);
    }

    if (!row.shooterName) {
      errors.push(`Row ${rowIndex + 1}: Missing shooter name`);
    }

    if (!row.club) {
      errors.push(`Row ${rowIndex + 1}: Missing club`);
    }

    if (!row.division || !VALID_DIVISIONS.includes(row.division)) {
      errors.push(`Row ${rowIndex + 1}: Invalid or missing division/class`);
    }

    if (!row.veteran || !['Y', 'N'].includes(row.veteran.toUpperCase())) {
      errors.push(`Row ${rowIndex + 1}: Veteran must be Y or N`);
    }

    // Validate series scores
    const series = [row.series1, row.series2, row.series3, row.series4, row.series5, row.series6];
    series.forEach((score, index) => {
      if (!validateScore(score)) {
        errors.push(`Row ${rowIndex + 1}: Series ${index + 1} score must be between 0 and 109`);
      }
    });

    // Validate total
    const calculatedTotal = series.reduce((sum, score) => sum + (score || 0), 0);
    if (Math.abs(calculatedTotal - (row.total || 0)) > 0.1) {
      errors.push(`Row ${rowIndex + 1}: Total score doesn't match sum of series`);
    }

    return errors;
  };

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          onImportError('File must contain at least a header row and one data row');
          return;
        }

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];

        const parsedRows: ScoreRow[] = [];
        const allErrors: string[] = [];

        rows.forEach((row, index) => {
          const rowData: any = {};
          
          // Map headers to camelCase keys using HEADER_MAP
          headers.forEach((header, colIndex) => {
            const normalizedHeader = header.toLowerCase().replace(/[\s\/]/g, '');
            const camelCaseKey = HEADER_MAP[normalizedHeader];
            if (camelCaseKey) {
              rowData[camelCaseKey] = row[colIndex];
            }
          });

          const errors = validateRow(rowData, index);
          if (errors.length > 0) {
            allErrors.push(...errors);
          }

          parsedRows.push({
            eventName: rowData.eventName || '',
            matchNumber: rowData.matchNumber || '',
            shooterName: rowData.shooterName || '',
            club: rowData.club || '',
            division: rowData.division || '',
            veteran: rowData.veteran || '',
            series1: parseFloat(rowData.series1) || 0,
            series2: parseFloat(rowData.series2) || 0,
            series3: parseFloat(rowData.series3) || 0,
            series4: parseFloat(rowData.series4) || 0,
            series5: parseFloat(rowData.series5) || 0,
            series6: parseFloat(rowData.series6) || 0,
            total: parseFloat(rowData.total) || 0,
            place: rowData.place ? parseInt(rowData.place) : undefined,
            errors: errors.length > 0 ? errors : undefined,
          });
        });

        setParsedData(parsedRows);
        setValidationErrors(allErrors);
        setUploadedFile(file);
      } catch (error) {
        onImportError('Failed to parse file. Please ensure it\'s a valid Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [onImportError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.includes('spreadsheet') || file.name.endsWith('.csv')) {
        parseFile(file);
      } else {
        onImportError('Please upload an Excel (.xlsx, .xls) or CSV file');
      }
    }
  }, [parseFile, onImportError]);

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
    if (file) {
      parseFile(file);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      onImportError('No data to import');
      return;
    }

    setIsLoading(true);
    try {
      const validRows = parsedData.filter(row => !row.errors || row.errors.length === 0);
      const errorRows = parsedData.filter(row => row.errors && row.errors.length > 0);

      // Get auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Send valid rows to backend
      const response = await fetch('/api/admin/scores/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          scores: validRows.map(row => ({
            eventName: row.eventName,
            matchNumber: row.matchNumber,
            shooterName: row.shooterName,
            club: row.club,
            division: row.division,
            veteran: row.veteran === 'Y',
            series1: row.series1,
            series2: row.series2,
            series3: row.series3,
            series4: row.series4,
            series5: row.series5,
            series6: row.series6,
            total: row.total,
            place: row.place,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to import scores' }));
        const errorMessage = errorData.error || errorData.details || 'Failed to import scores';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      onImportSuccess({
        success: errorRows.length === 0,
        message: `Successfully imported ${validRows.length} scores${errorRows.length > 0 ? ` with ${errorRows.length} errors` : ''}`,
        details: {
          imported: validRows.length,
          errors: errorRows.length,
          errorDetails: errorRows.flatMap(row => row.errors || []),
        },
      });

      // Reset form
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

  return (
    <VStack spacing={6} align="stretch">
      {/* File Upload Area */}
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
            {uploadedFile ? uploadedFile.name : 'Drag & drop Excel/CSV file here'}
          </Text>
          <Text color="gray.500">
            or click to browse files
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

      {/* File Actions */}
      {uploadedFile && (
        <HStack justify="space-between">
          <Text fontSize="sm" color="gray.600">
            {parsedData.length} rows parsed
          </Text>
          <HStack>
            <Tooltip label="Preview Data">
              <IconButton
                aria-label="Preview data"
                icon={<FiEye />}
                size="sm"
                onClick={onOpen}
              />
            </Tooltip>
            <Button
              leftIcon={<FiX />}
              variant="outline"
              size="sm"
              onClick={clearFile}
            >
              Clear
            </Button>
          </HStack>
        </HStack>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">
              Found {validationErrors.length} validation errors:
            </Text>
            <Box maxH="200px" overflowY="auto" mt={2}>
              {validationErrors.slice(0, 10).map((error, index) => (
                <Text key={index} fontSize="sm" color="orange.600">
                  • {error}
                </Text>
              ))}
              {validationErrors.length > 10 && (
                <Text fontSize="sm" color="orange.600">
                  ... and {validationErrors.length - 10} more errors
                </Text>
              )}
            </Box>
          </Box>
        </Alert>
      )}

      {/* Import Button */}
      {parsedData.length > 0 && (
        <Box>
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleImport}
            isLoading={isLoading}
            loadingText="Importing..."
            isDisabled={validationErrors.length === parsedData.length}
            w="full"
          >
            Import {parsedData.filter(row => !row.errors || row.errors.length === 0).length} Valid Scores
          </Button>
          {validationErrors.length > 0 && (
            <Text fontSize="sm" color="gray.600" mt={2} textAlign="center">
              {validationErrors.length} rows have errors and will be skipped
            </Text>
          )}
        </Box>
      )}

      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Data Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Row</Th>
                    <Th>Event</Th>
                    <Th>Match</Th>
                    <Th>Shooter</Th>
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
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {parsedData.map((row, index) => (
                    <Tr key={index} bg={row.errors ? 'red.50' : 'white'}>
                      <Td>{index + 1}</Td>
                      <Td>{row.eventName}</Td>
                      <Td>{row.matchNumber}</Td>
                      <Td>{row.shooterName}</Td>
                      <Td>{row.club}</Td>
                      <Td>{row.division}</Td>
                      <Td>{row.veteran}</Td>
                      <Td>{row.series1}</Td>
                      <Td>{row.series2}</Td>
                      <Td>{row.series3}</Td>
                      <Td>{row.series4}</Td>
                      <Td>{row.series5}</Td>
                      <Td>{row.series6}</Td>
                      <Td>{row.total}</Td>
                      <Td>{row.place || '-'}</Td>
                      <Td>
                        {row.errors ? (
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