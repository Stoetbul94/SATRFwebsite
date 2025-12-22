'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  IconButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiSave } from 'react-icons/fi';

interface ScoreRow {
  id: string;
  eventName: string;
  matchNumber: string;
  shooterName: string;
  club: string;
  division: string; // This contains the class: Prone A class, Prone B class, Prone C class, 3P, F-Class, H-class
  veteran: string;
  series1: number;
  series2: number;
  series3: number;
  series4: number;
  series5: number;
  series6: number;
  total: number;
  place?: number;
  errors: string[];
}

interface ManualEntryComponentProps {
  onImportSuccess: (result: any) => void;
  onImportError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const VALID_EVENTS = ['Prone Match 1', 'Prone Match 2', '3P', 'Air Rifle'];
// Division now contains the class values
const VALID_DIVISIONS = ['Prone A class', 'Prone B class', 'Prone C class', '3P', 'F-Class', 'H-class'];

export default function ManualEntryComponent({
  onImportSuccess,
  onImportError,
  isLoading,
  setIsLoading,
}: ManualEntryComponentProps) {
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const toast = useToast();

  const createEmptyRow = (): ScoreRow => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    eventName: '',
    matchNumber: '',
    shooterName: '',
    club: '',
    division: '', // Contains class: Prone A class, Prone B class, Prone C class, 3P, F-Class, H-class
    veteran: '',
    series1: 0,
    series2: 0,
    series3: 0,
    series4: 0,
    series5: 0,
    series6: 0,
    total: 0,
    place: undefined,
    errors: [],
  });

  const validateScore = (score: number): boolean => {
    return score >= 0 && score <= 109 && Number.isFinite(score);
  };

  const validateRow = (row: ScoreRow): string[] => {
    const errors: string[] = [];

    // Event name validation - allow any non-empty string (changed from dropdown to manual input)
    if (!row.eventName || !row.eventName.trim()) {
      errors.push('Event name is required');
    } else if (row.eventName.trim().length > 200) {
      errors.push('Event name must be less than 200 characters');
    }

    if (!row.matchNumber.trim()) {
      errors.push('Missing match number');
    }

    if (!row.shooterName.trim()) {
      errors.push('Missing shooter name');
    }

    if (!row.club.trim()) {
      errors.push('Missing club');
    }

    if (!row.division || !VALID_DIVISIONS.includes(row.division)) {
      errors.push('Invalid or missing division/class');
    }

    if (!row.veteran || !['Y', 'N'].includes(row.veteran.toUpperCase())) {
      errors.push('Veteran must be Y or N');
    }

    // Validate series scores
    const series = [row.series1, row.series2, row.series3, row.series4, row.series5, row.series6];
    series.forEach((score, index) => {
      if (!validateScore(score)) {
        errors.push(`Series ${index + 1} score must be between 0 and 109`);
      }
    });

    // Validate total
    const calculatedTotal = series.reduce((sum, score) => sum + score, 0);
    if (Math.abs(calculatedTotal - row.total) > 0.1) {
      errors.push('Total score doesn\'t match sum of series');
    }

    return errors;
  };

  // Calculate place based on Event Name, Match #, and Division (Class)
  const calculatePlaces = useCallback((rows: ScoreRow[]): ScoreRow[] => {
    // Group rows by Event Name, Match #, and Division (Class)
    const groups: { [key: string]: ScoreRow[] } = {};
    
    rows.forEach(row => {
      if (row.eventName && row.matchNumber && row.division && row.total > 0) {
        const key = `${row.eventName}|${row.matchNumber}|${row.division}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(row);
      }
    });
    
    // Sort each group by total (descending) and assign places
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      // Sort by total descending, then by shooter name for ties
      group.sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        return a.shooterName.localeCompare(b.shooterName);
      });
      
      // Assign places (handle ties - same place for same score)
      let currentPlace = 1;
      for (let i = 0; i < group.length; i++) {
        if (i > 0 && group[i].total < group[i - 1].total) {
          currentPlace = i + 1;
        }
        group[i].place = currentPlace;
      }
    });
    
    return rows;
  }, []);

  const updateRow = useCallback((id: string, field: keyof ScoreRow, value: any) => {
    setRows(prevRows => {
      const updatedRows = prevRows.map(row => {
        if (row.id === id) {
          const updatedRow = { ...row, [field]: value };
          
          // Auto-calculate total if series scores change
          if (field.startsWith('series')) {
            // Handle empty string or NaN values properly
            const series = [
              updatedRow.series1,
              updatedRow.series2,
              updatedRow.series3,
              updatedRow.series4,
              updatedRow.series5,
              updatedRow.series6,
            ].map(score => {
              // Convert to number, default to 0 if invalid
              const num = typeof score === 'string' ? parseFloat(score) : score;
              return isNaN(num) || num === null || num === undefined ? 0 : num;
            });
            updatedRow.total = series.reduce((sum, score) => sum + score, 0);
          }
          
          // Validate the row
          updatedRow.errors = validateRow(updatedRow);
          
          return updatedRow;
        }
        return row;
      });
      
      // Recalculate places after any update
      const rowsWithPlaces = calculatePlaces(updatedRows);
      
      // Update overall validation errors
      const allErrors = rowsWithPlaces.flatMap(row => row.errors);
      setValidationErrors(allErrors);
      
      return rowsWithPlaces;
    });
  }, [calculatePlaces]);

  const addRow = () => {
    setRows(prevRows => [...prevRows, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    setRows(prevRows => {
      const updatedRows = prevRows.filter(row => row.id !== id);
      const allErrors = updatedRows.flatMap(row => row.errors);
      setValidationErrors(allErrors);
      return updatedRows;
    });
  };

  const handleSave = async () => {
    if (rows.length === 0) {
      onImportError('No scores to save');
      return;
    }

    const validRows = rows.filter(row => row.errors.length === 0);
    const errorRows = rows.filter(row => row.errors.length > 0);

    if (validRows.length === 0) {
      onImportError('No valid scores to save');
      return;
    }

    setIsLoading(true);
    try {
      // Get auth token
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

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
        const errorData = await response.json().catch(() => ({ error: 'Failed to save scores' }));
        const errorMessage = errorData.error || errorData.details || 'Failed to save scores';
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      onImportSuccess({
        success: errorRows.length === 0,
        message: `Successfully saved ${validRows.length} scores${errorRows.length > 0 ? ` with ${errorRows.length} errors` : ''}`,
        details: {
          imported: validRows.length,
          errors: errorRows.length,
          errorDetails: errorRows.flatMap(row => row.errors),
        },
      });

      // Reset form
      setRows([]);
      setValidationErrors([]);
    } catch (error) {
      onImportError(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  const hasValidRows = rows.some(row => row.errors.length === 0);

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="medium">
          Manual Score Entry
        </Text>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          size="sm"
          onClick={addRow}
        >
          Add Row
        </Button>
      </HStack>

      {/* Validation Summary */}
      {validationErrors.length > 0 && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">
              Found {validationErrors.length} validation errors:
            </Text>
            <Box maxH="150px" overflowY="auto" mt={2}>
              {validationErrors.slice(0, 5).map((error, index) => (
                <Text key={index} fontSize="sm" color="orange.600">
                  • {error}
                </Text>
              ))}
              {validationErrors.length > 5 && (
                <Text fontSize="sm" color="orange.600">
                  ... and {validationErrors.length - 5} more errors
                </Text>
              )}
            </Box>
          </Box>
        </Alert>
      )}

      {/* Score Entry Table */}
      {rows.length > 0 && (
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead>
              <Tr>
                <Th minW="180px">Event</Th>
                <Th minW="120px">Match #</Th>
                <Th minW="180px">Shooter</Th>
                <Th minW="150px">Club</Th>
                <Th minW="150px">Division</Th>
                <Th minW="90px">Veteran</Th>
                <Th minW="100px">Series 1</Th>
                <Th minW="100px">Series 2</Th>
                <Th minW="100px">Series 3</Th>
                <Th minW="100px">Series 4</Th>
                <Th minW="100px">Series 5</Th>
                <Th minW="100px">Series 6</Th>
                <Th minW="100px">Total</Th>
                <Th minW="80px">Place</Th>
                <Th minW="120px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.id} bg={row.errors.length > 0 ? 'red.50' : 'white'}>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('event name'))}>
                      <Input
                        value={row.eventName}
                        onChange={(e) => updateRow(row.id, 'eventName', e.target.value)}
                        size="md"
                        placeholder="Event Name"
                        fontSize="sm"
                        w="180px"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('match number'))}>
                      <Input
                        value={row.matchNumber}
                        onChange={(e) => updateRow(row.id, 'matchNumber', e.target.value)}
                        size="md"
                        placeholder="Match #"
                        fontSize="sm"
                        w="120px"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('shooter name'))}>
                      <Input
                        value={row.shooterName}
                        onChange={(e) => updateRow(row.id, 'shooterName', e.target.value)}
                        size="md"
                        placeholder="Shooter Name"
                        fontSize="sm"
                        w="180px"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('club'))}>
                      <Input
                        value={row.club}
                        onChange={(e) => updateRow(row.id, 'club', e.target.value)}
                        size="md"
                        placeholder="Club"
                        fontSize="sm"
                        w="150px"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('division'))}>
                      <Select
                        value={row.division}
                        onChange={(e) => updateRow(row.id, 'division', e.target.value)}
                        size="md"
                        fontSize="sm"
                      >
                        <option value="">Select Division</option>
                        {VALID_DIVISIONS.map(division => (
                          <option key={division} value={division}>{division}</option>
                        ))}
                      </Select>
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('Veteran'))}>
                      <Select
                        value={row.veteran}
                        onChange={(e) => updateRow(row.id, 'veteran', e.target.value)}
                        size="md"
                        fontSize="sm"
                      >
                        <option value="">Y/N</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </Select>
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('Series 1'))}>
                      <Input
                        type="number"
                        value={row.series1 || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          updateRow(row.id, 'series1', isNaN(val) ? 0 : val);
                        }}
                        size="md"
                        min="0"
                        max="109"
                        step="0.1"
                        fontSize="sm"
                        textAlign="center"
                        w="100px"
                        placeholder="0.0"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('Series 2'))}>
                      <Input
                        type="number"
                        value={row.series2 || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          updateRow(row.id, 'series2', isNaN(val) ? 0 : val);
                        }}
                        size="md"
                        min="0"
                        max="109"
                        step="0.1"
                        fontSize="sm"
                        textAlign="center"
                        w="100px"
                        placeholder="0.0"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('Series 3'))}>
                      <Input
                        type="number"
                        value={row.series3 || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          updateRow(row.id, 'series3', isNaN(val) ? 0 : val);
                        }}
                        size="md"
                        min="0"
                        max="109"
                        step="0.1"
                        fontSize="sm"
                        textAlign="center"
                        w="100px"
                        placeholder="0.0"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('Series 4'))}>
                      <Input
                        type="number"
                        value={row.series4 || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          updateRow(row.id, 'series4', isNaN(val) ? 0 : val);
                        }}
                        size="md"
                        min="0"
                        max="109"
                        step="0.1"
                        fontSize="sm"
                        textAlign="center"
                        w="100px"
                        placeholder="0.0"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('Series 5'))}>
                      <Input
                        type="number"
                        value={row.series5 || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          updateRow(row.id, 'series5', isNaN(val) ? 0 : val);
                        }}
                        size="md"
                        min="0"
                        max="109"
                        step="0.1"
                        fontSize="sm"
                        textAlign="center"
                        w="100px"
                        placeholder="0.0"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <FormControl isInvalid={row.errors.some(e => e.includes('Series 6'))}>
                      <Input
                        type="number"
                        value={row.series6 || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          updateRow(row.id, 'series6', isNaN(val) ? 0 : val);
                        }}
                        size="md"
                        min="0"
                        max="109"
                        step="0.1"
                        fontSize="sm"
                        textAlign="center"
                        w="100px"
                        placeholder="0.0"
                      />
                    </FormControl>
                  </Td>
                  <Td>
                    <Input
                      value={row.total}
                      isReadOnly
                      size="md"
                      bg="gray.100"
                      fontWeight="semibold"
                      fontSize="sm"
                      textAlign="center"
                    />
                  </Td>
                  <Td>
                    <Input
                      value={row.place || ''}
                      isReadOnly
                      size="md"
                      bg="blue.50"
                      fontWeight="semibold"
                      fontSize="sm"
                      textAlign="center"
                      placeholder="Auto"
                      title="Place is automatically calculated based on Event Name, Match #, and Division (Class)"
                    />
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      {row.errors.length > 0 && (
                        <Badge colorScheme="red" fontSize="xs">
                          {row.errors.length} errors
                        </Badge>
                      )}
                      <IconButton
                        aria-label="Remove row"
                        icon={<FiTrash2 />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => removeRow(row.id)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Save Button */}
      {rows.length > 0 && (
        <Box>
          <Button
            leftIcon={<FiSave />}
            colorScheme="blue"
            size="lg"
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="Saving..."
            isDisabled={!hasValidRows}
            w="full"
          >
            Save {rows.filter(row => row.errors.length === 0).length} Valid Scores
          </Button>
          {validationErrors.length > 0 && (
            <Text fontSize="sm" color="gray.600" mt={2} textAlign="center">
              {validationErrors.length} validation errors found
            </Text>
          )}
        </Box>
      )}

      {/* Empty State */}
      {rows.length === 0 && (
        <Box
          border="2px dashed"
          borderColor="gray.300"
          borderRadius="lg"
          p={8}
          textAlign="center"
          bg="gray.50"
        >
          <Text color="gray.500" mb={4}>
            No scores entered yet
          </Text>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={addRow}
          >
            Add First Score
          </Button>
        </Box>
      )}
    </VStack>
  );
} 