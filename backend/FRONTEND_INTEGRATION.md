# Frontend Integration Guide

## Overview

This guide provides comprehensive information for integrating the SATRF frontend with the FastAPI backend. The backend provides RESTful API endpoints with JWT authentication, role-based access control, and comprehensive error handling.

## API Base Configuration

### Base URL
```
Development: http://localhost:8000/api/v1
Production: https://api.satrf.org/api/v1
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user | Yes |

### Events Endpoints

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/events` | Create event | Yes | Admin |
| GET | `/events` | Get all events | Yes | Any |
| GET | `/events/{id}` | Get specific event | Yes | Any |
| PUT | `/events/{id}` | Update event | Yes | Admin |
| DELETE | `/events/{id}` | Delete event | Yes | Admin |
| POST | `/events/{id}/register` | Register for event | Yes | Any |
| DELETE | `/events/{id}/register` | Unregister from event | Yes | Any |

## Frontend Integration Examples

### 1. API Service Setup

```typescript
// src/lib/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
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

export default api;
```

### 2. Authentication Service

```typescript
// src/services/authService.ts
import api from '@/lib/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  membershipType: 'junior' | 'senior' | 'veteran';
  club: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: string;
  club: string;
  role: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export const authService = {
  async register(data: RegisterRequest) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Helper method to store token
  setToken(token: string) {
    localStorage.setItem('authToken', token);
  },

  // Helper method to get token
  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  // Helper method to remove token
  removeToken() {
    localStorage.removeItem('authToken');
  },

  // Helper method to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};
```

### 3. Events Service

```typescript
// src/services/eventService.ts
import api from '@/lib/api';

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  type: string;
  maxParticipants?: number;
  currentParticipants: number;
  status: 'open' | 'full' | 'closed';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  date: string;
  location: string;
  type: string;
  maxParticipants?: number;
  status?: 'open' | 'full' | 'closed';
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  date?: string;
  location?: string;
  type?: string;
  maxParticipants?: number;
  status?: 'open' | 'full' | 'closed';
}

export interface EventsResponse {
  items: Event[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const eventService = {
  async createEvent(data: CreateEventRequest) {
    const response = await api.post('/events', data);
    return response.data;
  },

  async getEvents(params?: {
    page?: number;
    size?: number;
    type?: string;
    location?: string;
    status?: string;
  }): Promise<EventsResponse> {
    const response = await api.get('/events', { params });
    return response.data;
  },

  async getEvent(id: string): Promise<Event> {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  async updateEvent(id: string, data: UpdateEventRequest) {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  async deleteEvent(id: string) {
    const response = await api.delete(`/events/${id}`);
    return response.data;
  },

  async registerForEvent(id: string) {
    const response = await api.post(`/events/${id}/register`);
    return response.data;
  },

  async unregisterFromEvent(id: string) {
    const response = await api.delete(`/events/${id}/register`);
    return response.data;
  }
};
```

### 4. React Hook for Authentication

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect, createContext, useContext } from 'react';
import { authService, User } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      authService.setToken(response.access_token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      await authService.register(data);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.removeToken();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 5. React Hook for Events

```typescript
// src/hooks/useEvents.ts
import { useState, useEffect } from 'react';
import { eventService, Event, EventsResponse } from '@/services/eventService';

export function useEvents(params?: {
  page?: number;
  size?: number;
  type?: string;
  location?: string;
  status?: string;
}) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    size: 10,
    pages: 0,
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: EventsResponse = await eventService.getEvents(params);
      setEvents(response.items);
      setPagination({
        total: response.total,
        page: response.page,
        size: response.size,
        pages: response.pages,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [params?.page, params?.size, params?.type, params?.location, params?.status]);

  const registerForEvent = async (eventId: string) => {
    try {
      await eventService.registerForEvent(eventId);
      // Refresh events to update participant count
      await fetchEvents();
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to register for event');
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    try {
      await eventService.unregisterFromEvent(eventId);
      // Refresh events to update participant count
      await fetchEvents();
    } catch (err: any) {
      throw new Error(err.response?.data?.detail || 'Failed to unregister from event');
    }
  };

  return {
    events,
    loading,
    error,
    pagination,
    registerForEvent,
    unregisterFromEvent,
    refetch: fetchEvents,
  };
}
```

## Error Handling

### 1. API Error Types

```typescript
// src/types/api.ts
export interface APIError {
  detail: string | APIValidationError[];
  status_code?: number;
}

export interface APIValidationError {
  loc: string[];
  msg: string;
  type: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
```

### 2. Error Handling Utility

```typescript
// src/utils/errorHandler.ts
import { APIError, APIValidationError } from '@/types/api';

export function handleAPIError(error: any): string {
  if (error.response?.data) {
    const apiError: APIError = error.response.data;
    
    // Handle validation errors
    if (Array.isArray(apiError.detail)) {
      const validationErrors = apiError.detail as APIValidationError[];
      return validationErrors.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
    }
    
    // Handle single error message
    if (typeof apiError.detail === 'string') {
      return apiError.detail;
    }
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection.';
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }
  
  // Default error message
  return 'An unexpected error occurred. Please try again.';
}
```

### 3. Toast Notifications

```typescript
// src/utils/toast.ts
import toast from 'react-hot-toast';
import { handleAPIError } from './errorHandler';

export function showSuccess(message: string) {
  toast.success(message);
}

export function showError(error: any) {
  const errorMessage = handleAPIError(error);
  toast.error(errorMessage);
}

export function showLoading(message: string) {
  return toast.loading(message);
}
```

## Role-Based Access Control

### 1. Role Checking Utility

```typescript
// src/utils/roles.ts
export type UserRole = 'user' | 'admin' | 'event_scorer';

export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    'user': 1,
    'event_scorer': 2,
    'admin': 3,
  };
  
  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole];
}

export function requireRole(requiredRole: UserRole) {
  return function (Component: React.ComponentType<any>) {
    return function (props: any) {
      const { user } = useAuth();
      
      if (!user || !hasRole(user.role, requiredRole)) {
        return <div>Access denied. You don't have permission to view this page.</div>;
      }
      
      return <Component {...props} />;
    };
  };
}
```

### 2. Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/utils/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback = <div>Access denied</div> 
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please log in to access this page.</div>;
  }

  if (requiredRole && user && !hasRole(user.role, requiredRole)) {
    return fallback;
  }

  return <>{children}</>;
}
```

## Environment Configuration

### 1. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=SATRF
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. API Configuration

```typescript
// src/config/api.ts
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
};

export const ENDPOINTS = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  events: {
    list: '/events',
    create: '/events',
    detail: (id: string) => `/events/${id}`,
    update: (id: string) => `/events/${id}`,
    delete: (id: string) => `/events/${id}`,
    register: (id: string) => `/events/${id}/register`,
    unregister: (id: string) => `/events/${id}/register`,
  },
};
```

## Testing Integration

### 1. Mock API for Testing

```typescript
// src/__mocks__/api.ts
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/v1/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: 'mock-jwt-token',
        token_type: 'bearer',
        expires_in: 1800,
        user: {
          id: 'user_123',
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          membershipType: 'senior',
          club: 'Test Club',
          role: 'user',
          createdAt: '2024-01-15T10:30:00Z',
        },
      })
    );
  }),

  rest.get('/api/v1/events', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        items: [
          {
            id: 'event_123',
            title: 'Test Event',
            description: 'Test description',
            date: '2024-03-15T09:00:00Z',
            location: 'Test Location',
            type: 'Championship',
            maxParticipants: 50,
            currentParticipants: 25,
            status: 'open',
            createdAt: '2024-01-10T14:20:00Z',
          },
        ],
        total: 1,
        page: 1,
        size: 10,
        pages: 1,
      })
    );
  }),
];
```

### 2. Test Setup

```typescript
// src/setupTests.ts
import { server } from './__mocks__/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Best Practices

### 1. API Call Patterns

```typescript
// Good: Using try-catch with proper error handling
const handleSubmit = async (data: FormData) => {
  try {
    setLoading(true);
    const response = await api.post('/endpoint', data);
    showSuccess('Operation successful');
    return response.data;
  } catch (error) {
    showError(error);
    throw error;
  } finally {
    setLoading(false);
  }
};

// Good: Using custom hooks for data fetching
const { events, loading, error, refetch } = useEvents({ status: 'open' });
```

### 2. Token Management

```typescript
// Good: Centralized token management
const token = authService.getToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Good: Automatic token refresh (if implemented)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const newToken = await refreshToken();
        authService.setToken(newToken);
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        authService.removeToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 3. Loading States

```typescript
// Good: Consistent loading state management
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleAction = async () => {
  setLoading(true);
  setError(null);
  
  try {
    await apiCall();
  } catch (err) {
    setError(handleAPIError(err));
  } finally {
    setLoading(false);
  }
};
```

This integration guide provides everything needed to successfully integrate the frontend with the SATRF backend API, including proper error handling, authentication, and best practices for production use. 