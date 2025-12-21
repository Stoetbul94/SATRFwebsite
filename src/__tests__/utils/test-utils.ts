import { UserProfile, UserLoginData } from '../../lib/auth';

// Mock user data for testing
export const mockUser: UserProfile = {
  id: 'demo-user-123',
  firstName: 'Demo',
  lastName: 'User',
  email: 'demo@satrf.org.za',
  membershipType: 'senior',
  club: 'SATRF Demo Club',
  role: 'user',
  isActive: true,
  emailConfirmed: true,
  createdAt: new Date().toISOString(),
  loginCount: 1,
  lastLoginAt: new Date().toISOString(),
};

export const mockRealUser: UserProfile = {
  id: 'real-user-456',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  membershipType: 'senior',
  club: 'Example Club',
  role: 'user',
  isActive: true,
  emailConfirmed: true,
  createdAt: new Date().toISOString(),
  loginCount: 5,
  lastLoginAt: new Date().toISOString(),
};

// Mock login credentials
export const mockCredentials: UserLoginData = {
  email: 'demo@satrf.org.za',
  password: 'DemoPass123',
};

export const mockRealCredentials: UserLoginData = {
  email: 'john.doe@example.com',
  password: 'SecurePass123',
};

// Mock JWT tokens
export const mockTokens = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZW1vLXVzZXItMTIzIiwibmFtZSI6IkRlbW8gVXNlciIsImlhdCI6MTYxNjI0NzIwMCwiZXhwIjoxNjE2MjUwODAwfQ.mock-signature',
  refreshToken: 'refresh-token-123',
  sessionId: 'session-123',
};

// Mock router object
export const createMockRouter = (overrides = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
  query: {},
  pathname: '/login',
  asPath: '/login',
  isReady: true,
  ...overrides,
});

// Mock auth context state
export const createMockAuthState = (overrides = {}) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: true,
  error: null,
  dashboard: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
  loadDashboard: jest.fn(),
  clearError: jest.fn(),
  checkAuth: jest.fn(),
  refreshUser: jest.fn(),
  ...overrides,
});

// Helper function to simulate successful login
export const simulateSuccessfulLogin = async (
  mockLogin: jest.Mock,
  mockRouter: any,
  credentials: UserLoginData = mockCredentials,
  redirectTo: string = '/dashboard'
) => {
  mockLogin.mockResolvedValue(true);
  
  // Simulate the login process
  await mockLogin(credentials.email, credentials.password);
  
  // Verify redirect
  expect(mockRouter.replace).toHaveBeenCalledWith(redirectTo);
};

// Helper function to simulate failed login
export const simulateFailedLogin = async (
  mockLogin: jest.Mock,
  mockRouter: any,
  credentials: UserLoginData = mockCredentials,
  errorMessage: string = 'Invalid credentials'
) => {
  mockLogin.mockResolvedValue(false);
  
  // Simulate the login process
  await mockLogin(credentials.email, credentials.password);
  
  // Verify no redirect occurred
  expect(mockRouter.replace).not.toHaveBeenCalled();
  
  return errorMessage;
};

// Helper function to create mock JWT token
export const createMockJWT = (payload: any, expiresIn: number = 3600) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenPayload = { ...payload, exp };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(tokenPayload));
  const signature = 'mock-signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

// Helper function to decode JWT token
export const decodeJWT = (token: string) => {
  try {
    const [, payload] = token.split('.');
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

// Helper function to check if JWT is expired
export const isJWTExpired = (token: string) => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
};

// Mock localStorage for testing
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Helper function to set up authenticated state
export const setupAuthenticatedState = (user: UserProfile = mockUser) => {
  return createMockAuthState({
    user,
    isAuthenticated: true,
    isLoading: false,
    isInitialized: true,
    error: null,
  });
};

// Helper function to set up loading state
export const setupLoadingState = () => {
  return createMockAuthState({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isInitialized: false,
    error: null,
  });
};

// Helper function to set up error state
export const setupErrorState = (error: string = 'Authentication failed') => {
  return createMockAuthState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: true,
    error,
  });
};

// Test data for form validation
export const testEmailAddresses = {
  valid: [
    'test@example.com',
    'user.name@domain.co.uk',
    'user+tag@example.org',
    'demo@satrf.org.za',
  ],
  invalid: [
    'invalid-email',
    '@example.com',
    'user@',
    'user.example.com',
    'user@.com',
  ],
};

export const testPasswords = {
  valid: [
    'SecurePass123',
    'DemoPass123',
    'MyPassword123!',
    'ComplexP@ssw0rd',
  ],
  invalid: [
    'short',
    'nouppercase123',
    'NOLOWERCASE123',
    'NoNumbers',
  ],
};

// Helper function to wait for async operations
export const waitForAsync = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create test user event
export const createTestUser = () => {
  return {
    type: async (element: HTMLElement, text: string) => {
      fireEvent.change(element, { target: { value: text } });
    },
    click: async (element: HTMLElement) => {
      fireEvent.click(element);
    },
    clear: async (element: HTMLElement) => {
      fireEvent.change(element, { target: { value: '' } });
    },
    tab: async () => {
      fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' });
    },
    keyboard: async (key: string) => {
      fireEvent.keyDown(document.activeElement || document.body, { key });
    },
  };
};

// Export fireEvent for convenience
export { fireEvent } from '@testing-library/react'; 