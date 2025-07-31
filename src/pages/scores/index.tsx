import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  Stack,
  Text,
  useColorModeValue,
  Button,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { FaDownload, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

interface Score {
  id: string;
  athleteName: string;
  eventName: string;
  score: number;
  rank: number;
  date: string;
  category: string;
}

// Mock data - in a real app, this would come from an API
const MOCK_SCORES: Score[] = [
  {
    id: '1',
    athleteName: 'John Smith',
    eventName: 'National Championship 2024',
    score: 95.8,
    rank: 1,
    date: '2024-03-15',
    category: 'Senior',
  },
  {
    id: '2',
    athleteName: 'Sarah Johnson',
    eventName: 'National Championship 2024',
    score: 94.5,
    rank: 2,
    date: '2024-03-15',
    category: 'Senior',
  },
  {
    id: '3',
    athleteName: 'Mike Brown',
    eventName: 'National Championship 2024',
    score: 93.2,
    rank: 3,
    date: '2024-03-15',
    category: 'Senior',
  },
];

type SortField = 'score' | 'rank' | 'date';
type SortOrder = 'asc' | 'desc';

export default function Scores() {
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredScores = MOCK_SCORES.filter((score) => {
    const matchesEvent = selectedEvent === 'all' || score.eventName === selectedEvent;
    const matchesCategory = selectedCategory === 'all' || score.category === selectedCategory;
    const matchesSearch = score.athleteName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEvent && matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'score') {
      return (a.score - b.score) * multiplier;
    } else if (sortField === 'rank') {
      return (a.rank - b.rank) * multiplier;
    } else {
      return a.date.localeCompare(b.date) * multiplier;
    }
  });

  const handleDownload = (format: 'csv' | 'pdf') => {
    // In a real app, this would generate and download the file
    console.log(`Downloading scores in ${format} format`);
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Stack spacing={8}>
          <Box>
            <Heading size="xl" mb={2}>
              Event Scores & Leaderboards
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              View and track competition results
            </Text>
          </Box>

          <HStack spacing={4} wrap="wrap">
            <Select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              maxW="200px"
            >
              <option value="all">All Events</option>
              <option value="National Championship 2024">National Championship 2024</option>
            </Select>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              maxW="200px"
            >
              <option value="all">All Categories</option>
              <option value="Junior">Junior</option>
              <option value="Senior">Senior</option>
              <option value="Veteran">Veteran</option>
            </Select>

            <Input
              placeholder="Search by athlete name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              maxW="300px"
            />

            <Button
              leftIcon={<FaDownload />}
              onClick={() => handleDownload('csv')}
              variant="outline"
            >
              Download CSV
            </Button>
            <Button
              leftIcon={<FaDownload />}
              onClick={() => handleDownload('pdf')}
              variant="outline"
            >
              Download PDF
            </Button>
          </HStack>

          <Box
            overflowX="auto"
            bg={useColorModeValue('white', 'gray.700')}
            rounded="lg"
            shadow="md"
          >
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Rank</Th>
                  <Th>Athlete</Th>
                  <Th>Event</Th>
                  <Th>Category</Th>
                  <Th>
                    Score
                    <IconButton
                      aria-label="Sort by score"
                      icon={
                        sortField === 'score' ? (
                          sortOrder === 'asc' ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort />
                        )
                      }
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSort('score')}
                    />
                  </Th>
                  <Th>
                    Date
                    <IconButton
                      aria-label="Sort by date"
                      icon={
                        sortField === 'date' ? (
                          sortOrder === 'asc' ? (
                            <FaSortUp />
                          ) : (
                            <FaSortDown />
                          )
                        ) : (
                          <FaSort />
                        )
                      }
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSort('date')}
                    />
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredScores.map((score) => (
                  <Tr key={score.id}>
                    <Td>{score.rank}</Td>
                    <Td>{score.athleteName}</Td>
                    <Td>{score.eventName}</Td>
                    <Td>{score.category}</Td>
                    <Td>{score.score}</Td>
                    <Td>{new Date(score.date).toLocaleDateString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Stack>
      </Container>
    </Layout>
  );
} 