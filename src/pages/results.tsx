import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import { ChevronUpIcon, ChevronDownIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { resultsAPI } from '@/lib/api';

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

// Mock data - replace with API call
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
];

type SortField = 'total' | 'place' | 'name';
type SortOrder = 'asc' | 'desc';

export default function Results() {
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedMatch, setSelectedMatch] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [results, setResults] = useState<ResultsData[]>([]);
  const [loading, setLoading] = useState(true);

  // Get unique events and matches for filters
  const events = ['all', ...Array.from(new Set(MOCK_RESULTS.map(r => r.event)))];
  const matches = ['all', ...Array.from(new Set(MOCK_RESULTS.map(r => r.matchNumber.toString())))];

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await resultsAPI.getResults({
          event: selectedEvent,
          match: selectedMatch,
        });
        
        if (data.success) {
          setResults(data.data);
        } else {
          console.error('API error:', data.message);
          setResults([]);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [selectedEvent, selectedMatch]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUpDownIcon className="w-4 h-4" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4" /> : 
      <ChevronDownIcon className="w-4 h-4" />;
  };

  const sortResults = (results: MatchResult[]) => {
    return [...results].sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'total':
          return (a.total - b.total) * multiplier;
        case 'place':
          return (a.place - b.place) * multiplier;
        case 'name':
          return a.name.localeCompare(b.name) * multiplier;
        default:
          return 0;
      }
    });
  };

  const getScoreClass = (result: MatchResult, seriesValue: number) => {
    if (result.isMatchBest && seriesValue === Math.max(result.series1, result.series2, result.series3, result.series4, result.series5, result.series6)) {
      return 'font-bold text-green-600 bg-green-50';
    }
    if (result.isPersonalBest && seriesValue === Math.max(result.series1, result.series2, result.series3, result.series4, result.series5, result.series6)) {
      return 'font-bold text-blue-600 bg-blue-50';
    }
    return '';
  };

  const getTotalClass = (result: MatchResult) => {
    if (result.isMatchBest) {
      return 'font-bold text-green-600 bg-green-50';
    }
    if (result.isPersonalBest) {
      return 'font-bold text-blue-600 bg-blue-50';
    }
    return '';
  };

  return (
    <Layout>
      <Head>
        <title>Match Results - SATRF</title>
        <meta name="description" content="View SATRF match results and rankings" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Match Results
            </h1>
            <p className="text-gray-600">
              View and filter competition results by event and match number
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="event-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Event
                </label>
                <select
                  id="event-filter"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {events.map((event) => (
                    <option key={event} value={event}>
                      {event === 'all' ? 'All Events' : event}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="match-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Match Number
                </label>
                <select
                  id="match-filter"
                  value={selectedMatch}
                  onChange={(e) => setSelectedMatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {matches.map((match) => (
                    <option key={match} value={match}>
                      {match === 'all' ? 'All Matches' : `Match ${match}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedEvent('all');
                    setSelectedMatch('all');
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" role="status"></div>
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-500">
                No match results are available for the selected filters.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {results.map((matchData) => (
                <div key={`${matchData.event}-${matchData.matchNumber}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Match Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {matchData.event} - Match {matchData.matchNumber}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {matchData.results.length} participants
                    </p>
                  </div>

                                     {/* Results Table */}
                   <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                                                     <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Place
                           </th>
                           <th 
                             className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                             onClick={() => handleSort('name')}
                           >
                             <div className="flex items-center space-x-1">
                               <span>Name</span>
                               {getSortIcon('name')}
                             </div>
                           </th>
                           <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Club
                           </th>
                           <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Division
                           </th>
                           <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                             Veteran
                           </th>
                           <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             S1
                           </th>
                           <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             S2
                           </th>
                           <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             S3
                           </th>
                           <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             S4
                           </th>
                           <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             S5
                           </th>
                           <th className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                             S6
                           </th>
                           <th 
                             className="px-3 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                             onClick={() => handleSort('total')}
                           >
                             <div className="flex items-center justify-center space-x-1">
                               <span>Total</span>
                               {getSortIcon('total')}
                             </div>
                           </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                                                 {sortResults(matchData.results).map((result, index) => (
                           <tr key={result.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                             <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                               {result.place}
                             </td>
                             <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                               {result.name}
                             </td>
                             <td className="hidden sm:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {result.club}
                             </td>
                             <td className="hidden md:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {result.division}
                             </td>
                             <td className="hidden lg:table-cell px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                               {result.veteran ? (
                                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                   Veteran
                                 </span>
                               ) : (
                                 <span className="text-gray-400">-</span>
                               )}
                             </td>
                             <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center ${getScoreClass(result, result.series1)}`}>
                               {result.series1}
                             </td>
                             <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center ${getScoreClass(result, result.series2)}`}>
                               {result.series2}
                             </td>
                             <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center ${getScoreClass(result, result.series3)}`}>
                               {result.series3}
                             </td>
                             <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center ${getScoreClass(result, result.series4)}`}>
                               {result.series4}
                             </td>
                             <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center ${getScoreClass(result, result.series5)}`}>
                               {result.series5}
                             </td>
                             <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center ${getScoreClass(result, result.series6)}`}>
                               {result.series6}
                             </td>
                             <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-center ${getTotalClass(result)}`}>
                               {result.total}
                             </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <div className="flex flex-wrap items-center space-x-6 text-xs text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>Match Best</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                        <span>Personal Best</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 