import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRedirectIfAuthenticated } from '../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

const ForgotPasswordPage: NextPage = () => {
  const router = useRouter();
  
  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Validate email
    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Determine the continue URL based on environment
      const continueUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/reset-password`
        : 'http://localhost:3000/reset-password';
      
      // Use Firebase Auth to send password reset email with continue URL
      // handleCodeInApp: true means Firebase will include oobCode in the continueUrl
      await sendPasswordResetEmail(auth, email.toLowerCase().trim(), {
        url: continueUrl,
        handleCodeInApp: true, // Include oobCode in the URL so our page can handle it
      });
      
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Please check your inbox and follow the instructions to reset your password.'
      });
      setEmail('');
      
      // Redirect to login after 5 seconds
      setTimeout(() => {
        router.push('/login');
      }, 5000);
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists for security
        errorMessage = 'If an account exists with this email, a password reset link has been sent.';
        setMessage({ type: 'success', text: errorMessage });
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
        setMessage({ type: 'error', text: errorMessage });
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
        setMessage({ type: 'error', text: errorMessage });
      } else {
        setMessage({ type: 'error', text: errorMessage });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - SATRF</title>
        <meta name="description" content="Reset your SATRF account password" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-midnight-dark via-midnight-light to-midnight-dark flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Back to Home Link */}
          <Link href="/" className="flex items-center text-gray-300 hover:text-electric-cyan transition-colors duration-200 font-oxanium">
            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </Link>

          <div className="bg-midnight-light/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-700/50">
            {/* Logo and Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <img
                  src="/images/SATRFLOGO.png"
                  alt="SATRF Logo"
                  className="h-16 w-auto"
                />
              </div>
              <h2 className="text-3xl font-bold text-white font-oxanium mb-2">
                Reset Password
              </h2>
              <p className="text-gray-300 font-oxanium">
                Enter your email address and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            {/* Message Display */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-900/50 border border-green-700 text-green-200'
                    : 'bg-red-900/50 border border-red-700 text-red-200'
                }`}
              >
                <p className="text-sm font-oxanium">{message.text}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 font-oxanium">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-midnight-dark/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent disabled:opacity-50 font-oxanium"
                  placeholder="Enter your email address"
                />
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-electric-cyan hover:bg-electric-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-oxanium"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-300 font-oxanium">
                Remember your password?{' '}
                <Link href="/login" className="font-medium text-electric-cyan hover:text-electric-neon transition-colors duration-200 font-oxanium">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;

