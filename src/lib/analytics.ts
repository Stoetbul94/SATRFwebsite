import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create axios instance for analytics
const analyticsApi: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
analyticsApi.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
analyticsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/${API_VERSION}/users/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return analyticsApi(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Analytics Types
export interface ScoreDataPoint {
  date: string;
  score: number;
  xCount: number;
  eventName: string;
  discipline: string;
  position?: number;
  totalParticipants?: number;
}

export interface DisciplineStats {
  discipline: string;
  totalMatches: number;
  averageScore: number;
  personalBest: number;
  totalXCount: number;
  averageXCount: number;
  bestScoreDate: string;
  bestScoreEvent: string;
}

export interface PerformanceTrend {
  period: string; // 'week', 'month', 'quarter', 'year'
  averageScore: number;
  totalMatches: number;
  totalXCount: number;
  improvement: number; // percentage change from previous period
}

export interface EventParticipation {
  eventId: string;
  eventName: string;
  date: string;
  location: string;
  discipline: string;
  status: 'completed' | 'registered' | 'cancelled';
  score?: number;
  xCount?: number;
  position?: number;
  totalParticipants?: number;
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  discipline?: string;
  period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  limit?: number;
}

export interface UserAnalytics {
  scoreHistory: ScoreDataPoint[];
  disciplineStats: DisciplineStats[];
  performanceTrends: PerformanceTrend[];
  eventParticipation: EventParticipation[];
  summary: {
    totalMatches: number;
    totalScore: number;
    averageScore: number;
    personalBest: number;
    totalXCount: number;
    averageXCount: number;
    improvementRate: number;
    consistencyScore: number;
  };
}

// Analytics API Functions
export const analyticsAPI = {
  // Get comprehensive user analytics
  getUserAnalytics: async (filters?: AnalyticsFilters): Promise<UserAnalytics> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.dateRange) {
          params.append('start_date', filters.dateRange.start);
          params.append('end_date', filters.dateRange.end);
        }
        if (filters.discipline) {
          params.append('discipline', filters.discipline);
        }
        if (filters.period) {
          params.append('period', filters.period);
        }
        if (filters.limit) {
          params.append('limit', filters.limit.toString());
        }
      }

      const response = await analyticsApi.get(`/users/dashboard/analytics?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      throw error;
    }
  },

  // Get score history with optional filters
  getScoreHistory: async (filters?: AnalyticsFilters): Promise<ScoreDataPoint[]> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.dateRange) {
          params.append('start_date', filters.dateRange.start);
          params.append('end_date', filters.dateRange.end);
        }
        if (filters.discipline) {
          params.append('discipline', filters.discipline);
        }
        if (filters.limit) {
          params.append('limit', filters.limit.toString());
        }
      }

      const response = await analyticsApi.get(`/users/dashboard/scores?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching score history:', error);
      throw error;
    }
  },

  // Get discipline-specific statistics
  getDisciplineStats: async (discipline?: string): Promise<DisciplineStats[]> => {
    try {
      const params = new URLSearchParams();
      if (discipline) {
        params.append('discipline', discipline);
      }

      const response = await analyticsApi.get(`/users/dashboard/disciplines?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching discipline stats:', error);
      throw error;
    }
  },

  // Get performance trends over time
  getPerformanceTrends: async (period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<PerformanceTrend[]> => {
    try {
      const response = await analyticsApi.get(`/users/dashboard/trends?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      throw error;
    }
  },

  // Get event participation history
  getEventParticipation: async (filters?: AnalyticsFilters): Promise<EventParticipation[]> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.dateRange) {
          params.append('start_date', filters.dateRange.start);
          params.append('end_date', filters.dateRange.end);
        }
        if (filters.discipline) {
          params.append('discipline', filters.discipline);
        }
        if (filters.limit) {
          params.append('limit', filters.limit.toString());
        }
      }

      const response = await analyticsApi.get(`/users/dashboard/events?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event participation:', error);
      throw error;
    }
  },

  // Export analytics data
  exportAnalytics: async (format: 'csv' | 'json' | 'pdf' = 'csv', filters?: AnalyticsFilters): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      
      if (filters) {
        if (filters.dateRange) {
          params.append('start_date', filters.dateRange.start);
          params.append('end_date', filters.dateRange.end);
        }
        if (filters.discipline) {
          params.append('discipline', filters.discipline);
        }
        if (filters.period) {
          params.append('period', filters.period);
        }
      }

      const response = await analyticsApi.get(`/users/dashboard/export?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }
};

// Analytics utility functions
export const analyticsUtils = {
  // Calculate improvement rate
  calculateImprovementRate: (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  },

  // Calculate consistency score (standard deviation of scores)
  calculateConsistencyScore: (scores: number[]): number => {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Convert to a 0-100 scale where lower is more consistent
    return Math.max(0, 100 - (standardDeviation * 2));
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Get color for discipline
  getDisciplineColor: (discipline: string): string => {
    const colors: { [key: string]: string } = {
      '3P': '#3B82F6', // Blue
      'Prone': '#10B981', // Green
      'Air Rifle': '#F59E0B', // Yellow
      'Air Pistol': '#EF4444', // Red
      'Target Rifle': '#8B5CF6', // Purple
      'default': '#6B7280' // Gray
    };
    return colors[discipline] || colors.default;
  },

  // Get performance level based on score
  getPerformanceLevel: (score: number): { level: string; color: string } => {
    if (score >= 95) return { level: 'Excellent', color: '#10B981' };
    if (score >= 90) return { level: 'Very Good', color: '#3B82F6' };
    if (score >= 85) return { level: 'Good', color: '#F59E0B' };
    if (score >= 80) return { level: 'Average', color: '#F97316' };
    return { level: 'Below Average', color: '#EF4444' };
  },

  // Generate mock data for development/testing
  generateMockAnalytics: (): UserAnalytics => {
    const mockScores: ScoreDataPoint[] = [
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
        xCount: 10,
        eventName: 'Regional Match',
        discipline: 'Air Rifle',
        position: 1,
        totalParticipants: 30
      },
      {
        date: '2024-03-20',
        score: 89,
        xCount: 4,
        eventName: 'Training Session',
        discipline: '3P',
        position: 8,
        totalParticipants: 12
      },
      {
        date: '2024-04-12',
        score: 94,
        xCount: 7,
        eventName: 'National Qualifier',
        discipline: 'Prone',
        position: 2,
        totalParticipants: 40
      }
    ];

    const mockDisciplineStats: DisciplineStats[] = [
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
        bestScoreDate: '2024-02-15',
        bestScoreEvent: 'Air Rifle Championship'
      }
    ];

    const mockTrends: PerformanceTrend[] = [
      { period: 'week', averageScore: 92.5, totalMatches: 2, totalXCount: 12, improvement: 2.1 },
      { period: 'month', averageScore: 91.8, totalMatches: 8, totalXCount: 45, improvement: 1.5 },
      { period: 'quarter', averageScore: 90.2, totalMatches: 24, totalXCount: 128, improvement: 3.2 },
      { period: 'year', averageScore: 88.7, totalMatches: 96, totalXCount: 512, improvement: 5.8 }
    ];

    const mockParticipation: EventParticipation[] = [
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
      },
      {
        eventId: '3',
        eventName: 'Regional Match',
        date: '2024-03-05',
        location: 'Durban',
        discipline: 'Air Rifle',
        status: 'completed',
        score: 98,
        xCount: 10,
        position: 1,
        totalParticipants: 30
      }
    ];

    return {
      scoreHistory: mockScores,
      disciplineStats: mockDisciplineStats,
      performanceTrends: mockTrends,
      eventParticipation: mockParticipation,
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
  }
};

export default analyticsAPI; 