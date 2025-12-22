import axios from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create axios instance for events
const eventsApi = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
eventsApi.interceptors.request.use(
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

// Response interceptor for handling errors and token refresh
eventsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const refreshResponse = await axios.post(`${API_BASE_URL}/${API_VERSION}/users/refresh`, {
            refresh_token: refreshToken
          });
          
          const { access_token } = refreshResponse.data;
          localStorage.setItem('access_token', access_token);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return eventsApi(originalRequest);
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

// Event Types - Updated to match backend models
export interface Event {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location: string;
  category: string;
  discipline: string;
  price: number;
  maxSpots: number;
  currentSpots: number;
  status: 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
  registrationDeadline: string;
  image?: string;
  requirements?: string[];
  schedule?: string[];
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  isLocal: boolean;
  source: 'SATRF' | 'ISSF';
  createdAt?: string;
  updatedAt?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'REGISTERED' | 'WAITLIST' | 'CANCELLED';
  registeredAt: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
}

export interface EventFilters {
  discipline?: string;
  category?: string;
  status?: string;
  source?: 'SATRF' | 'ISSF' | 'all';
  location?: string;
  startDate?: string;
  endDate?: string;
  showCompleted?: boolean;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Events API Functions - Updated to match backend endpoints
export const eventsAPI = {
  // Get all events with optional filters
  getEvents: async (filters?: EventFilters, page: number = 1, limit: number = 50): Promise<EventsResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            params.append(key, value.toString());
          }
        });
      }
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await eventsApi.get(`/events?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get a single event by ID
  getEvent: async (eventId: string): Promise<Event> => {
    try {
      const response = await eventsApi.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  // Register for an event
  registerForEvent: async (eventId: string): Promise<EventRegistration> => {
    try {
      const response = await eventsApi.post(`/events/${eventId}/register`);
      return response.data;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  },

  // Cancel event registration
  cancelRegistration: async (eventId: string): Promise<void> => {
    try {
      await eventsApi.delete(`/events/${eventId}/register`);
    } catch (error) {
      console.error('Error cancelling registration:', error);
      throw error;
    }
  },

  // Get user's event registrations
  getUserRegistrations: async (): Promise<EventRegistration[]> => {
    try {
      const response = await eventsApi.get('/events/registrations');
      return response.data;
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      throw error;
    }
  },

  // Get upcoming events (next 30 days)
  getUpcomingEvents: async (limit: number = 10): Promise<Event[]> => {
    try {
      const response = await eventsApi.get(`/events/upcoming?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  },

  // Get events by discipline
  getEventsByDiscipline: async (discipline: string): Promise<Event[]> => {
    try {
      const response = await eventsApi.get(`/events/discipline/${discipline}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching events by discipline:', error);
      throw error;
    }
  },

  // Get ISSF international events
  getISSFEvents: async (): Promise<Event[]> => {
    try {
      const response = await eventsApi.get('/events/issf');
      return response.data;
    } catch (error) {
      console.error('Error fetching ISSF events:', error);
      throw error;
    }
  },

  // Get SATRF local events
  getSATRFEvents: async (): Promise<Event[]> => {
    try {
      const response = await eventsApi.get('/events/satrf');
      return response.data;
    } catch (error) {
      console.error('Error fetching SATRF events:', error);
      throw error;
    }
  },

  // Search events
  searchEvents: async (query: string, filters?: EventFilters): Promise<Event[]> => {
    try {
      const params = new URLSearchParams({ q: query });
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            params.append(key, value.toString());
          }
        });
      }

      const response = await eventsApi.get(`/events/search?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },
};

// Mock data for development/testing - Updated to match backend structure
export const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'SATRF National Championship 2024',
    description: 'The premier target rifle shooting championship of the year. This three-day event features multiple disciplines and categories, bringing together the best shooters from across the country.',
    start: '2024-03-15T08:00:00Z',
    end: '2024-03-17T18:00:00Z',
    location: 'Johannesburg Shooting Range',
    category: 'Senior',
    discipline: 'Target Rifle',
    price: 500,
    maxSpots: 50,
    currentSpots: 35,
    status: 'OPEN',
    registrationDeadline: '2024-03-01T23:59:59Z',
    image: '/images/events/national-championship.jpg',
    requirements: ['Valid shooting license', 'Minimum 6 months experience', 'Own equipment'],
    schedule: [
      'Day 1: Registration and Practice (8:00 AM - 5:00 PM)',
      'Day 2: Qualification Rounds (7:00 AM - 6:00 PM)',
      'Day 3: Finals and Awards (8:00 AM - 4:00 PM)'
    ],
    contactInfo: {
      name: 'John Smith',
      email: 'john.smith@satrf.org.za',
      phone: '+27 11 123 4567'
    },
    isLocal: true,
    source: 'SATRF'
  },
  {
    id: '2',
    title: 'ISSF World Cup - Air Rifle',
    description: 'International Shooting Sport Federation World Cup event for Air Rifle discipline. Top international shooters will compete for world ranking points.',
    start: '2024-04-20T09:00:00Z',
    end: '2024-04-25T17:00:00Z',
    location: 'Munich, Germany',
    category: 'International',
    discipline: 'Air Rifle',
    price: 0, // Free to watch
    maxSpots: 200,
    currentSpots: 150,
    status: 'OPEN',
    registrationDeadline: '2024-04-15T23:59:59Z',
    image: '/images/events/issf-world-cup.jpg',
    requirements: ['Valid passport', 'ISSF membership'],
    schedule: [
      'Day 1-2: Training and Equipment Check',
      'Day 3-4: Qualification Rounds',
      'Day 5: Finals and Medal Ceremony'
    ],
    contactInfo: {
      name: 'ISSF Secretariat',
      email: 'info@issf-sports.org',
      phone: '+49 89 544 355 0'
    },
    isLocal: false,
    source: 'ISSF'
  },
  {
    id: '3',
    title: 'SATRF Junior Development Camp',
    description: 'A comprehensive training camp designed for junior shooters to develop their skills and prepare for competitive shooting.',
    start: '2024-05-10T08:00:00Z',
    end: '2024-05-12T16:00:00Z',
    location: 'Cape Town Shooting Club',
    category: 'Junior',
    discipline: '3P',
    price: 300,
    maxSpots: 30,
    currentSpots: 25,
    status: 'OPEN',
    registrationDeadline: '2024-05-01T23:59:59Z',
    image: '/images/events/junior-camp.jpg',
    requirements: ['Age 12-18', 'Basic shooting experience', 'Parental consent'],
    schedule: [
      'Day 1: Fundamentals and Safety',
      'Day 2: Advanced Techniques',
      'Day 3: Competition Practice'
    ],
    contactInfo: {
      name: 'Sarah Johnson',
      email: 'sarah.johnson@satrf.org.za',
      phone: '+27 21 987 6543'
    },
    isLocal: true,
    source: 'SATRF'
  },
  {
    id: '4',
    title: 'ISSF Olympic Qualifier - Prone',
    description: 'Critical Olympic qualification event for Prone shooting discipline. This event will determine Olympic team selections.',
    start: '2024-06-15T07:00:00Z',
    end: '2024-06-20T19:00:00Z',
    location: 'Rio de Janeiro, Brazil',
    category: 'International',
    discipline: 'Prone',
    price: 0,
    maxSpots: 100,
    currentSpots: 80,
    status: 'OPEN',
    registrationDeadline: '2024-06-10T23:59:59Z',
    image: '/images/events/olympic-qualifier.jpg',
    requirements: ['National team selection', 'ISSF qualification standards'],
    schedule: [
      'Day 1-2: Official Training',
      'Day 3-4: Qualification Rounds',
      'Day 5: Finals and Team Selection'
    ],
    contactInfo: {
      name: 'ISSF Olympic Committee',
      email: 'olympic@issf-sports.org',
      phone: '+55 21 2345 6789'
    },
    isLocal: false,
    source: 'ISSF'
  },
  {
    id: '5',
    title: 'SATRF Club Championship',
    description: 'Monthly club championship for SATRF members. Open to all skill levels with separate categories for different experience levels.',
    start: '2024-07-05T09:00:00Z',
    end: '2024-07-05T17:00:00Z',
    location: 'Pretoria Shooting Range',
    category: 'All Categories',
    discipline: 'Air Rifle',
    price: 150,
    maxSpots: 40,
    currentSpots: 28,
    status: 'OPEN',
    registrationDeadline: '2024-07-03T23:59:59Z',
    image: '/images/events/club-championship.jpg',
    requirements: ['SATRF membership', 'Valid shooting license'],
    schedule: [
      'Morning: Registration and Practice',
      'Afternoon: Competition Rounds',
      'Evening: Awards Ceremony'
    ],
    contactInfo: {
      name: 'Mike Wilson',
      email: 'mike.wilson@satrf.org.za',
      phone: '+27 12 345 6789'
    },
    isLocal: true,
    source: 'SATRF'
  }
];

// Utility functions - Updated to work with backend status values
export const eventUtils = {
  // Check if event registration is open
  isRegistrationOpen: (event: Event): boolean => {
    if (event.status === 'CANCELLED' || event.status === 'CLOSED') return false;
    if (new Date(event.registrationDeadline) < new Date()) return false;
    if (event.currentSpots >= event.maxSpots) return false;
    return true;
  },

  // Get registration status
  getRegistrationStatus: (event: Event): string => {
    if (event.status === 'CANCELLED') return 'cancelled';
    if (event.status === 'CLOSED') return 'closed';
    if (new Date(event.registrationDeadline) < new Date()) return 'closed';
    if (event.currentSpots >= event.maxSpots) return 'full';
    return 'open';
  },

  // Format event date
  formatEventDate: (startDate: string, endDate: string): string => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    
    return `${start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })} - ${end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  },

  // Get event color based on status and source
  getEventColor: (event: Event): string => {
    if (event.status === 'CANCELLED') return '#E53E3E'; // Red
    if (event.status === 'CLOSED') return '#718096'; // Gray
    if (event.source === 'ISSF') return '#3182CE'; // Blue for international
    return '#2C5282'; // SATRF navy for local events
  },

  // Filter events by various criteria
  filterEvents: (events: Event[], filters: EventFilters): Event[] => {
    return events.filter(event => {
      if (filters.discipline && event.discipline !== filters.discipline) return false;
      if (filters.category && event.category !== filters.category) return false;
      if (filters.status && event.status !== filters.status) return false;
      if (filters.source && filters.source !== 'all' && event.source !== filters.source) return false;
      if (filters.location && !event.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
      if (filters.startDate && new Date(event.start) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(event.end) > new Date(filters.endDate)) return false;
      if (filters.showCompleted === false && event.status === 'CLOSED') return false;
      return true;
    });
  },

  // Convert backend status to frontend display status
  getDisplayStatus: (status: string): string => {
    switch (status) {
      case 'OPEN': return 'upcoming';
      case 'FULL': return 'full';
      case 'CLOSED': return 'completed';
      case 'CANCELLED': return 'cancelled';
      default: return 'upcoming';
    }
  },

  // Convert frontend status to backend status
  getBackendStatus: (status: string): string => {
    switch (status) {
      case 'upcoming': return 'OPEN';
      case 'full': return 'FULL';
      case 'completed': return 'CLOSED';
      case 'cancelled': return 'CANCELLED';
      default: return 'OPEN';
    }
  }
};

export default eventsAPI; 