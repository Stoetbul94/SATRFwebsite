import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create axios instance for auth
// CRITICAL: Reduce timeout to prevent dev server hangs when backend is unavailable
const authApi: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/${API_VERSION}`,
  timeout: 3000, // Reduced from 10000 to 3000ms to prevent hanging
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
  province: string;
  dateOfBirth: string;
  phone: string;
  disciplines?: string[];
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
  /** Approval lifecycle: members must be 'active' to use the member area. */
  status: 'pending' | 'active' | 'rejected' | 'suspended';
  profileImageUrl?: string;
  phone?: string; // Preferred field name
  phoneNumber?: string; // Legacy field name for backward compatibility
  dateOfBirth?: string;
  province?: string;
  disciplines?: string[];
  /** Derived from DOB; informational hint — membershipType is authoritative. */
  ageCategory?: 'junior' | 'senior' | 'veteran';
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
  phone?: string; // Preferred field name
  phoneNumber?: string; // Legacy field name for backward compatibility
  dateOfBirth?: string;
  province?: string;
  disciplines?: string[];
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

/** Middleware reads cookies; Firebase auth also uses localStorage — keep both in sync. */
const AUTH_COOKIE_MAX_AGE_DAYS = 7;

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const maxAge = AUTH_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `access_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  document.cookie = `auth_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=; Path=/; Max-Age=0; SameSite=Lax';
  document.cookie = 'auth_token=; Path=/; Max-Age=0; SameSite=Lax';
}

// Token management utilities
export const tokenManager = {
  setTokens: (accessToken: string, refreshToken: string, sessionId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('session_id', sessionId);
      setAuthCookie(accessToken);
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
      clearAuthCookies();
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

  // Update user profile (Firebase — server route with ownership checks)
  updateProfile: async (profileData: UserProfileUpdate): Promise<UserProfile> => {
    if (typeof window === 'undefined') {
      const response = await authApi.put('/users/profile', profileData);
      return response.data;
    }

    const { auth } = await import('@/lib/firebase');
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Not authenticated');
    }
    const token = await firebaseUser.getIdToken();
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Profile update failed');
    }
    const data = await res.json();
    return data.profile as UserProfile;
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

/** True if this profile is an admin (handles common Firestore/console field shapes). */
export function isProfileAdmin(profile: Pick<UserProfile, 'role'> & { roles?: { admin?: boolean }; admin?: boolean }): boolean {
  if (profile.role === 'admin') return true;
  if ((profile as { admin?: boolean }).admin === true) return true;
  if (profile.roles?.admin === true) return true;
  return false;
}

/** Admins always pass; members need status active. */
export function canAccessApp(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  if (isProfileAdmin(profile)) return true;
  return profile.status === 'active';
}

// Map a Firestore user document to a UserProfile.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapUserDoc(uid: string, data: any): UserProfile {
  let role = (data.role as UserProfile['role']) || 'user';
  // Support nested roles.admin or mistaken top-level admin: true from console edits.
  if (role !== 'admin' && ((data.roles as { admin?: boolean })?.admin === true || data.admin === true)) {
    role = 'admin';
  }

  let status = data.status as UserProfile['status'] | undefined;
  if (!status) {
    status = role === 'admin' ? 'active' : data.isActive === false ? 'suspended' : 'active';
  }

  return {
    id: uid,
    firstName: data.firstName as string,
    lastName: data.lastName as string,
    email: data.email as string,
    membershipType: data.membershipType as UserProfile['membershipType'],
    club: data.club as string,
    role,
    status,
    profileImageUrl: data.profileImageUrl,
    phone: data.phone ?? data.phoneNumber,
    phoneNumber: data.phoneNumber,
    dateOfBirth: data.dateOfBirth,
    province: data.province,
    disciplines: Array.isArray(data.disciplines) ? data.disciplines : undefined,
    ageCategory: data.ageCategory,
    address: data.address,
    emergencyContact: data.emergencyContact,
    emergencyPhone: data.emergencyPhone,
    isActive: data.isActive !== false,
    emailConfirmed: data.emailConfirmed || false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastLoginAt: data.lastLoginAt,
    loginCount: data.loginCount || 0,
  };
}

/**
 * Load the signed-in user's profile. Prefer the server API (Admin SDK) so login
 * does not depend on client Firestore reads right after sign-in.
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  if (typeof window !== 'undefined') {
    try {
      const { auth } = await import('@/lib/firebase');
      const firebaseUser = auth.currentUser;
      if (firebaseUser?.uid === uid) {
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          return data.profile as UserProfile;
        }
      }
    } catch (err) {
      console.warn('[AUTH] Server profile fetch failed, trying Firestore client:', err);
    }
  }

  const { doc, getDoc } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase');
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return mapUserDoc(uid, snap.data());
}

// Auth flow utilities
export const authFlow = {
  // Complete login flow
  login: async (email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      // Authenticate against Firebase Auth.
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        const { doc, getDoc } = await import('firebase/firestore');
        const { auth, db } = await import('@/lib/firebase');
        
        // Try Firebase Auth login
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.toLowerCase().trim(),
          password
        );
        
        const firebaseUser = userCredential.user;
        
        // Get user profile from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userProfile = mapUserDoc(firebaseUser.uid, userData);

          // Approval gate: members need active status; admins never need approval.
          if (!canAccessApp(userProfile)) {
            const { signOut } = await import('firebase/auth');
            await signOut(auth).catch(() => {});
            tokenManager.clearTokens();
            const statusMessage: Record<string, string> = {
              pending: 'Your account is awaiting admin approval. You will be notified once approved.',
              rejected: 'Your registration was not approved. Please contact SATRF.',
              suspended: 'Your account has been suspended. Please contact SATRF.',
            };
            return {
              success: false,
              error: statusMessage[userProfile.status] || 'Your account is not active.',
            };
          }

          // Store Firebase ID token
          const idToken = await firebaseUser.getIdToken();
          tokenManager.setTokens(
            idToken,
            idToken, // Using same token for refresh (Firebase handles refresh internally)
            firebaseUser.uid
          );
          
          // Generate demo data if enabled and user doesn't have any (non-blocking)
          if (typeof window !== 'undefined') {
            import('@/lib/demoData').then(({ generateDemoDataForUser, isDemoModeEnabled }) => {
              if (isDemoModeEnabled()) {
                generateDemoDataForUser(firebaseUser.uid, {
                  id: firebaseUser.uid,
                  firstName: userProfile.firstName,
                  lastName: userProfile.lastName,
                  club: userProfile.club,
                  membershipType: userProfile.membershipType,
                }).catch((error) => {
                  // Log but don't fail login if demo data generation fails
                  console.warn('[AUTH] Failed to generate demo data (non-critical):', error);
                });
              }
            });
          }
          
          return { success: true, user: userProfile };
        } else {
          // Authenticated but no profile doc — treat as not-approved / orphaned.
          const { signOut } = await import('firebase/auth');
          await signOut(auth).catch(() => {});
          return {
            success: false,
            error: 'No member profile found for this account. Please contact SATRF.',
          };
        }
      } catch (firebaseError: any) {
        // Convert Firebase error codes to user-friendly messages
        const getFirebaseErrorMessage = (code: string, originalMessage?: string): string => {
          // Strip "Firebase:" prefix if present
          const cleanMessage = originalMessage?.replace(/^Firebase:\s*/i, '').trim() || '';
          
          switch (code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
              return 'Incorrect email or password. Please check your credentials and try again.';
            case 'auth/user-not-found':
              return 'No account found with this email address.';
            case 'auth/user-disabled':
              return 'Your account is awaiting admin approval (or has been disabled). You will be able to sign in once approved.';
            case 'auth/too-many-requests':
              return 'Too many failed login attempts. Please try again later.';
            case 'auth/network-request-failed':
              return 'Network error. Please check your internet connection and try again.';
            case 'auth/invalid-email':
              return 'Invalid email address format.';
            default:
              // If we have a clean message that doesn't look technical, use it
              if (cleanMessage && !cleanMessage.includes('auth/') && !cleanMessage.includes('Error')) {
                return cleanMessage;
              }
              return 'Login failed. Please check your credentials and try again.';
          }
        };

        return {
          success: false,
          error: getFirebaseErrorMessage(firebaseError.code, firebaseError.message),
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message?.includes('Firebase')
          ? 'Login failed. Please check your credentials and try again.'
          : error?.message || 'Login failed. Please check your credentials and try again.',
      };
    }
  },

  // Complete registration flow - creates a pending account via server route.
  register: async (userData: UserRegistrationData): Promise<{ success: boolean; user?: UserProfile; error?: string; pending?: boolean }> => {
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

    // Client-side: call the server route, which creates a DISABLED auth user
    // + a 'pending' Firestore profile. The member is NOT logged in; an admin
    // must approve them before they can sign in.
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error || data.message || 'Registration failed. Please try again.',
        };
      }

      return { success: true, pending: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Registration failed. Please try again.',
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

  // Get current user profile from Firebase Auth + Firestore.
  getCurrentUser: async (): Promise<UserProfile | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const { auth } = await import('@/lib/firebase');
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;
      return await fetchUserProfile(firebaseUser.uid);
    } catch (error) {
      return null;
    }
  }
};

export default authAPI; 