import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../../pages/register'

// Mock the API calls
jest.mock('../../lib/api', () => ({
  registerUser: jest.fn(),
}))

const mockRegisterUser = require('../../lib/api').registerUser

const renderWithProvider = (component: React.ReactElement) => {
  return render(component)
}

describe('Registration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders registration form with all required fields', () => {
    renderWithProvider(<Register />)
    
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument()
  })

  it('validates required fields on form submission', async () => {
    const user = userEvent.setup()
    renderWithProvider(<Register />)
    
    const submitButton = screen.getByRole('button', { name: /register/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    renderWithProvider(<Register />)
    
    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'invalid-email')
    
    const submitButton = screen.getByRole('button', { name: /register/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })
  })

  it('validates password confirmation', async () => {
    const user = userEvent.setup()
    renderWithProvider(<Register />)
    
    const passwordInput = screen.getByLabelText(/password/i)
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
    
    await user.type(passwordInput, 'password123')
    await user.type(confirmPasswordInput, 'differentpassword')
    
    const submitButton = screen.getByRole('button', { name: /register/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    mockRegisterUser.mockResolvedValueOnce({ success: true })
    
    renderWithProvider(<Register />)
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /register/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      })
    })
  })

  it('handles registration error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email already exists'
    mockRegisterUser.mockRejectedValueOnce(new Error(errorMessage))
    
    renderWithProvider(<Register />)
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password123')
    
    const submitButton = screen.getByRole('button', { name: /register/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockRegisterUser).toHaveBeenCalled()
    })
  })
}) 