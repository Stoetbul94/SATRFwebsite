import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {
  Alert,
  AlertIcon,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  VStack,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { FiMail } from 'react-icons/fi';
import { useRedirectIfAuthenticated } from '../contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import AuthPageLayout, { AuthHeaderIcon } from '@/components/auth/AuthPageLayout';
import { Icon } from '@chakra-ui/react';

const ForgotPasswordPage: NextPage = () => {
  useRedirectIfAuthenticated();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!email || !email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setIsSubmitting(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.toLowerCase().trim());
      setMessage({
        type: 'success',
        text: 'Password reset email sent! Check your inbox (and spam). Use the link in the email, then sign in with your new password.',
      });
      setEmail('');
    } catch (error: unknown) {
      const err = error as { code?: string };
      console.error('Password reset error:', err);

      let errorMessage = 'Failed to send password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        errorMessage =
          'No account found with this email in Firebase Auth. Use Firebase Console → Authentication → reset password for that user.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Wait a few minutes and try again.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Check your connection and try again.';
      }

      setMessage({ type: 'error', text: errorMessage });
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

      <AuthPageLayout
        title="Reset password"
        subtitle="Enter your email and we'll send you a link to choose a new password."
        headerIcon={
          <AuthHeaderIcon>
            <Icon as={FiMail} boxSize={5} />
          </AuthHeaderIcon>
        }
      >
        {message && (
          <Alert status={message.type === 'success' ? 'success' : 'error'} borderRadius="md">
            <AlertIcon />
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel color="text.primary">Email address</FormLabel>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                isDisabled={isSubmitting}
                placeholder="you@example.com"
                size="lg"
              />
            </FormControl>

            <Button
              type="submit"
              variant="satrf"
              size="lg"
              w="full"
              isLoading={isSubmitting}
              loadingText="Sending…"
            >
              Send reset link
            </Button>
          </VStack>
        </form>

        <Text textAlign="center" fontSize="sm" color="text.muted">
          Remember your password?{' '}
          <ChakraLink as={Link} href="/login" color="satrf.green.700" fontWeight="semibold">
            Sign in
          </ChakraLink>
        </Text>
      </AuthPageLayout>
    </>
  );
};

export default ForgotPasswordPage;
