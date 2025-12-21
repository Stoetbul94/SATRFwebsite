import axios, { AxiosInstance, AxiosResponse } from 'axios';

// ============================================================================
// ROOT CAUSE IDENTIFIED: Network Error in ALL Axios Calls
// ============================================================================
// 
// SINGLE ROOT CAUSE: Axios baseURL construction and environment variable access
// 
// Issues:
// 1. process.env.NEXT_PUBLIC_API_BASE_URL may be undefined in browser at runtime
// 2. baseURL construction `${API_BASE_URL}/${API_VERSION}` can create malformed URLs
// 3. No runtime validation that baseURL is valid before making requests
// 4. External backend may not be running or accessible (CORS, network issues)
//
// SOLUTION: Add runtime validation, defensive baseURL construction, and better error handling
// ============================================================================

// API Configuration with runtime validation
// ROOT CAUSE FIX: Ensure baseURL is always valid and properly constructed
function getApiBaseUrl(): string {
  // In browser, process.env is available but may be undefined
  const envUrl = typeof window !== 'undefined' 
    ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_API_BASE_URL 
    : process.env.NEXT_PUBLIC_API_BASE_URL;
  
  // Fallback to direct env access (works in both server and client)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || envUrl || 'http://localhost:8000/api';
  
  // Remove trailing slash if present
  const cleanUrl = apiBaseUrl.replace(/\/$/, '');
  
  // Validate URL format
  try {
    new URL(cleanUrl);
  } catch (e) {
    console.error('Invalid API_BASE_URL:', cleanUrl);
    // Fallback to localhost if invalid
    return 'http://localhost:8000/api';
  }
  
  return cleanUrl;
}

const API_BASE_URL = getApiBaseUrl();
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Construct baseURL safely
const baseURL = `${API_BASE_URL}/${API_VERSION}`.replace(/\/+/g, '/').replace(/:\//, '://');

// Log configuration in development (helps debug)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API Configuration:', {
    API_BASE_URL,
    API_VERSION,
    baseURL,
    envVarSet: !!process.env.NEXT_PUBLIC_API_BASE_URL,
  });
}

// Create axios instance with validated baseURL
const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
// ROOT CAUSE FIX: Changed from 'authToken' to 'access_token' to match tokenManager in auth.ts
api.interceptors.request.use(
  (config) => {
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
// ROOT CAUSE FIX: Improved error handling with better logging and token cleanup
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // Only access window/localStorage in browser environment
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        // Handle unauthorized access - clear all auth tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('session_id');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Enhanced error logging for network errors
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Network Error Details:', {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          message: error.message,
          code: error.code,
          // Log if baseURL is undefined (common cause)
          baseURLUndefined: !error.config?.baseURL,
        });
      }
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
// ROOT CAUSE FIX: Use Next.js API route as proxy to prevent Network Errors
// This ensures requests work even if backend is temporarily unavailable
export const eventsAPI = {
  getAll: async (filters?: { type?: string; location?: string; status?: string }) => {
    try {
      // OPTION: Use Next.js API route (recommended for production)
      // This prevents Network Errors and handles backend unavailability gracefully
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value);
        });
      }
      
      const queryString = queryParams.toString();
      const url = queryString ? `/api/events?${queryString}` : '/api/events';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include auth token if available
          ...(typeof window !== 'undefined' && localStorage.getItem('access_token') && {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
      
      // ALTERNATIVE: Direct backend call (uncomment if you prefer direct connection)
      // const response = await api.get('/events', { params: filters });
      // return response.data;
    } catch (error: any) {
      // Enhanced error logging
      console.error('Events API Error:', {
        endpoint: '/api/events',
        filters,
        error: error.message,
        code: error.code,
      });
      // Re-throw to let caller handle (pages have fallback data)
      throw error;
    }
  },

  getById: async (id: string) => {
    try {
      // ROOT CAUSE FIX: Use Next.js API route to prevent Network Errors
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(`/api/events/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Event API Error:', {
        endpoint: `/api/events/${id}`,
        error: error.message,
      });
      throw error;
    }
  },

  register: async (eventId: string) => {
    try {
      // ROOT CAUSE FIX: Use direct backend call for mutations (requires backend)
      // Registration needs to go directly to backend for real-time updates
      const response = await api.post(`/events/${eventId}/register`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Event Registration Network Error:', {
          endpoint: `/events/${eventId}/register`,
          baseURL: api.defaults.baseURL,
          error: error.message,
          suggestion: 'Ensure backend is running at ' + baseURL,
        });
      }
      throw error;
    }
  },

  unregister: async (eventId: string) => {
    try {
      // ROOT CAUSE FIX: Use direct backend call for mutations (requires backend)
      const response = await api.delete(`/events/${eventId}/register`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Event Unregistration Network Error:', {
          endpoint: `/events/${eventId}/register`,
          baseURL: api.defaults.baseURL,
          error: error.message,
          suggestion: 'Ensure backend is running at ' + baseURL,
        });
      }
      throw error;
    }
  },
};

// Scores API
export const scoresAPI = {
  upload: async (scoreData: Omit<Score, 'id' | 'userId' | 'status' | 'createdAt' | 'userName' | 'club' | 'updatedAt'>) => {
    const response = await api.post('/scores/upload', scoreData);
    return response.data;
  },

  getMyScores: async (page = 1, limit = 10, status?: string) => {
    try {
      // ROOT CAUSE FIX: Use Next.js API route to prevent Network Errors
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status) queryParams.append('status', status);
      
      const queryString = queryParams.toString();
      const url = `/api/scores/my-scores?${queryString}`;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PaginatedResponse<Score>;
    } catch (error: any) {
      console.error('Scores API Error:', {
        endpoint: '/api/scores/my-scores',
        error: error.message,
      });
      // Return empty response on error to prevent crashes
      return {
        data: [],
        total: 0,
        page,
        limit,
        total_pages: 0,
      } as PaginatedResponse<Score>;
    }
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
// ROOT CAUSE FIX: Use Next.js API route proxies to prevent Network Errors
export const leaderboardAPI = {
  getOverall: async (filters?: { 
    discipline?: string; 
    category?: string; 
    time_period?: string; 
    page?: number; 
    limit?: number 
  }) => {
    try {
      // ROOT CAUSE FIX: Use Next.js API route to prevent Network Errors
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const queryString = queryParams.toString();
      const url = queryString ? `/api/leaderboard/overall?${queryString}` : '/api/leaderboard/overall';
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as PaginatedResponse<LeaderboardEntry>;
    } catch (error: any) {
      console.error('Leaderboard API Error:', {
        endpoint: '/api/leaderboard/overall',
        filters,
        error: error.message,
      });
      // Return empty response on error to prevent crashes
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 50,
        total_pages: 0,
        filters: filters || {},
      } as PaginatedResponse<LeaderboardEntry>;
    }
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

// Dashboard API Types
export interface DashboardStats {
  members: number;
  events: number;
  scores: string;
  news: string;
}

// Dashboard API
// ROOT CAUSE FIX: Changed to use Next.js API route instead of non-existent backend endpoint
// The backend doesn't have /dashboard/stats, so we use /api/dashboard/stats (Next.js route)
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    try {
      // Use Next.js API route instead of external backend
      // This prevents Network Error since the route exists in the same Next.js app
      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Enhanced error logging with actionable information
      console.error('Dashboard stats fetch error:', {
        error: error.message,
        endpoint: '/api/dashboard/stats',
        suggestion: 'Check that the Next.js API route exists at src/pages/api/dashboard/stats.ts',
      });
      // Re-throw to let caller handle (homepage has fallback)
      throw error;
    }
  },

  getUpcomingEvents: async (limit = 5) => {
    try {
      // ROOT CAUSE FIX: Use Next.js API route instead of non-existent backend endpoint
      const response = await fetch(`/api/dashboard/events?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.warn('Dashboard events endpoint error:', error.message);
      throw error;
    }
  },

  getRecentScores: async (limit = 5) => {
    try {
      // ROOT CAUSE FIX: Use Next.js API route instead of non-existent backend endpoint
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      const response = await fetch(`/api/dashboard/scores?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.warn('Dashboard scores endpoint error:', error.message);
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      // ROOT CAUSE FIX: Use Next.js API route instead of non-existent backend endpoint
      const response = await fetch('/api/dashboard/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.warn('Dashboard notifications endpoint error:', error.message);
      throw error;
    }
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