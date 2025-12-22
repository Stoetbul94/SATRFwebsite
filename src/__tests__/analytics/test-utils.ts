// Test utilities for Analytics Dashboard
export const createMockAnalytics = (overrides = {}) => {
  const baseData = {
    scoreHistory: [
      {
        date: '2024-01-15',
        score: 95,
        xCount: 8,
        eventName: 'SATRF Championship',
        discipline: '3P',
        position: 3,
        totalParticipants: 25
      },
      {
        date: '2024-02-10',
        score: 92,
        xCount: 6,
        eventName: 'Club Competition',
        discipline: 'Prone',
        position: 5,
        totalParticipants: 15
      },
      {
        date: '2024-03-05',
        score: 98,
        xCount: 12,
        eventName: 'Regional Match',
        discipline: '3P',
        position: 1,
        totalParticipants: 30
      },
      {
        date: '2024-04-12',
        score: 96,
        xCount: 10,
        eventName: 'National Qualifier',
        discipline: 'Prone',
        position: 2,
        totalParticipants: 40
      }
    ],
    disciplineStats: [
      {
        discipline: '3P',
        totalMatches: 8,
        averageScore: 91.5,
        personalBest: 98,
        totalXCount: 45,
        averageXCount: 5.6,
        bestScoreDate: '2024-03-05',
        bestScoreEvent: 'Regional Match'
      },
      {
        discipline: 'Prone',
        totalMatches: 6,
        averageScore: 93.2,
        personalBest: 96,
        totalXCount: 38,
        averageXCount: 6.3,
        bestScoreDate: '2024-04-12',
        bestScoreEvent: 'National Qualifier'
      },
      {
        discipline: 'Air Rifle',
        totalMatches: 4,
        averageScore: 89.8,
        personalBest: 94,
        totalXCount: 22,
        averageXCount: 5.5,
        bestScoreDate: '2024-02-20',
        bestScoreEvent: 'Air Rifle Championship'
      }
    ],
    performanceTrends: [
      { period: 'week', averageScore: 92.5, totalMatches: 2, totalXCount: 12, improvement: 2.1 },
      { period: 'month', averageScore: 91.8, totalMatches: 8, totalXCount: 45, improvement: 1.5 },
      { period: 'quarter', averageScore: 90.2, totalMatches: 18, totalXCount: 105, improvement: 3.2 }
    ],
    eventParticipation: [
      {
        eventId: '1',
        eventName: 'SATRF Championship',
        date: '2024-01-15',
        location: 'Johannesburg',
        discipline: '3P',
        status: 'completed',
        score: 95,
        xCount: 8,
        position: 3,
        totalParticipants: 25
      },
      {
        eventId: '2',
        eventName: 'Club Competition',
        date: '2024-02-10',
        location: 'Cape Town',
        discipline: 'Prone',
        status: 'completed',
        score: 92,
        xCount: 6,
        position: 5,
        totalParticipants: 15
      }
    ],
    summary: {
      totalMatches: 18,
      totalScore: 1647,
      averageScore: 91.5,
      personalBest: 98,
      totalXCount: 105,
      averageXCount: 5.8,
      improvementRate: 3.2,
      consistencyScore: 85.4
    }
  };
  return { ...baseData, ...overrides };
};

export const createMockAPI = (overrides = {}) => ({
  getUserAnalytics: jest.fn().mockResolvedValue(createMockAnalytics()),
  exportAnalytics: jest.fn().mockResolvedValue(new Blob(['test'], { type: 'text/csv' })),
  getScoreHistory: jest.fn().mockResolvedValue(createMockAnalytics().scoreHistory),
  getDisciplineStats: jest.fn().mockResolvedValue(createMockAnalytics().disciplineStats),
  getPerformanceTrends: jest.fn().mockResolvedValue(createMockAnalytics().performanceTrends),
  getEventParticipation: jest.fn().mockResolvedValue(createMockAnalytics().eventParticipation),
  ...overrides
});

export const createMockUtils = (overrides = {}) => ({
  generateMockAnalytics: jest.fn().mockReturnValue(createMockAnalytics()),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
  getDisciplineColor: jest.fn(() => '#3B82F6'),
  getPerformanceLevel: jest.fn(() => ({ level: 'Good', color: '#F59E0B' })),
  calculateImprovementRate: jest.fn(() => 3.2),
  calculateConsistencyScore: jest.fn(() => 85.4),
  ...overrides
});

export const setupBrowserMocks = () => {
  const mockCreateObjectURL = jest.fn().mockReturnValue('blob:test');
  const mockRevokeObjectURL = jest.fn();
  const mockLink = {
    href: '',
    download: '',
    click: jest.fn(),
  };
  
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  global.document.createElement = jest.fn().mockReturnValue(mockLink);
  
  return { mockCreateObjectURL, mockRevokeObjectURL, mockLink };
};

export const createTestUser = () => ({
  id: 'test-user-123',
  email: 'test@satrf.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'shooter',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z'
});

export const createTestFilters = () => ({
  dateRange: 'last-month',
  discipline: 'all',
  eventType: 'all',
  minScore: 0,
  maxScore: 100
});

// Helper function to simulate API delays
export const simulateApiDelay = (ms = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create large datasets for performance testing
export const createLargeDataset = (size = 1000) => {
  const baseData = createMockAnalytics();
  return {
    ...baseData,
    scoreHistory: Array.from({ length: size }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      score: 85 + Math.floor(Math.random() * 15),
      xCount: Math.floor(Math.random() * 15),
      eventName: `Event ${i + 1}`,
      discipline: ['3P', 'Prone', 'Air Rifle'][i % 3],
      position: Math.floor(Math.random() * 20) + 1,
      totalParticipants: 20 + Math.floor(Math.random() * 30)
    }))
  };
};

// Helper function to create malformed data for edge case testing
export const createMalformedData = () => {
  const baseData = createMockAnalytics();
  return {
    ...baseData,
    scoreHistory: [
      { date: 'invalid-date', score: 'not-a-number', xCount: null },
      ...baseData.scoreHistory
    ]
  };
};

// Helper function to simulate different error types
export const createErrorResponse = (type: 'network' | 'auth' | 'server' | 'validation') => {
  switch (type) {
    case 'network':
      return new Error('Network error');
    case 'auth':
      return { response: { status: 401, data: { message: 'Unauthorized' } } };
    case 'server':
      return { response: { status: 500, data: { message: 'Internal server error' } } };
    case 'validation':
      return { response: { status: 400, data: { message: 'Invalid request' } } };
    default:
      return new Error('Unknown error');
  }
}; 