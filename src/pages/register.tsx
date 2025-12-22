import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, useRedirectIfAuthenticated } from '../contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { UserRegistrationData, passwordValidator } from '../lib/auth';

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  
  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  // Form state
  const [formData, setFormData] = useState<UserRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    membershipType: 'senior',
    club: '',
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [] as string[],
    warnings: [] as string[],
  });

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Validate password on change
  useEffect(() => {
    if (formData.password) {
      const validation = passwordValidator.validatePassword(formData.password);
      setPasswordValidation(validation);
    }
  }, [formData.password]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    
    // Clear field error when user starts typing
    if (formErrors.confirmPassword) {
      setFormErrors(prev => ({
        ...prev,
        confirmPassword: '',
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (formData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (formData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be less than 50 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!passwordValidator.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = 'Password does not meet requirements';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (!passwordValidator.validatePasswordMatch(formData.password, confirmPassword)) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Club validation
    if (!formData.club.trim()) {
      errors.club = 'Club name is required';
    } else if (formData.club.trim().length < 2) {
      errors.club = 'Club name must be at least 2 characters';
    } else if (formData.club.trim().length > 100) {
      errors.club = 'Club name must be less than 100 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const success = await register(formData);
    if (success) {
      router.push('/dashboard');
    }
  };

  // Password strength indicator
  const getPasswordStrengthColor = () => {
    if (!formData.password) return 'bg-gray-200';
    if (passwordValidation.errors.length > 2) return 'bg-red-500';
    if (passwordValidation.errors.length > 0) return 'bg-yellow-500';
    if (passwordValidation.warnings.length > 0) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (!formData.password) return 'Enter password';
    if (passwordValidation.errors.length > 2) return 'Very Weak';
    if (passwordValidation.errors.length > 0) return 'Weak';
    if (passwordValidation.warnings.length > 0) return 'Good';
    return 'Strong';
  };

  return (
    <>
      <Head>
        <title>Register - SATRF</title>
        <meta name="description" content="Create your SATRF account to access shooting scores and events" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Navigation Back to Home */}
        <div className="absolute top-4 left-4">
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 text-sm font-oxanium text-electric-cyan hover:text-electric-neon transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>
        </div>

        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-electric-cyan rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-midnight-steel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-oxanium font-bold text-electric-cyan mb-2">
              Create Account
            </h2>
            <p className="text-gray-300 font-oxanium">
              Join the South African Target Rifle Federation
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-oxanium">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium ${
                      formErrors.firstName ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Enter first name"
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.firstName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium ${
                      formErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Enter last name"
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium ${
                    formErrors.email ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium ${
                    formErrors.password ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter password"
                />
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{
                            width: `${Math.max(25, 100 - (passwordValidation.errors.length * 25))}%`
                          }}
                        />
                      </div>
                      <span className={`text-xs font-oxanium ${
                        passwordValidation.errors.length > 2 ? 'text-red-400' :
                        passwordValidation.errors.length > 0 ? 'text-yellow-400' :
                        passwordValidation.warnings.length > 0 ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    
                    {/* Password Requirements */}
                    <div className="mt-2 space-y-1">
                      {passwordValidation.errors.map((error, index) => (
                        <p key={index} className="text-xs text-red-400 font-oxanium flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          {error}
                        </p>
                      ))}
                      {passwordValidation.warnings.map((warning, index) => (
                        <p key={index} className="text-xs text-blue-400 font-oxanium flex items-center">
                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {warning}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium ${
                    formErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Confirm password"
                />
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Membership Type */}
              <div>
                <label htmlFor="membershipType" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                  Membership Type *
                </label>
                <select
                  id="membershipType"
                  name="membershipType"
                  required
                  value={formData.membershipType}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 border rounded-lg text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium"
                >
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                  <option value="veteran">Veteran</option>
                </select>
              </div>

              {/* Club */}
              <div>
                <label htmlFor="club" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                  Club Name *
                </label>
                <input
                  id="club"
                  name="club"
                  type="text"
                  required
                  value={formData.club}
                  onChange={handleInputChange}
                  className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium ${
                    formErrors.club ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter club name"
                />
                {formErrors.club && (
                  <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.club}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-oxanium font-medium rounded-lg text-midnight-steel bg-electric-cyan hover:bg-electric-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-midnight-steel" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          {/* Login Link - Moved outside form to prevent form submission interference */}
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400 font-oxanium">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium text-electric-cyan hover:text-electric-neon transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;

// Make this page server-side rendered to avoid useAuth issues during static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
}; 