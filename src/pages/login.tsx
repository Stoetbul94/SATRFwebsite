import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Link as ChakraLink,
  Text,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth, useRedirectIfAuthenticated } from '../contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { isProfileAdmin } from '@/lib/auth';
import { isUserAdmin } from '@/lib/userRole';
import { resolvePostLoginPath } from '@/lib/userAthlete';
import AuthPageLayout, { AuthHeaderIcon } from '@/components/auth/AuthPageLayout';
import { markPostLoginSessionFlag } from '@/lib/pwa/installUtils';

const isAdminUser = (user: { role?: string; email?: string; roles?: { admin?: boolean }; admin?: boolean }) =>
  isUserAdmin(user) || isProfileAdmin(user as Parameters<typeof isProfileAdmin>[0]);

const LoginPage: NextPage = () => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();

  useRedirectIfAuthenticated();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const loggedInUser = await login(formData.email, formData.password);

      if (loggedInUser) {
        const dest = resolvePostLoginPath(
          loggedInUser,
          (router.query.redirect as string) || undefined
        );

        const token =
          typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (token) {
          const secure = window.location.protocol === 'https:' ? '; Secure' : '';
          const maxAge = 7 * 24 * 60 * 60;
          document.cookie = `access_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
          document.cookie = `auth_token=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
        }
        markPostLoginSessionFlag();
        window.location.assign(dest);
        return;
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - SATRF</title>
        <meta name="description" content="Sign in to your SATRF account" />
      </Head>

      <AuthPageLayout
        title="Welcome Back"
        subtitle="Sign in to your SATRF account"
        headerIcon={
          <AuthHeaderIcon>
            <Icon as={FiLogIn} boxSize={5} aria-hidden />
          </AuthHeaderIcon>
        }
      >
        {router.query.registered === 'pending' && (
          <Alert status="success" borderRadius="md" fontSize="sm">
            <AlertIcon />
            Registration received. Your account is awaiting admin approval — you&apos;ll be able to
            sign in once approved.
          </Alert>
        )}

        {error && (
          <Alert status="error" borderRadius="md" fontSize="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box as="form" onSubmit={handleSubmit} noValidate>
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={!!formErrors.email} isRequired>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
                isDisabled={isSubmitting}
                placeholder="Enter email address"
              />
              {formErrors.email && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {formErrors.email}
                </Text>
              )}
            </FormControl>

            <FormControl isInvalid={!!formErrors.password} isRequired>
              <FormLabel htmlFor="password">Password</FormLabel>
              <InputGroup>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  isDisabled={isSubmitting}
                  placeholder="Enter password"
                  pr="3rem"
                />
                <InputRightElement>
                  <IconButton
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    icon={showPassword ? <FiEyeOff /> : <FiEye />}
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    isDisabled={isSubmitting}
                    tabIndex={-1}
                  />
                </InputRightElement>
              </InputGroup>
              {formErrors.password && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {formErrors.password}
                </Text>
              )}
            </FormControl>

            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Checkbox id="remember-me" name="remember-me" isDisabled={isSubmitting} colorScheme="green">
                Remember me
              </Checkbox>
              <ChakraLink
                as={Link}
                href="/forgot-password"
                fontSize="sm"
                fontWeight="medium"
                color="satrf.green.700"
                _hover={{ color: 'satrf.gold.600' }}
              >
                Forgot password?
              </ChakraLink>
            </Box>

            <Button
              type="submit"
              variant="satrf"
              size="lg"
              w="full"
              isLoading={isSubmitting || isLoading}
              loadingText="Signing In..."
              aria-label={isSubmitting || isLoading ? 'Signing In' : 'Sign In'}
            >
              Sign In
            </Button>

            <Text textAlign="center" fontSize="sm" color="text.muted">
              Don&apos;t have an account?{' '}
              <ChakraLink
                as={Link}
                href="/register"
                fontWeight="semibold"
                color="satrf.green.700"
                _hover={{ color: 'satrf.gold.600' }}
              >
                Create one here
              </ChakraLink>
            </Text>
          </VStack>
        </Box>
      </AuthPageLayout>
    </>
  );
};

export default LoginPage;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
