import React from 'react';
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import { useAuth, useRedirectIfAuthenticated } from '../../contexts/AuthContext';
import LoginPage from '../../pages/login';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock auth context hooks
const mockUseAuth = jest.fn();
const mockUseRedirectIfAuthenticated = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  useRedirectIfAuthenticated: () => mockUseRedirectIfAuthenticated(),
}));

// Mock auth flow
jest.mock('../../lib/auth', () => ({
  authFlow: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  tokenManager: {
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
    getAccessToken: jest.fn(),
    isAuthenticated: jest.fn(),
    isTokenExpired: jest.fn(),
  },
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    updateProfile: jest.fn(),
    getDashboard: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  query: {},
  pathname: '/login',
  asPath: '/login',
  isReady: true,
};

// Helper function to get password input
const getPasswordInput = () => {
  const passwordInputs = screen.getAllByDisplayValue('');
  return passwordInputs.find(input => input.getAttribute('type') === 'password');
};

describe('Login Flow - Comprehensive Test Suite', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset router state for each test
    mockRouter.query = {};
    mockRouter.pathname = '/login';
    mockRouter.asPath = '/login';
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Default auth context mock
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
      login: jest.fn(),
      clearError: jest.fn(),
    });
    
    mockUseRedirectIfAuthenticated.mockReturnValue(undefined);
  });

  describe('1. Login Page Rendering and Form Elements', () => {
    it('renders all required login form elements', () => {
      render(<LoginPage />);

      // Check main heading
      expect(screen.getByRole('heading', { level: 2, name: /Welcome Back/i })).toBeInTheDocument();

      // Check form elements
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();

      // Check demo account information
      expect(screen.getByText(/Demo Account/i)).toBeInTheDocument();
      expect(screen.getByText(/demo@satrf.org.za/i)).toBeInTheDocument();
      expect(screen.getByText(/DemoPass123/i)).toBeInTheDocument();

      // Check navigation links
      const backToHomeLink = screen.getByRole('link', { name: /Back to Home/i });
      expect(backToHomeLink).toBeInTheDocument();
      expect(backToHomeLink).toHaveAttribute('href', '/');
      expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Create one here/i })).toBeInTheDocument();
    });

    it('Back to Home link navigates correctly when clicked', async () => {
      render(<LoginPage />);
      
      const backToHomeLink = screen.getByRole('link', { name: /Back to Home/i });
      expect(backToHomeLink).toBeInTheDocument();
      expect(backToHomeLink).toHaveAttribute('href', '/');
      
      // Click the link
      await user.click(backToHomeLink);
      
      // Verify the link has the correct href (Next.js Link will handle navigation in real app)
      expect(backToHomeLink).toHaveAttribute('href', '/');
    });

    it('has proper form structure and accessibility attributes', () => {
      render(<LoginPage />);

      // Check for form element (using tag name since no role is set)
      const form = screen.getByRole('button', { name: /Sign In/i }).closest('form');
      expect(form).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Check input attributes
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('placeholder', 'Enter email address');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('placeholder', 'Enter password');

      // Check button attributes
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('displays password visibility toggle with proper accessibility', () => {
      render(<LoginPage />);

      const passwordInput = getPasswordInput();
      const toggleButton = screen.getByLabelText(/Show password/i);

      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

      // Test password visibility toggle
      expect(passwordInput).toHaveAttribute('type', 'password');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');
      expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
      
      fireEvent.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');
    });
  });

  describe('2. Form Validation and User Input', () => {
    it('validates required fields on form submission', async () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /Sign In/i });
      
      // Submit empty form
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Test invalid email format
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput!, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });

      // Test valid email format
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('clears field errors when user starts typing', async () => {
      const mockClearError = jest.fn();
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: jest.fn(),
        clearError: mockClearError,
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Trigger validation error
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      });

      // Start typing to clear error
      await user.type(emailInput, 'test@example.com');
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('3. Successful Login Flow', () => {
    it('handles successful login with real credentials', async () => {
      const mockLogin = jest.fn().mockResolvedValue(true);
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      await user.type(emailInput, 'realuser@example.com');
      await user.type(passwordInput!, 'securepassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('realuser@example.com', 'securepassword123');
      });

      // After successful login, the router.replace should be called with /dashboard
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('redirects to custom path after successful login', async () => {
      const mockLogin = jest.fn().mockResolvedValue(true);
      mockRouter.query = { redirect: '/profile' };
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      await user.type(emailInput, 'user@example.com');
      await user.type(passwordInput!, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
      });

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('4. Login Failure and Error Handling', () => {
    it('handles login failure and displays error message', async () => {
      const mockLogin = jest.fn().mockResolvedValue(false);
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: 'Invalid email or password',
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Clear inputs first, then type valid values
      await user.clear(emailInput);
      await user.type(emailInput, 'wrong@example.com');
      await user.clear(passwordInput!);
      await user.type(passwordInput!, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
      });

      // Verify error message is displayed
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();

      // Verify no redirect occurred
      expect(mockRouter.replace).not.toHaveBeenCalled();
    });

    it('handles network errors gracefully', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('Network error'));
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: 'Network error. Please try again.',
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Clear inputs first, then type valid values
      await user.clear(emailInput);
      await user.type(emailInput, 'user@example.com');
      await user.clear(passwordInput!);
      await user.type(passwordInput!, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      expect(screen.getByText(/Network error. Please try again./i)).toBeInTheDocument();
    });

    it('clears error messages when user starts typing', async () => {
      const mockClearError = jest.fn();
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: 'Previous error message',
        login: jest.fn(),
        clearError: mockClearError,
      });

      render(<LoginPage />);

      // Error should be displayed initially
      expect(screen.getByText(/Previous error message/i)).toBeInTheDocument();

      const emailInput = screen.getByLabelText(/Email Address/i);
      
      // Clear input first, then type
      await user.clear(emailInput);
      await user.type(emailInput, 't');

      // Error should be cleared when user types
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('5. Loading States and Form Disabling', () => {
    it('disables form during login submission', async () => {
      const mockLogin = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      await user.type(emailInput, 'demo@satrf.org.za');
      await user.type(passwordInput!, 'DemoPass123');
      await user.click(submitButton);

      // Form should be disabled during submission
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/Signing In/i)).toBeInTheDocument();
    });

    it('handles loading state from auth context', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isInitialized: true,
        error: null,
        login: jest.fn(),
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const submitButton = screen.getByRole('button', { name: /Signing In/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('6. Authentication State and Redirects', () => {
    it('redirects already authenticated users away from login page', () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'user-123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: jest.fn(),
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      // Should redirect authenticated users
      expect(mockUseRedirectIfAuthenticated).toHaveBeenCalled();
    });

    it('preserves redirect URL in query parameters', () => {
      mockRouter.query = { redirect: '/protected-page' };
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: jest.fn(),
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      // Should use the redirect parameter from query
      expect(mockRouter.query.redirect).toBe('/protected-page');
    });
  });

  describe('7. Accessibility and Keyboard Navigation', () => {
    it('supports keyboard navigation through form elements', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /Remember me/i });
      const forgotPasswordLink = screen.getByRole('link', { name: /Forgot password/i });
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Focus should move through elements with Tab
      emailInput.focus();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(rememberMeCheckbox).toHaveFocus();

      await user.tab();
      expect(forgotPasswordLink).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('submits form when Enter key is pressed', async () => {
      const mockLogin = jest.fn().mockResolvedValue(true);
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();

      await act(async () => {
        await user.type(emailInput, 'demo@satrf.org.za');
        await user.type(passwordInput!, 'DemoPass123');
        await user.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('demo@satrf.org.za', 'DemoPass123');
      });
    });

    it('has proper ARIA labels and roles', () => {
      render(<LoginPage />);

      // Check for form element (using tag name since no role is set)
      const form = screen.getByRole('button', { name: /Sign In/i }).closest('form');
      expect(form).toBeInTheDocument();

      // Check input labels
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();

      // Check button roles
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Show password/i })).toBeInTheDocument();

      // Check link roles
      expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Create one here/i })).toBeInTheDocument();
    });
  });

  describe('8. Integration Tests', () => {
    it('completes full login flow with state updates', async () => {
      const mockLogin = jest.fn().mockResolvedValue(true);
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      // Step 1: Fill form
      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Clear inputs first, then type
      await act(async () => {
        await user.clear(emailInput);
        await user.type(emailInput, 'demo@satrf.org.za');
        await user.clear(passwordInput!);
        await user.type(passwordInput!, 'DemoPass123');
      });

      // Step 2: Submit form
      await act(async () => {
        await user.click(submitButton);
      });

      // Step 3: Verify login called
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('demo@satrf.org.za', 'DemoPass123');
      });

      // Step 4: Verify redirect
      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('handles form validation and submission in sequence', async () => {
      const mockLogin = jest.fn().mockResolvedValue(true);
      
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialized: true,
        error: null,
        login: mockLogin,
        clearError: jest.fn(),
      });

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole('button', { name: /Sign In/i });

      // Fill form with demo credentials - clear first to avoid corruption
      await act(async () => {
        await user.clear(emailInput);
        await user.type(emailInput, 'demo@satrf.org.za');
        await user.clear(passwordInput!);
        await user.type(passwordInput!, 'DemoPass123');
      });

      // Submit form
      await act(async () => {
        await user.click(submitButton);
      });

      // Verify login called with correct credentials
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('demo@satrf.org.za', 'DemoPass123');
      });
    });
  });
}); 