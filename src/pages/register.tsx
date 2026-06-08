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
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Text,
  VStack,
  Link as ChakraLink,
  Progress,
  Icon,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FiLock, FiXCircle, FiAlertTriangle } from 'react-icons/fi';
import { useAuth, useRedirectIfAuthenticated } from '../contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { UserRegistrationData, passwordValidator } from '../lib/auth';
import AuthPageLayout, { AuthHeaderIcon } from '@/components/auth/AuthPageLayout';

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  useRedirectIfAuthenticated();

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

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (formData.password) {
      const validation = passwordValidator.validatePassword(formData.password);
      setPasswordValidation(validation);
    }
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);

    if (formErrors.confirmPassword) {
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    } else if (formData.firstName.trim().length > 50) {
      errors.firstName = 'First name must be less than 50 characters';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    } else if (formData.lastName.trim().length > 50) {
      errors.lastName = 'Last name must be less than 50 characters';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!passwordValidator.validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordValidation.isValid) {
      errors.password = 'Password does not meet requirements';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (!passwordValidator.validatePasswordMatch(formData.password, confirmPassword)) {
      errors.confirmPassword = 'Passwords do not match';
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await register(formData);
    if (success) {
      router.push('/login?registered=pending');
    }
  };

  const getPasswordStrengthColor = () => {
    if (!formData.password) return 'gray';
    if (passwordValidation.errors.length > 2) return 'red';
    if (passwordValidation.errors.length > 0) return 'orange';
    if (passwordValidation.warnings.length > 0) return 'blue';
    return 'green';
  };

  const getPasswordStrengthText = () => {
    if (!formData.password) return 'Enter password';
    if (passwordValidation.errors.length > 2) return 'Very Weak';
    if (passwordValidation.errors.length > 0) return 'Weak';
    if (passwordValidation.warnings.length > 0) return 'Good';
    return 'Strong';
  };

  const strengthValue = formData.password
    ? Math.max(25, 100 - passwordValidation.errors.length * 25)
    : 0;

  return (
    <>
      <Head>
        <title>Register - SATRF</title>
        <meta
          name="description"
          content="Create your SATRF account to access shooting scores and events"
        />
      </Head>

      <AuthPageLayout
        title="Create Account"
        subtitle="Join the South African Target Rifle Federation"
        headerIcon={
          <AuthHeaderIcon>
            <Icon as={FiLock} boxSize={5} aria-hidden />
          </AuthHeaderIcon>
        }
      >
        {error && (
          <Alert status="error" borderRadius="md" fontSize="sm">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isInvalid={!!formErrors.firstName} isRequired>
                <FormLabel htmlFor="firstName">First Name</FormLabel>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                />
                {formErrors.firstName && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formErrors.firstName}
                  </Text>
                )}
              </FormControl>

              <FormControl isInvalid={!!formErrors.lastName} isRequired>
                <FormLabel htmlFor="lastName">Last Name</FormLabel>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                />
                {formErrors.lastName && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {formErrors.lastName}
                  </Text>
                )}
              </FormControl>
            </SimpleGrid>

            <FormControl isInvalid={!!formErrors.email} isRequired>
              <FormLabel htmlFor="email">Email Address</FormLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleInputChange}
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
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
              />
              {formData.password && (
                <Box mt={2}>
                  <Progress
                    value={strengthValue}
                    size="xs"
                    colorScheme={getPasswordStrengthColor()}
                    borderRadius="full"
                    aria-label="Password strength"
                  />
                  <Text fontSize="xs" color="text.muted" mt={1}>
                    {getPasswordStrengthText()}
                  </Text>
                  {(passwordValidation.errors.length > 0 || passwordValidation.warnings.length > 0) && (
                    <List spacing={0.5} mt={2}>
                      {passwordValidation.errors.map((msg, index) => (
                        <ListItem key={`e-${index}`} fontSize="xs" color="red.500" display="flex" alignItems="flex-start">
                          <ListIcon as={FiXCircle} color="red.500" mt={0.5} />
                          {msg}
                        </ListItem>
                      ))}
                      {passwordValidation.warnings.map((msg, index) => (
                        <ListItem key={`w-${index}`} fontSize="xs" color="satrf.gold.700" display="flex" alignItems="flex-start">
                          <ListIcon as={FiAlertTriangle} color="satrf.gold.600" mt={0.5} />
                          {msg}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              )}
              {formErrors.password && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {formErrors.password}
                </Text>
              )}
            </FormControl>

            <FormControl isInvalid={!!formErrors.confirmPassword} isRequired>
              <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm password"
              />
              {formErrors.confirmPassword && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {formErrors.confirmPassword}
                </Text>
              )}
            </FormControl>

            <FormControl isRequired>
              <FormLabel htmlFor="membershipType">Membership Type</FormLabel>
              <Select
                id="membershipType"
                name="membershipType"
                value={formData.membershipType}
                onChange={handleInputChange}
              >
                <option value="junior">Junior</option>
                <option value="senior">Senior</option>
                <option value="veteran">Veteran</option>
              </Select>
            </FormControl>

            <FormControl isInvalid={!!formErrors.club} isRequired>
              <FormLabel htmlFor="club">Club Name</FormLabel>
              <Input
                id="club"
                name="club"
                value={formData.club}
                onChange={handleInputChange}
                placeholder="Enter club name"
              />
              {formErrors.club && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {formErrors.club}
                </Text>
              )}
            </FormControl>

            <Button
              type="submit"
              variant="satrf"
              size="lg"
              w="full"
              isLoading={isLoading}
              loadingText="Creating Account..."
            >
              Create Account
            </Button>
          </VStack>
        </Box>

        <Text textAlign="center" fontSize="sm" color="text.muted">
          Already have an account?{' '}
          <ChakraLink
            as={Link}
            href="/login"
            fontWeight="semibold"
            color="satrf.green.700"
            _hover={{ color: 'satrf.gold.600' }}
          >
            Sign in here
          </ChakraLink>
        </Text>
      </AuthPageLayout>
    </>
  );
};

export default RegisterPage;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
