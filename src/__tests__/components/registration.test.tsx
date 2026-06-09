import React from 'react'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../setup'
import Register from '../../pages/register'

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

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

/** Chakra isRequired adds a separate indicator — match inputs by id via label association. */
const getInputById = (id: string) =>
  screen.getByLabelText((_, element) => element?.id === id)

describe('Registration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all required form elements', () => {
    render(<Register />)

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(getInputById('password')).toBeInTheDocument()
    expect(getInputById('confirmPassword')).toBeInTheDocument()
    expect(screen.getByLabelText(/membership type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/club name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('can fill form fields', async () => {
    const user = userEvent.setup()
    render(<Register />)

    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com')
    await user.type(getInputById('password'), 'password123')
    await user.type(getInputById('confirmPassword'), 'password123')
    await user.type(screen.getByLabelText(/club name/i), 'Test Club')

    expect(screen.getByDisplayValue('John')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('john.doe@example.com')).toBeInTheDocument()
    expect(getInputById('password')).toHaveValue('password123')
    expect(getInputById('confirmPassword')).toHaveValue('password123')
    expect(screen.getByDisplayValue('Test Club')).toBeInTheDocument()
  })

  it('has proper form structure and accessibility', () => {
    render(<Register />)

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    expect(form).toBeInTheDocument()

    const firstNameInput = screen.getByLabelText(/first name/i)
    expect(firstNameInput).toHaveAttribute('id', 'firstName')
    expect(firstNameInput).toHaveAttribute('aria-required', 'true')

    const emailInput = screen.getByLabelText(/email address/i)
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('aria-required', 'true')

    const passwordInput = getInputById('password')
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('aria-required', 'true')
  })
})
