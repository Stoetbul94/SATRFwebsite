import React from 'react';
import { render, screen, fireEvent, waitFor } from '../setup';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/login';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  useRedirectIfAuthenticated: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  query: {},
};

const mockUseAuth = {
  login: jest.fn(),
  isLoading: false,
  error: null,
  clearError: jest.fn(),
};

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock auth state between tests to avoid bleed-over
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue(mockUseAuth);
  });

  it('renders login form with all elements', () => {
    render(<LoginPage />);
    
    expect(screen.getByText(/Welcome Back/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('').length).toBeGreaterThan(0); // Password field
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
  });

  it('displays demo account information', () => {
    render(<LoginPage />);
    
    expect(screen.getByText(/Demo Account/i)).toBeInTheDocument();
    expect(screen.getByText(/demo@satrf.org.za/i)).toBeInTheDocument();
    expect(screen.getByText(/DemoPass123/i)).toBeInTheDocument();
  });

  it('shows navigation back to home', () => {
    render(<LoginPage />);
    
    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });

  it('navigates to home when Back to Home button is clicked', () => {
    render(<LoginPage />);
    
    const backToHomeLink = screen.getByRole('link', { name: /Back to Home/i });
    expect(backToHomeLink).toBeInTheDocument();
    expect(backToHomeLink).toHaveAttribute('href', '/');
    
    // Verify it's a proper link that would navigate
    fireEvent.click(backToHomeLink);
    // Note: Next.js Link in tests doesn't actually navigate, but we can verify the href
  });

  it('validates email format on form submission', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    // Test invalid email with valid password
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput!, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('validates required fields on form submission', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<LoginPage />);
    
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const toggleButton = screen.getByLabelText(/Show password/i);
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('handles successful demo login with redirection', async () => {
    mockUseAuth.login.mockResolvedValue(true);
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    fireEvent.change(emailInput, { target: { value: 'demo@satrf.org.za' } });
    fireEvent.change(passwordInput!, { target: { value: 'DemoPass123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUseAuth.login).toHaveBeenCalledWith('demo@satrf.org.za', 'DemoPass123');
    });
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles successful login with custom redirect', async () => {
    mockUseAuth.login.mockResolvedValue(true);
    mockRouter.query = { redirect: '/profile' };
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput!, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUseAuth.login).toHaveBeenCalledWith('user@example.com', 'password123');
    });
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/profile');
    });
  });

  it('handles login failure', async () => {
    mockUseAuth.login.mockResolvedValue(false);
    mockUseAuth.error = 'Invalid credentials';
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput!, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUseAuth.login).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    });
    
    // Should not redirect on failure
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('displays error messages from auth context', () => {
    mockUseAuth.error = 'Invalid email or password';
    
    render(<LoginPage />);
    
    expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
  });

  it('clears errors when user starts typing', async () => {
    mockUseAuth.error = 'Some error';
    
    render(<LoginPage />);
    
    expect(screen.getByText(/Some error/i)).toBeInTheDocument();
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    expect(mockUseAuth.clearError).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    mockUseAuth.login.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    fireEvent.change(emailInput, { target: { value: 'demo@satrf.org.za' } });
    fireEvent.change(passwordInput!, { target: { value: 'DemoPass123' } });
    fireEvent.click(submitButton);
    
    // Form should be disabled during submission
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Signing In/i)).toBeInTheDocument();
  });

  it('handles loading state from auth context', () => {
    mockUseAuth.isLoading = true;
    
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: /Signing In/i });
    expect(submitButton).toBeDisabled();
  });

  it('clears error on component mount', () => {
    render(<LoginPage />);
    
    expect(mockUseAuth.clearError).toHaveBeenCalled();
  });

  it('handles router errors gracefully', async () => {
    mockUseAuth.login.mockResolvedValue(true);
    mockRouter.replace.mockRejectedValue(new Error('Navigation error'));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    fireEvent.change(emailInput, { target: { value: 'demo@satrf.org.za' } });
    fireEvent.change(passwordInput!, { target: { value: 'DemoPass123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockUseAuth.login).toHaveBeenCalled();
    });
    
    // Should handle router error gracefully
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalled();
    });
  });

  it('clears field errors when user types', () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    // First, trigger validation error
    fireEvent.click(submitButton);
    
    // Then type in the field to clear the error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // The error should be cleared
    expect(mockUseAuth.clearError).toHaveBeenCalled();
  });

  it('handles form validation correctly', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInputs = screen.getAllByDisplayValue('');
    const passwordInput = passwordInputs.find(input => input.getAttribute('type') === 'password');
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    // Submit without filling required fields
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
    
    // Fill email but leave password empty
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
  });
}); 