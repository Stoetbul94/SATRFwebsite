import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, useRedirectIfAuthenticated } from '../contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { isEmailAdmin } from '@/lib/adminClient';

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  
  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission with proper async handling and redirection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      // Attempt login with provided credentials (handles both demo and real users)
      const success = await login(formData.email, formData.password);
      
      if (success) {
        // Check admin status based on email whitelist (immediate check)
        // Note: Firestore role check happens server-side, but email whitelist is immediate
        const email = formData.email.toLowerCase().trim();
        const isAdminEmail = isEmailAdmin(email);
        
        // Determine redirect: admin → admin dashboard, user → user dashboard
        // Respect redirect query param if provided, otherwise use role-based redirect
        let redirectTo = router.query.redirect as string;
        
        if (!redirectTo) {
          // No explicit redirect: use role-based default
          redirectTo = isAdminEmail ? '/admin/dashboard' : '/dashboard';
        } else if (isAdminEmail && redirectTo === '/dashboard') {
          // Admin trying to go to user dashboard: redirect to admin dashboard instead
          redirectTo = '/admin/dashboard';
        } else if (!isAdminEmail && redirectTo.startsWith('/admin')) {
          // Non-admin trying to access admin area: redirect to user dashboard
          redirectTo = '/dashboard';
        }
        
        // Use router.replace to prevent back button from returning to login
        await router.replace(redirectTo);
      } else {
        // Login failed - error will be displayed by the auth context
        console.log('Login failed - check error state');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error will be handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <Head>
        <title>Login - SATRF</title>
        <meta name="description" content="Sign in to your SATRF account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Navigation Back to Home */}
        <div className="absolute top-4 left-4 z-50">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h2 className="text-3xl font-oxanium font-bold text-electric-cyan mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-300 font-oxanium">
              Sign in to your SATRF account
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

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
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
                  disabled={isSubmitting}
                  className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
                    formErrors.email ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="Enter email address"
                />
                {formErrors.email ? (
                  <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.email}</p>
                ) : null}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`appearance-none relative block w-full px-3 py-3 pr-10 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
                      formErrors.password ? 'border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={isSubmitting}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {formErrors.password ? (
                  <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.password}</p>
                ) : null}
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  disabled={isSubmitting}
                  className="h-4 w-4 text-electric-cyan focus:ring-electric-cyan border-gray-600 rounded bg-midnight-light/50 disabled:opacity-50"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300 font-oxanium">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="font-medium text-electric-cyan hover:text-electric-neon transition-colors duration-200 font-oxanium">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-oxanium font-medium rounded-lg text-midnight-steel bg-electric-cyan hover:bg-electric-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label={isSubmitting || isLoading ? 'Signing In' : 'Sign In'}
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-midnight-steel" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-sm text-gray-400 font-oxanium">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-electric-cyan hover:text-electric-neon transition-colors duration-200">
                  Create one here
                </Link>
              </p>
            </div>
          </form>

          {/* Demo Account Info */}
          <div className="mt-6 p-4 bg-midnight-light/30 rounded-lg border border-gray-600">
            <h3 className="text-sm font-oxanium font-medium text-electric-cyan mb-2">
              Demo Account
            </h3>
            <p className="text-xs text-gray-400 font-oxanium mb-2">
              For testing purposes, you can use:
            </p>
            <div className="text-xs text-gray-300 font-oxanium space-y-1">
              <p><span className="text-electric-cyan">Email:</span> demo@satrf.org.za</p>
              <p><span className="text-electric-cyan">Password:</span> DemoPass123</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

// Make this page server-side rendered to avoid useAuth issues during static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
}; 