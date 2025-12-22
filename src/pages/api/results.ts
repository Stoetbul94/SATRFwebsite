import { NextApiRequest, NextApiResponse } from 'next';

// Types
interface MatchResult {
  id: string;
  place: number;
  name: string;
  club: string;
  division: string;
  veteran: boolean;
  series1: number;
  series2: number;
  series3: number;
  series4: number;
  series5: number;
  series6: number;
  total: number;
  isPersonalBest?: boolean;
  isMatchBest?: boolean;
}

interface ResultsData {
  event: string;
  matchNumber: number;
  results: MatchResult[];
}

// Mock data - replace with database query
const MOCK_RESULTS: ResultsData[] = [
  {
    event: 'Prone Match 1',
    matchNumber: 1,
    results: [
      {
        id: '1',
        place: 1,
        name: 'John Smith',
        club: 'SATRF Club A',
        division: 'Senior',
        veteran: false,
        series1: 98,
        series2: 99,
        series3: 97,
        series4: 100,
        series5: 98,
        series6: 99,
        total: 591,
        isPersonalBest: true,
        isMatchBest: true,
      },
      {
        id: '2',
        place: 2,
        name: 'Sarah Johnson',
        club: 'SATRF Club B',
        division: 'Senior',
        veteran: false,
        series1: 97,
        series2: 98,
        series3: 96,
        series4: 99,
        series5: 97,
        series6: 98,
        total: 585,
        isPersonalBest: false,
        isMatchBest: false,
      },
      {
        id: '3',
        place: 3,
        name: 'Mike Brown',
        club: 'SATRF Club C',
        division: 'Veteran',
        veteran: true,
        series1: 96,
        series2: 97,
        series3: 95,
        series4: 98,
        series5: 96,
        series6: 97,
        total: 579,
        isPersonalBest: true,
        isMatchBest: false,
      },
    ],
  },
  {
    event: '3P Match 1',
    matchNumber: 1,
    results: [
      {
        id: '4',
        place: 1,
        name: 'Alex Wilson',
        club: 'SATRF Club A',
        division: 'Senior',
        veteran: false,
        series1: 95,
        series2: 96,
        series3: 94,
        series4: 97,
        series5: 95,
        series6: 96,
        total: 573,
        isPersonalBest: false,
        isMatchBest: true,
      },
      {
        id: '5',
        place: 2,
        name: 'Emma Davis',
        club: 'SATRF Club B',
        division: 'Junior',
        veteran: false,
        series1: 94,
        series2: 95,
        series3: 93,
        series4: 96,
        series5: 94,
        series6: 95,
        total: 567,
        isPersonalBest: true,
        isMatchBest: false,
      },
    ],
  },
  {
    event: 'Prone Match 1',
    matchNumber: 2,
    results: [
      {
        id: '6',
        place: 1,
        name: 'David Lee',
        club: 'SATRF Club D',
        division: 'Senior',
        veteran: false,
        series1: 99,
        series2: 100,
        series3: 98,
        series4: 99,
        series5: 100,
        series6: 99,
        total: 595,
        isPersonalBest: true,
        isMatchBest: true,
      },
    ],
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { event, match } = req.query;

    let filteredResults = MOCK_RESULTS;

    // Filter by event if specified
    if (event && event !== 'all') {
      filteredResults = filteredResults.filter(r => r.event === event);
    }

    // Filter by match number if specified
    if (match && match !== 'all') {
      const matchNumber = parseInt(match as string);
      filteredResults = filteredResults.filter(r => r.matchNumber === matchNumber);
    }

    // In a real implementation, you would:
    // 1. Connect to your database
    // 2. Build a query based on the filters
    // 3. Execute the query and return results
    // 4. Handle pagination if needed

    // Example database query structure:
    /*
    const query = `
      SELECT 
        r.id,
        r.place,
        u.first_name || ' ' || u.last_name as name,
        u.club,
        u.division,
        u.veteran,
        r.series1,
        r.series2,
        r.series3,
        r.series4,
        r.series5,
        r.series6,
        (r.series1 + r.series2 + r.series3 + r.series4 + r.series5 + r.series6) as total,
        r.is_personal_best,
        r.is_match_best
      FROM results r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE 1=1
        ${event && event !== 'all' ? `AND e.name = '${event}'` : ''}
        ${match && match !== 'all' ? `AND e.match_number = ${match}` : ''}
      ORDER BY r.place ASC
    `;
    */

    // Add artificial delay to simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    res.status(200).json({
      success: true,
      data: filteredResults,
      meta: {
        total: filteredResults.length,
        filters: {
          event: event || 'all',
          match: match || 'all',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
} 