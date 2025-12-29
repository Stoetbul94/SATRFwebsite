import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { 
  UserProfile, 
  UserRegistrationData, 
  UserLoginData, 
  UserProfileUpdate,
  UserDashboardData,
  authFlow,
  tokenManager,
  authAPI
} from '../lib/auth';
import { isUserAdmin } from '@/lib/userRole';
import { isEmailAdmin } from '@/lib/adminClient';

// Auth state interface
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  dashboard: UserDashboardData | null;
  isInitialized: boolean; // Track if initial auth check is complete
}

// Auth action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: UserProfile }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_PROFILE'; payload: UserProfile }
  | { type: 'PROFILE_UPDATE_ERROR'; payload: string }
  | { type: 'SET_DASHBOARD'; payload: UserDashboardData }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  dashboard: null,
  isInitialized: false, // Start as false until initial check is complete
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        isInitialized: true, // Mark as initialized when auth succeeds
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        isInitialized: true, // Mark as initialized even on failure
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        dashboard: null,
        isInitialized: true, // Keep initialized state
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: action.payload,
        error: null, // Clear any previous errors on successful update
      };
    case 'PROFILE_UPDATE_ERROR':
      // Profile update errors should NOT log the user out
      // Only set the error, keep authentication state intact
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'SET_DASHBOARD':
      return {
        ...state,
        dashboard: action.payload,
      };
    case 'SET_INITIALIZED':
      return {
        ...state,
        isInitialized: action.payload,
      };
    default:
      return state;
  }
};

// Auth context interface
interface AuthContextType extends AuthState {
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: UserRegistrationData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profileData: UserProfileUpdate) => Promise<boolean>;
  loadDashboard: () => Promise<void>;
  clearError: () => void;
  
  // Utility functions
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Check authentication status on mount and when router is ready
  // CRITICAL: Only run on client-side to prevent SSR blocking
  useEffect(() => {
    // Guard: Only run on client-side
    if (typeof window === 'undefined') {
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }
    
    // Guard: Only run when router is ready
    if (!router.isReady) {
      return;
    }
    
    // Add timeout to prevent hanging if backend is unavailable
    const timeoutId = setTimeout(() => {
      console.warn('Auth check timeout - backend may be unavailable');
      dispatch({ type: 'SET_INITIALIZED', payload: true });
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 5000); // 5 second timeout
    
    // Run auth check with timeout protection
    checkAuth()
      .finally(() => {
        clearTimeout(timeoutId);
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // checkAuth is stable and doesn't need to be in deps
  }, [router.isReady]);

  // Check if user is authenticated - improved with better error handling
  const checkAuth = async (): Promise<void> => {
    // CRITICAL: Never run on server-side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      
      // Check if we have valid tokens first
      if (authFlow.isAuthenticated()) {
        // Try to get current user from stored tokens with timeout
        try {
          const user = await Promise.race([
            authFlow.getCurrentUser(),
            new Promise<UserProfile | null>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 3000)
            )
          ]);
          
          if (user) {
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
            return;
          } else {
            // Token exists but user fetch failed - clear invalid tokens
            tokenManager.clearTokens();
            dispatch({ type: 'AUTH_FAILURE', payload: 'Session expired' });
            return;
          }
        } catch (timeoutError) {
          // API call timed out or failed - backend likely unavailable
          console.warn('Auth check failed - backend may be unavailable:', timeoutError);
          tokenManager.clearTokens();
          dispatch({ type: 'AUTH_FAILURE', payload: 'Not authenticated' });
          return;
        }
      } else {
        // No valid tokens found
        dispatch({ type: 'AUTH_FAILURE', payload: 'Not authenticated' });
        return;
      }
    } catch (error: any) {
      console.error('Auth check error:', error);
      // Clear any invalid tokens on error
      tokenManager.clearTokens();
      dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication check failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Login function - improved with better state management
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const result = await authFlow.login(email, password);
      
      if (result.success && result.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Login failed' });
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Login failed' });
      return false;
    }
  };

  // Register function
  const register = async (userData: UserRegistrationData): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      dispatch({ type: 'CLEAR_ERROR' });
      
      const result = await authFlow.register(userData);
      
      if (result.success && result.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Registration failed' });
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Registration failed' });
      return false;
    }
  };

  // Logout function - improved with proper cleanup
  const logout = async (): Promise<void> => {
    try {
      // Clear tokens first
      tokenManager.clearTokens();
      
      // Try to call logout API (optional)
      try {
        await authFlow.logout();
      } catch (error) {
        // Ignore logout API errors
        console.warn('Logout API call failed:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always update state and redirect
      dispatch({ type: 'AUTH_LOGOUT' });
      
      // Redirect to login page
      if (router.pathname !== '/login') {
        router.replace('/login');
      }
    }
  };

  // Update profile function
  const updateProfile = async (profileData: UserProfileUpdate): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' }); // Clear any previous errors
      
      const updatedUser = await authAPI.updateProfile(profileData);
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
      
      return true;
    } catch (error: any) {
      console.error('Profile update error:', error);
      // Use PROFILE_UPDATE_ERROR instead of AUTH_FAILURE to avoid logging user out
      dispatch({ type: 'PROFILE_UPDATE_ERROR', payload: error.message || 'Profile update failed' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Load dashboard data
  const loadDashboard = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const dashboard = await authAPI.getDashboard();
      dispatch({ type: 'SET_DASHBOARD', payload: dashboard });
    } catch (error: any) {
      console.error('Dashboard load error:', error);
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Failed to load dashboard' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const user = await authFlow.getCurrentUser();
      if (user) {
        dispatch({ type: 'UPDATE_PROFILE', payload: user });
      } else {
        // User fetch failed, might need to logout
        console.warn('User refresh failed, logging out');
        await logout();
      }
    } catch (error) {
      console.error('User refresh error:', error);
      // Don't logout on refresh errors, just log them
    }
  };

  // Clear error
  // Memoize clearError to prevent infinite loops in useEffect dependencies
  const clearError = useCallback((): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Context value
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    loadDashboard,
    clearError,
    checkAuth,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Hook for protected routes - improved with better loading handling
export const useProtectedRoute = (redirectTo: string = '/login'): void => {
  const { isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after initial auth check is complete and not loading
    if (isInitialized && !isLoading && !isAuthenticated) {
      // Store the current path for redirect after login
      const currentPath = router.asPath;
      if (currentPath !== redirectTo) {
        router.replace(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`);
      } else {
        router.replace(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, isInitialized, router, redirectTo]);
};

// Hook for redirecting authenticated users - improved with better loading handling and admin detection
export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard'): void => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect after initial auth check is complete and not loading
    if (isInitialized && !isLoading && isAuthenticated && user) {
      // Check if user is admin (both role structure and email whitelist)
      const isAdmin = isUserAdmin(user as any) || isEmailAdmin(user.email);
      
      // Check if there's a redirect query parameter
      const { redirect } = router.query;
      let targetPath = redirect ? String(redirect) : redirectTo;
      
      // CRITICAL: Override redirect for admins - they must go to admin dashboard
      if (isAdmin) {
        // If admin and trying to go to user dashboard, redirect to admin dashboard
        if (targetPath === '/dashboard' || targetPath.startsWith('/dashboard')) {
          targetPath = '/admin/dashboard';
        }
        // If non-admin path specified but user is admin, redirect to admin dashboard
        if (!targetPath.startsWith('/admin')) {
          targetPath = '/admin/dashboard';
        }
      } else {
        // Non-admin trying to access admin area: redirect to user dashboard
        if (targetPath.startsWith('/admin')) {
          targetPath = '/dashboard';
        }
      }
      
      // Only redirect if we're not already on the target path
      // Use router.pathname instead of router.asPath to avoid query param issues
      if (router.pathname !== targetPath && router.pathname !== redirect) {
        router.replace(targetPath);
      }
    }
    // Fix: Remove router from dependencies to prevent infinite loops
    // router.query and router.pathname are stable enough for this check
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading, isInitialized, redirectTo, user]);
};

export default AuthContext; 