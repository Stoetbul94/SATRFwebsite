import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../../pages/register'

// Mock the auth context
const mockRegister = jest.fn()
const mockClearError = jest.fn()

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    register: mockRegister,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
  useRedirectIfAuthenticated: () => {},
}))

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(component)
}

describe('Registration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all required form elements', () => {
    renderWithProvider(<Register />)
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password \*$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Confirm Password \*$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/membership type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/club/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('can fill form fields', async () => {
    const user = userEvent.setup()
    renderWithProvider(<Register />)
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
    await user.type(screen.getByLabelText(/^Password \*$/i), 'password123')
    await user.type(screen.getByLabelText(/^Confirm Password \*$/i), 'password123')
    await user.type(screen.getByLabelText(/club/i), 'Test Club')
    
    // Verify form is filled
    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Password \*$/i)).toHaveValue('password123')
    expect(screen.getByLabelText(/^Confirm Password \*$/i)).toHaveValue('password123')
    expect(screen.getByDisplayValue('Test Club')).toBeInTheDocument()
  })

  it('has proper form structure and accessibility', () => {
    renderWithProvider(<Register />)
    
    // Check form element exists
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    // Check input attributes
    const firstNameInput = screen.getByLabelText(/first name/i)
    expect(firstNameInput).toHaveAttribute('type', 'text')
    expect(firstNameInput).toHaveAttribute('required')
    
    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')
    
    const passwordInput = screen.getByLabelText(/^Password \*$/i)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('required')
  })
}) 