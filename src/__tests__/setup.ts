import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';

// Create a flexible mock that can be overridden
const mockAuthContext = {
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
};

// Mock auth context with proper hook implementations
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => mockAuthContext),
  useProtectedRoute: jest.fn(),
  useRedirectIfAuthenticated: jest.fn(),
}));

// Export the mock for tests to modify
export { mockAuthContext };

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(ChakraProvider, null, children);
};

const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render }; 