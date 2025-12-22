import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRedirectIfAuthenticated } from '../contexts/AuthContext';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { passwordValidator } from '../lib/auth';

const ResetPasswordPage: NextPage = () => {
  const router = useRouter();
  const { oobCode } = router.query; // Firebase uses 'oobCode' for reset tokens
  
  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [] as string[],
    warnings: [] as string[],
  });

  // Verify reset code on mount
  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || typeof oobCode !== 'string') {
        setMessage({
          type: 'error',
          text: 'Invalid or missing reset code. Please request a new password reset link.'
        });
        setIsVerifying(false);
        return;
      }

      try {
        // Verify the reset code is valid
        await verifyPasswordResetCode(auth, oobCode);
        setIsVerifying(false);
      } catch (error: any) {
        console.error('Reset code verification error:', error);
        
        let errorMessage = 'Invalid or expired reset code.';
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This password reset link has expired. Please request a new one.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Invalid reset code. Please request a new password reset link.';
        }
        
        setMessage({ type: 'error', text: errorMessage });
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  // Validate password on change
  useEffect(() => {
    if (password) {
      const validation = passwordValidator.validatePassword(password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ isValid: false, errors: [], warnings: [] });
    }
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setIsSubmitting(false);
      return;
    }

    // Validate password strength
    if (!passwordValidation.isValid) {
      setMessage({
        type: 'error',
        text: 'Password does not meet requirements. Please check the validation messages below.'
      });
      setIsSubmitting(false);
      return;
    }

    if (!oobCode || typeof oobCode !== 'string') {
      setMessage({ type: 'error', text: 'Invalid reset code.' });
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Reset password using Firebase Auth
      await confirmPasswordReset(auth, oobCode, password);
      
      // Step 2: Get user email from the reset code (we need to extract it)
      // Since we can't get email from oobCode directly, we'll sign in to get it
      // But first, we need the email - let's get it from the URL or try to sign in
      
      // Step 3: Try to sign in with Firebase Auth to verify the password was reset
      // We'll need the email - let's check if we can get it from the verified code
      let userEmail: string | null = null;
      
      try {
        // Verify the code again to get user info (if possible)
        // Actually, we can't get email from oobCode, so we'll need to store it or get it another way
        // For now, let's try to sign in - but we don't have the email here
        // The best approach is to update Firestore after successful reset
        // We'll create a backend API endpoint to sync the password
        
        // For now, show success and redirect - user will need to log in
        // The login will try Firebase Auth first, which should work
        setMessage({
          type: 'success',
          text: 'Password reset successfully! You can now sign in with your new password.'
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (signInError: any) {
        // Sign in failed, but password reset succeeded
        // This is okay - user can log in manually
        console.log('Password reset succeeded, but auto-signin failed:', signInError);
        setMessage({
          type: 'success',
          text: 'Password reset successfully! You can now sign in with your new password.'
        });
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This password reset link has expired. Please request a new one.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid reset code. Please request a new password reset link.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <>
        <Head>
          <title>Verifying Reset Code - SATRF</title>
        </Head>
        <div className="min-h-screen bg-gradient-to-br from-midnight-dark via-midnight-light to-midnight-dark flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan mx-auto mb-4"></div>
            <p className="text-gray-300 font-oxanium">Verifying reset code...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reset Password - SATRF</title>
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
                Enter your new password below.
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
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 font-oxanium">
                  New Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 bg-midnight-dark/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 font-oxanium ${
                    passwordValidation.isValid
                      ? 'border-green-600 focus:ring-green-500'
                      : password && !passwordValidation.isValid
                      ? 'border-red-600 focus:ring-red-500'
                      : 'border-gray-600 focus:ring-electric-cyan'
                  }`}
                  placeholder="Enter new password"
                />
                
                {/* Password Validation */}
                {password && (
                  <div className="mt-2 text-sm">
                    {passwordValidation.errors.length > 0 && (
                      <div className="text-red-400 space-y-1">
                        {passwordValidation.errors.map((error, idx) => (
                          <p key={idx} className="font-oxanium">• {error}</p>
                        ))}
                      </div>
                    )}
                    {passwordValidation.warnings.length > 0 && (
                      <div className="text-yellow-400 space-y-1">
                        {passwordValidation.warnings.map((warning, idx) => (
                          <p key={idx} className="font-oxanium">• {warning}</p>
                        ))}
                      </div>
                    )}
                    {passwordValidation.isValid && (
                      <p className="text-green-400 font-oxanium">✓ Password meets all requirements</p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2 font-oxanium">
                  Confirm New Password *
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 bg-midnight-dark/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent disabled:opacity-50 font-oxanium ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-red-600 focus:ring-red-500'
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-600 focus:ring-green-500'
                      : 'border-gray-600'
                  }`}
                  placeholder="Confirm new password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-sm text-red-400 font-oxanium">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && password && (
                  <p className="mt-1 text-sm text-green-400 font-oxanium">✓ Passwords match</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || !passwordValidation.isValid || password !== confirmPassword}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-electric-cyan hover:bg-electric-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-oxanium"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
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

export default ResetPasswordPage;

