import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: 'junior' | 'senior' | 'veteran';
  club: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  status: 'open' | 'full' | 'closed';
  description?: string;
  maxParticipants?: number;
  currentParticipants?: number;
}

export interface Score {
  id: string;
  userId: string;
  eventId: string;
  discipline: string;
  score: number;
  xCount?: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  userName?: string;
  club?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  club: string;
  category: string;
  bestScore: number;
  averageScore: number;
  totalScore: number;
  totalXCount: number;
  eventCount: number;
  memberCount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  filters?: Record<string, any>;
}

// Auth API
export const authAPI = {
  register: async (userData: Omit<User, 'id' | 'createdAt'> & { password: string }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Events API
export const eventsAPI = {
  getAll: async (filters?: { type?: string; location?: string; status?: string }) => {
    const response = await api.get('/events', { params: filters });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  register: async (eventId: string) => {
    const response = await api.post(`/events/${eventId}/register`);
    return response.data;
  },

  unregister: async (eventId: string) => {
    const response = await api.delete(`/events/${eventId}/register`);
    return response.data;
  },
};

// Scores API
export const scoresAPI = {
  upload: async (scoreData: Omit<Score, 'id' | 'userId' | 'status' | 'createdAt' | 'userName' | 'club' | 'updatedAt'>) => {
    const response = await api.post('/scores/upload', scoreData);
    return response.data;
  },

  getMyScores: async (page = 1, limit = 10, status?: string) => {
    const response = await api.get('/scores/my-scores', { params: { page, limit, status } });
    return response.data as PaginatedResponse<Score>;
  },

  getEventScores: async (eventId: string, page = 1, limit = 50, discipline?: string) => {
    const response = await api.get(`/scores/event/${eventId}`, { params: { page, limit, discipline } });
    return response.data as PaginatedResponse<Score>;
  },

  update: async (id: string, updates: Partial<Score>) => {
    const response = await api.put(`/scores/${id}`, updates);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/scores/${id}`);
    return response.data;
  },

  approve: async (id: string) => {
    const response = await api.put(`/scores/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason: string) => {
    const response = await api.put(`/scores/${id}/reject`, { reason });
    return response.data;
  },
};

// Leaderboard API
export const leaderboardAPI = {
  getOverall: async (filters?: { 
    discipline?: string; 
    category?: string; 
    time_period?: string; 
    page?: number; 
    limit?: number 
  }) => {
    const response = await api.get('/leaderboard/overall', { params: filters });
    return response.data as PaginatedResponse<LeaderboardEntry>;
  },

  getEventLeaderboard: async (eventId: string, filters?: { 
    discipline?: string; 
    page?: number; 
    limit?: number 
  }) => {
    const response = await api.get(`/leaderboard/event/${eventId}`, { params: filters });
    return response.data as PaginatedResponse<LeaderboardEntry>;
  },

  getClubLeaderboard: async (filters?: { 
    time_period?: string; 
    page?: number; 
    limit?: number 
  }) => {
    const response = await api.get('/leaderboard/club', { params: filters });
    return response.data as PaginatedResponse<LeaderboardEntry>;
  },

  getStatistics: async () => {
    const response = await api.get('/leaderboard/statistics');
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getUpcomingEvents: async (limit = 5) => {
    const response = await api.get('/dashboard/events', { params: { limit } });
    return response.data;
  },

  getRecentScores: async (limit = 5) => {
    const response = await api.get('/dashboard/scores', { params: { limit } });
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/dashboard/notifications');
    return response.data;
  },
};

// Results API
export const resultsAPI = {
  getResults: async (filters?: { event?: string; match?: string }) => {
    const params = new URLSearchParams();
    if (filters?.event && filters.event !== 'all') {
      params.append('event', filters.event);
    }
    if (filters?.match && filters.match !== 'all') {
      params.append('match', filters.match);
    }
    
    const response = await api.get(`/results?${params.toString()}`);
    return response.data;
  },
};

export default api; 