import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  VStack,
  Text,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Code,
} from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { isEmailAdmin } from '@/lib/adminClient';

/**
 * Utility page to set admin role for whitelisted emails
 * This page helps users with whitelisted emails get admin access
 * by updating their Firestore role
 */
export default function SetAdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    // Check if user is already admin
    if (user.role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    setChecking(false);
  }, [user, isAuthenticated, router]);

  const handleSetAdmin = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Call auto-promote API (works for whitelisted emails without needing admin access)
      const response = await fetch('/api/admin/auto-promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Admin role set successfully! Redirecting...',
          status: 'success',
          duration: 3000,
        });
        
        // Refresh user data
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 1500);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to set admin role' }));
        throw new Error(errorData.error || 'Failed to set admin role');
      }
    } catch (error: any) {
      console.error('Error setting admin role:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set admin role. You may need to set it manually in Firestore.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking || !isAuthenticated || !user) {
    return (
      <Layout>
        <Center minH="50vh">
          <Spinner size="xl" color="blue.500" />
        </Center>
      </Layout>
    );
  }

  const isEmailWhitelisted = isEmailAdmin(user.email);

  return (
    <Layout>
      <Box maxW="600px" mx="auto" p={8}>
        <VStack spacing={6} align="stretch">
          <Text fontSize="2xl" fontWeight="bold">
            Admin Access Setup
          </Text>

          <Box>
            <Text mb={2}>
              <strong>Email:</strong> {user.email}
            </Text>
            <Text mb={2}>
              <strong>Current Role:</strong> {user.role || 'user'}
            </Text>
            <Text mb={2}>
              <strong>Email Whitelisted:</strong> {isEmailWhitelisted ? 'Yes' : 'No'}
            </Text>
          </Box>

          {isEmailWhitelisted ? (
            <>
              <Alert status="info">
                <AlertIcon />
                Your email is in the admin whitelist. Click the button below to set your admin role in Firestore.
              </Alert>

              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleSetAdmin}
                isLoading={loading}
                loadingText="Setting Admin Role..."
              >
                Set Admin Role
              </Button>

              <Text fontSize="sm" color="gray.600">
                This will update your role in Firestore to 'admin' and grant you access to the admin dashboard.
              </Text>
            </>
          ) : (
            <Alert status="warning">
              <AlertIcon />
              Your email is not in the admin whitelist. Please contact an administrator to request access.
            </Alert>
          )}

          <Box mt={4} p={4} bg="gray.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="semibold" mb={2}>
              Manual Setup (Alternative):
            </Text>
            <Text fontSize="xs" color="gray.600" mb={2}>
              If the button above doesn't work, you can manually set your role in Firestore:
            </Text>
            <Code fontSize="xs" p={2} display="block">
              1. Go to Firebase Console → Firestore
              <br />
              2. Navigate to users collection
              <br />
              3. Find your user document (ID: {user.id})
              <br />
              4. Set the 'role' field to 'admin'
            </Code>
          </Box>
        </VStack>
      </Box>
    </Layout>
  );
}

