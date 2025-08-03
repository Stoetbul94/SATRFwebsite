import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
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

// Auth state interface
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  dashboard: UserDashboardData | null;
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
  | { type: 'SET_DASHBOARD'; payload: UserDashboardData };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  dashboard: null,
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
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        dashboard: null,
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
      };
    case 'SET_DASHBOARD':
      return {
        ...state,
        dashboard: action.payload,
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

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Check if user is authenticated
  const checkAuth = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (authFlow.isAuthenticated()) {
        const user = await authFlow.getCurrentUser();
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication failed' });
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: 'Not authenticated' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE', payload: 'Authentication check failed' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const result = await authFlow.login(email, password);
      
      if (result.success && result.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Login failed' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Login failed' });
      return false;
    }
  };

  // Register function
  const register = async (userData: UserRegistrationData): Promise<boolean> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const result = await authFlow.register(userData);
      
      if (result.success && result.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: result.user });
        return true;
      } else {
        dispatch({ type: 'AUTH_FAILURE', payload: result.error || 'Registration failed' });
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Registration failed' });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authFlow.logout();
    } catch (error) {
      // Ignore logout errors
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
      router.push('/login');
    }
  };

  // Update profile function
  const updateProfile = async (profileData: UserProfileUpdate): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const updatedUser = await authAPI.updateProfile(profileData);
      dispatch({ type: 'UPDATE_PROFILE', payload: updatedUser });
      
      return true;
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message || 'Profile update failed' });
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
      }
    } catch (error) {
      // Silently fail refresh
    }
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

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

// Hook for protected routes
export const useProtectedRoute = (redirectTo: string = '/login'): void => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);
};

// Hook for redirecting authenticated users
export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard'): void => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);
};

export default AuthContext; 