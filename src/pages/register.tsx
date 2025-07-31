'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiMapPin } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import { authAPI } from '@/lib/api';

// Registration form schema
const registrationSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  membershipType: z.enum(['junior', 'senior', 'veteran'], {
    required_error: 'Please select a membership type',
  }),
  club: z.string()
    .min(2, 'Club name must be at least 2 characters')
    .max(100, 'Club name must be less than 100 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function Register() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    
    try {
      await authAPI.register(data);
      
      toast.success('Registration successful! Welcome to SATRF!');
      
      // Redirect to login page
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join SATRF
            </h1>
            <p className="text-gray-600">
              Create your account to access member benefits and participate in events
            </p>
          </div>

          {/* Registration Form */}
          <div className="card">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="form-label">
                    <FiUser className="inline mr-2" />
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    {...register('firstName')}
                    className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p id="firstName-error" className="form-error" role="alert">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="lastName" className="form-label">
                    <FiUser className="inline mr-2" />
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    {...register('lastName')}
                    className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <p id="lastName-error" className="form-error" role="alert">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="form-label">
                  <FiMail className="inline mr-2" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p id="email-error" className="form-error" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="form-label">
                    <FiLock className="inline mr-2" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      aria-invalid={!!errors.password}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="password-error" className="form-error" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    <FiLock className="inline mr-2" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                      aria-invalid={!!errors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p id="confirmPassword-error" className="form-error" role="alert">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Membership Type */}
              <div>
                <label htmlFor="membershipType" className="form-label">
                  Membership Type
                </label>
                <select
                  id="membershipType"
                  {...register('membershipType')}
                  className={`input-field ${errors.membershipType ? 'border-red-500' : ''}`}
                  aria-describedby={errors.membershipType ? 'membershipType-error' : undefined}
                  aria-invalid={!!errors.membershipType}
                >
                  <option value="">Select membership type</option>
                  <option value="junior">Junior (Under 18)</option>
                  <option value="senior">Senior (18-59)</option>
                  <option value="veteran">Veteran (60+)</option>
                </select>
                {errors.membershipType && (
                  <p id="membershipType-error" className="form-error" role="alert">
                    {errors.membershipType.message}
                  </p>
                )}
              </div>

              {/* Club Field */}
              <div>
                <label htmlFor="club" className="form-label">
                  <FiMapPin className="inline mr-2" />
                  Club
                </label>
                <input
                  id="club"
                  type="text"
                  {...register('club')}
                  className={`input-field ${errors.club ? 'border-red-500' : ''}`}
                  placeholder="Enter your club name"
                  aria-describedby={errors.club ? 'club-error' : undefined}
                  aria-invalid={!!errors.club}
                />
                {errors.club && (
                  <p id="club-error" className="form-error" role="alert">
                    {errors.club.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby="submit-status"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
              <div id="submit-status" className="sr-only" aria-live="polite">
                {isSubmitting ? 'Creating account...' : 'Ready to submit'}
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <a
                  href="/login"
                  className="text-satrf-lightBlue hover:text-satrf-navy font-medium transition-colors duration-200"
                >
                  Sign in here
                </a>
              </p>
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              By creating an account, you agree to our{' '}
              <a href="/terms" className="text-satrf-lightBlue hover:text-satrf-navy">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-satrf-lightBlue hover:text-satrf-navy">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 