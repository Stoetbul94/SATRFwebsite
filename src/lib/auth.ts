import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create axios instance for auth
const authApi: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
authApi.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('session_id') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
authApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (refreshToken) {
          const response = await authApi.post('/users/refresh', {
            refresh_token: refreshToken
          });
          
          const { access_token, refresh_token } = response.data;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
          }
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return authApi(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('session_id');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth Types
export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  membershipType: 'junior' | 'senior' | 'veteran';
  club: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  membershipType: 'junior' | 'senior' | 'veteran';
  club: string;
  role: 'user' | 'admin' | 'event_scorer';
  profileImageUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  isActive: boolean;
  emailConfirmed: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  loginCount: number;
}

export interface UserProfileUpdate {
  firstName?: string;
  lastName?: string;
  membershipType?: 'junior' | 'senior' | 'veteran';
  club?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface UserScoreSummary {
  totalMatches: number;
  totalScore: number;
  averageScore: number;
  personalBest: number;
  personalBestEvent?: string;
  personalBestDate?: string;
  totalXCount: number;
  averageXCount: number;
  disciplines: string[];
  recentScores: any[];
}

export interface UserDashboardData {
  profile: UserProfile;
  scoreSummary: UserScoreSummary;
  recentEvents: any[];
  upcomingEvents: any[];
  notifications: any[];
}

export interface UserActivityLog {
  id: string;
  user_id: string;
  action: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserProfile;
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    session_id: string;
  };
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface EmailConfirmationRequest {
  token: string;
}

// Token management utilities
export const tokenManager = {
  setTokens: (accessToken: string, refreshToken: string, sessionId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('session_id', sessionId);
    }
  },

  getAccessToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  getRefreshToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  },

  getSessionId: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('session_id');
    }
    return null;
  },

  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('session_id');
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  },

  getTokenExpiration: (): Date | null => {
    const token = tokenManager.getAccessToken();
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  },

  isTokenExpired: (): boolean => {
    const expiration = tokenManager.getTokenExpiration();
    if (!expiration) return true;
    return expiration < new Date();
  }
};

// Password validation utilities
export const passwordValidator = {
  validatePassword: (password: string): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      warnings.push('Consider adding special characters for better security');
    }

    if (password.length < 12) {
      warnings.push('Consider using a longer password (12+ characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  },

  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePasswordMatch: (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword;
  }
};

// Auth API functions
export const authAPI = {
  // User registration - Use Next.js API route to prevent Network Errors
  register: async (userData: UserRegistrationData): Promise<AuthResponse> => {
    // ROOT CAUSE FIX: Use Next.js API route to prevent Network Errors
    if (typeof window === 'undefined') {
      // Server-side: use direct backend call
      const response = await authApi.post('/users/register', userData);
      return response.data;
    }

    // Client-side: use Next.js API route proxy
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      // Re-throw with proper format
      throw {
        response: {
          data: {
            detail: error.message || 'Registration failed'
          }
        }
      };
    }
  },

  // User login
  login: async (loginData: UserLoginData): Promise<LoginResponse> => {
    const response = await authApi.post('/users/login', loginData);
    return response.data;
  },

  // Token refresh
  refreshToken: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await authApi.post('/users/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  // User logout
  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authApi.post('/users/logout');
      return response.data;
    } catch (error) {
      // Even if logout fails, clear local tokens
      tokenManager.clearTokens();
      return { success: true, message: 'Logged out successfully' };
    }
  },

  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await authApi.get('/users/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData: UserProfileUpdate): Promise<UserProfile> => {
    const response = await authApi.put('/users/profile', profileData);
    return response.data;
  },

  // Get user dashboard
  getDashboard: async (): Promise<UserDashboardData> => {
    const response = await authApi.get('/users/dashboard');
    return response.data;
  },

  // Change password
  changePassword: async (passwordData: PasswordChangeData): Promise<{ success: boolean; message: string }> => {
    const response = await authApi.post('/users/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await authApi.post('/users/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (resetData: PasswordResetConfirm): Promise<{ success: boolean; message: string }> => {
    const response = await authApi.post('/users/reset-password', resetData);
    return response.data;
  },

  // Confirm email
  confirmEmail: async (token: string): Promise<{ success: boolean; message: string }> => {
    const response = await authApi.post('/users/confirm-email', { token });
    return response.data;
  },

  // Get user activity
  getActivity: async (limit: number = 50): Promise<UserActivityLog[]> => {
    const response = await authApi.get(`/users/activity?limit=${limit}`);
    return response.data;
  }
};

// Auth flow utilities
export const authFlow = {
  // Complete login flow
  login: async (email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      // Check for demo credentials first
      if (email === 'demo@satrf.org.za' && password === 'DemoPass123') {
        // Mock demo user - TEMPORARILY SET AS ADMIN FOR TESTING
        // TODO: Change back to 'user' role after testing
        const demoUser: UserProfile = {
          id: 'demo-user-123',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@satrf.org.za',
          membershipType: 'senior',
          club: 'SATRF Demo Club',
          role: 'admin', // TEMPORARY: Set to admin for testing admin pages
          isActive: true,
          emailConfirmed: true,
          createdAt: new Date().toISOString(),
          loginCount: 1,
          lastLoginAt: new Date().toISOString(),
        };

        // Store mock tokens
        tokenManager.setTokens(
          'demo-access-token',
          'demo-refresh-token',
          demoUser.id
        );

        return { success: true, user: demoUser };
      }

      // For real credentials, try API call
      const response = await authAPI.login({ email, password });
      
      // Store tokens
      tokenManager.setTokens(
        response.access_token,
        response.refresh_token,
        response.user.id // Using user ID as session ID for simplicity
      );
      
      return { success: true, user: response.user };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed. Please check your credentials.'
      };
    }
  },

  // Complete registration flow - Firebase Auth + Firestore
  register: async (userData: UserRegistrationData): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    // Use Firebase Auth for registration in production
    if (typeof window === 'undefined') {
      // Server-side: fallback to API (for SSR compatibility)
      try {
        const response = await authAPI.register(userData);
        if (response.success && response.data) {
          tokenManager.setTokens(
            response.data.access_token,
            response.data.refresh_token,
            response.data.session_id
          );
          return { success: true, user: response.data.user };
        }
        return { success: false, error: response.message };
      } catch (error: any) {
        return {
          success: false,
          error: error.response?.data?.detail || 'Registration failed. Please try again.'
        };
      }
    }

    // Client-side: Use Firebase Auth + Firestore
    try {
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { auth, db } = await import('@/lib/firebase');

      // Step 1: Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email.toLowerCase().trim(),
        userData.password
      );
      
      const firebaseUser = userCredential.user;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Firebase Auth user created:', firebaseUser.uid);
      }

      // Step 2: Create user profile in Firestore
      const userProfile: UserProfile = {
        id: firebaseUser.uid,
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.toLowerCase().trim(),
        membershipType: userData.membershipType,
        club: userData.club.trim(),
        role: 'user',
        isActive: true,
        emailConfirmed: false,
        createdAt: new Date().toISOString(),
        loginCount: 0,
      };

      // Create user document in Firestore 'users' collection
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, {
        ...userProfile,
        // Store additional metadata
        updatedAt: new Date().toISOString(),
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('Firestore user document created:', firebaseUser.uid);
      }

      // Step 3: Verify document was created
      const createdDoc = await getDoc(userDocRef);
      if (!createdDoc.exists()) {
        throw new Error('Failed to create user profile in database');
      }

      // Step 4: Store Firebase ID token for session management
      const idToken = await firebaseUser.getIdToken();
      tokenManager.setTokens(
        idToken,
        idToken, // Using same token for refresh (Firebase handles refresh internally)
        firebaseUser.uid
      );

      return { success: true, user: userProfile };
    } catch (error: any) {
      // Enhanced error handling with specific Firebase error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'An account with this email already exists. Please sign in instead.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address. Please check your email and try again.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use a stronger password.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.';
            break;
          case 'permission-denied':
            errorMessage = 'Permission denied. Please check Firestore security rules.';
            if (process.env.NODE_ENV === 'development') {
              console.error('Firestore permission error. Check security rules allow users to create their own document.');
            }
            break;
          default:
            errorMessage = error.message || `Registration failed: ${error.code || 'Unknown error'}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (process.env.NODE_ENV === 'development') {
        console.error('Registration error:', {
          code: error.code,
          message: error.message,
          fullError: error,
        });
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // Complete logout flow
  logout: async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Ignore errors during logout
    } finally {
      tokenManager.clearTokens();
    }
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return tokenManager.isAuthenticated() && !tokenManager.isTokenExpired();
  },

  // Get current user profile
  getCurrentUser: async (): Promise<UserProfile | null> => {
    if (!authFlow.isAuthenticated()) {
      return null;
    }
    
    try {
      return await authAPI.getProfile();
    } catch (error) {
      tokenManager.clearTokens();
      return null;
    }
  }
};

export default authAPI; 