import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  HStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

// Phone validation: allows international format with + prefix (e.g., +27, +1, etc.)
const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{0,20}$/;

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  membershipType: z.enum(['junior', 'senior', 'veteran']),
  club: z.string().min(2, 'Club name is required'),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || phoneRegex.test(val.replace(/\s/g, '')),
      'Please enter a valid phone number (e.g., +27 12 345 6789)'
    ),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfile() {
  // All useColorModeValue calls must be at the very top, before any other hooks
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('white', 'gray.700');
  
  const router = useRouter();
  const toast = useToast();
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Load user data when available
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        membershipType: user.membershipType || 'senior',
        club: user.club || '',
        phone: user.phone || user.phoneNumber || '',
        address: user.address || '',
      });
      setIsLoading(false);
    }
  }, [user, authLoading, router, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to update your profile',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    setSaveSuccess(false);

    try {
      // Use AuthContext's updateProfile to maintain auth state
      const success = await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        membershipType: data.membershipType,
        club: data.club,
        phone: data.phone || undefined,
        phoneNumber: data.phone || undefined, // Support both field names
        address: data.address || undefined,
      });

      if (success) {
        setSaveSuccess(true);
        toast({
          title: 'Profile updated successfully',
          description: 'Your profile changes have been saved',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Delay navigation slightly to show success message
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Text>Loading...</Text>
        </Container>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Edit Profile
            </Heading>
            <Text color={textColorSecondary}>
              Update your personal information
            </Text>
          </Box>

          {saveSuccess && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box flex={1}>
                <Text fontWeight="bold">Profile updated successfully!</Text>
                <Text fontSize="sm">Redirecting to dashboard...</Text>
              </Box>
            </Alert>
          )}

          <Box
            bg={cardBg}
            p={8}
            rounded="lg"
            shadow="md"
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={6}>
                <FormControl isInvalid={!!errors.firstName}>
                  <FormLabel>First Name</FormLabel>
                  <Input {...register('firstName')} />
                  {errors.firstName && (
                    <Text color="red.500" fontSize="sm">{errors.firstName.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.lastName}>
                  <FormLabel>Last Name</FormLabel>
                  <Input {...register('lastName')} />
                  {errors.lastName && (
                    <Text color="red.500" fontSize="sm">{errors.lastName.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.membershipType}>
                  <FormLabel>Membership Type</FormLabel>
                  <Select {...register('membershipType')}>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="veteran">Veteran</option>
                  </Select>
                  {errors.membershipType && (
                    <Text color="red.500" fontSize="sm">{errors.membershipType.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.club}>
                  <FormLabel>Club</FormLabel>
                  <Input {...register('club')} />
                  {errors.club && (
                    <Text color="red.500" fontSize="sm">{errors.club.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.phone}>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <Input 
                    type="tel" 
                    placeholder="+27 12 345 6789"
                    {...register('phone')} 
                  />
                  {errors.phone && (
                    <Text color="red.500" fontSize="sm">{errors.phone.message}</Text>
                  )}
                  <Text fontSize="xs" color={textColorSecondary} mt={1}>
                    International format accepted (e.g., +27 12 345 6789)
                  </Text>
                </FormControl>

                <FormControl>
                  <FormLabel>Address (Optional)</FormLabel>
                  <Input {...register('address')} />
                </FormControl>

                <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    isLoading={isSubmitting}
                    loadingText="Saving..."
                    flex={1}
                    isDisabled={saveSuccess}
                  >
                    {saveSuccess ? 'Saved!' : 'Save Changes'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/profile')}
                    flex={1}
                    isDisabled={isSubmitting || saveSuccess}
                  >
                    Cancel
                  </Button>
                </Stack>

                {saveSuccess && (
                  <HStack spacing={4} justify="center" mt={4}>
                    <Button
                      colorScheme="green"
                      variant="solid"
                      onClick={() => router.push('/dashboard')}
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push('/profile')}
                    >
                      View Profile
                    </Button>
                  </HStack>
                )}
              </Stack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
} 