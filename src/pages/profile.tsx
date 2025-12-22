import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useAuth, useProtectedRoute } from '../contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { UserProfileUpdate } from '../lib/auth';

const ProfilePage: NextPage = () => {
  const { user, updateProfile, isLoading, error, clearError } = useAuth();
  
  // Protect this route
  useProtectedRoute();

  // Form state
  const [formData, setFormData] = useState<UserProfileUpdate>({
    firstName: '',
    lastName: '',
    membershipType: 'senior',
    club: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        membershipType: user.membershipType || 'senior',
        club: user.club || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
      });
    }
  }, [user]);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    // First name validation
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (formData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be less than 50 characters';
    }

    // Last name validation
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (formData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be less than 50 characters';
    }

    // Club validation
    if (!formData.club?.trim()) {
      errors.club = 'Club name is required';
    } else if (formData.club.trim().length < 2) {
      errors.club = 'Club name must be at least 2 characters';
    } else if (formData.club.trim().length > 100) {
      errors.club = 'Club name must be less than 100 characters';
    }

    // Phone number validation (optional)
    if (formData.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Please enter a valid phone number';
    }

    // Emergency phone validation (optional)
    if (formData.emergencyPhone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.emergencyPhone.replace(/\s/g, ''))) {
      errors.emergencyPhone = 'Please enter a valid phone number';
    }

    // Date of birth validation (optional)
    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      const now = new Date();
      if (date > now) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      }
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

    const success = await updateProfile(formData);
    if (success) {
      setUpdateSuccess(true);
      setIsEditing(false);
      setTimeout(() => setUpdateSuccess(false), 3000);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        membershipType: user.membershipType || 'senior',
        club: user.club || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: user.dateOfBirth || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
      });
    }
    setFormErrors({});
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-cyan mx-auto mb-4"></div>
          <p className="text-gray-300 font-oxanium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - SATRF</title>
        <meta name="description" content="Manage your SATRF profile and account settings" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-midnight-steel via-midnight-dark to-midnight-light">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-oxanium font-bold text-electric-cyan mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-300 font-oxanium">
              Manage your account information and preferences
            </p>
          </div>

          {/* Success Alert */}
          {updateSuccess && (
            <div className="mb-6 bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-oxanium">Profile updated successfully!</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
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

          {/* Profile Form */}
          <div className="bg-midnight-light/30 rounded-lg border border-gray-600 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
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
                      disabled={!isEditing}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.lastName ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="Enter last name"
                    />
                    {formErrors.lastName && (
                      <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="membershipType" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Membership Type *
                    </label>
                    <select
                      id="membershipType"
                      name="membershipType"
                      required
                      disabled={!isEditing}
                      value={formData.membershipType}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 border rounded-lg text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="junior">Junior</option>
                      <option value="senior">Senior</option>
                      <option value="veteran">Veteran</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="club" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Club Name *
                    </label>
                    <input
                      id="club"
                      name="club"
                      type="text"
                      required
                      disabled={!isEditing}
                      value={formData.club}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.club ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="Enter club name"
                    />
                    {formErrors.club && (
                      <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.club}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      disabled={!isEditing}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="Enter phone number"
                    />
                    {formErrors.phoneNumber && (
                      <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.phoneNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Date of Birth
                    </label>
                    <input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      disabled={!isEditing}
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.dateOfBirth}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="address" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    disabled={!isEditing}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    placeholder="Enter your address"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emergencyContact" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      id="emergencyContact"
                      name="emergencyContact"
                      type="text"
                      disabled={!isEditing}
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter emergency contact name"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergencyPhone" className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      type="tel"
                      disabled={!isEditing}
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      className={`appearance-none relative block w-full px-3 py-3 border rounded-lg placeholder-gray-400 text-gray-100 bg-midnight-light/50 border-gray-600 focus:outline-none focus:ring-2 focus:ring-electric-cyan focus:border-transparent font-oxanium disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.emergencyPhone ? 'border-red-500 focus:ring-red-500' : ''
                      }`}
                      placeholder="Enter emergency contact phone"
                    />
                    {formErrors.emergencyPhone && (
                      <p className="mt-1 text-sm text-red-400 font-oxanium">{formErrors.emergencyPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information (Read-only) */}
              <div>
                <h3 className="text-lg font-oxanium font-medium text-electric-cyan mb-4">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="appearance-none relative block w-full px-3 py-3 border rounded-lg text-gray-400 bg-midnight-light/30 border-gray-600 font-oxanium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Member Since
                    </label>
                    <input
                      type="text"
                      value={new Date(user.createdAt).toLocaleDateString()}
                      disabled
                      className="appearance-none relative block w-full px-3 py-3 border rounded-lg text-gray-400 bg-midnight-light/30 border-gray-600 font-oxanium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Last Login
                    </label>
                    <input
                      type="text"
                      value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      disabled
                      className="appearance-none relative block w-full px-3 py-3 border rounded-lg text-gray-400 bg-midnight-light/30 border-gray-600 font-oxanium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-oxanium font-medium text-gray-300 mb-2">
                      Login Count
                    </label>
                    <input
                      type="text"
                      value={user.loginCount.toString()}
                      disabled
                      className="appearance-none relative block w-full px-3 py-3 border rounded-lg text-gray-400 bg-midnight-light/30 border-gray-600 font-oxanium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 bg-electric-cyan text-midnight-steel font-oxanium font-medium rounded-lg hover:bg-electric-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-cyan transition-all duration-200"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-600 text-gray-200 font-oxanium font-medium rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-electric-cyan text-midnight-steel font-oxanium font-medium rounded-lg hover:bg-electric-neon focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-electric-cyan disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

// Make this page server-side rendered to avoid useAuth issues during static generation
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
}; 