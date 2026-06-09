import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  CheckboxGroup,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  Link as ChakraLink,
  Select,
  SimpleGrid,
  Stack,
  Text,
  useToast,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import FlagStripe from '@/components/brand/FlagStripe';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useProtectedRoute } from '@/contexts/AuthContext';
import {
  SA_PROVINCES,
  SHOOTING_DISCIPLINES,
  validateDateOfBirth,
  validatePhone,
} from '@/lib/memberFields';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  membershipType: z.enum(['junior', 'senior', 'veteran']),
  club: z.string().min(2, 'Club name is required'),
  province: z.string().min(1, 'Province is required'),
  dateOfBirth: z.string().refine((val) => !validateDateOfBirth(val), {
    message: 'Please enter a valid date of birth',
  }),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => validatePhone(val), 'Please enter a valid phone number'),
  disciplines: z.array(z.string()).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z
    .string()
    .optional()
    .refine((val) => !val?.trim() || validatePhone(val), {
      message: 'Please enter a valid phone number',
    }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const router = useRouter();
  const toast = useToast();
  const { user, updateProfile, isLoading: authLoading } = useAuth();
  useProtectedRoute();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      disciplines: [],
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      return;
    }

    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        membershipType: user.membershipType || 'senior',
        club: user.club || '',
        province: user.province || '',
        dateOfBirth: user.dateOfBirth || '',
        phone: user.phone || user.phoneNumber || '',
        disciplines: user.disciplines ?? [],
        address: user.address || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || '',
      });
      setIsLoading(false);
    }
  }, [user, authLoading, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    setSaveSuccess(false);

    try {
      const success = await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        membershipType: data.membershipType,
        club: data.club,
        province: data.province,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        phoneNumber: data.phone,
        disciplines: data.disciplines ?? [],
        address: data.address || undefined,
        emergencyContact: data.emergencyContact?.trim() || undefined,
        emergencyPhone: data.emergencyPhone?.trim() || undefined,
      });

      if (success) {
        setSaveSuccess(true);
        toast({
          title: 'Profile updated',
          description: 'Your changes have been saved.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setTimeout(() => router.push('/profile'), 1500);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error: any) {
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
        <Container maxW="container.md" py={12}>
          <Text color="text.muted">Loading profile…</Text>
        </Container>
      </Layout>
    );
  }

  if (!user) return null;

  return (
    <Layout>
      <Head>
        <title>Edit Profile - SATRF</title>
        <meta name="description" content="Update your SATRF member profile" />
      </Head>

      <Box bg="bg.canvas" minH="calc(100vh - 80px)" py={{ base: 8, md: 12 }}>
        <Container maxW="container.md">
          <VStack spacing={6} align="stretch">
            <ChakraLink
              as={Link}
              href="/dashboard"
              display="inline-flex"
              alignItems="center"
              gap={2}
              fontSize="sm"
              fontWeight="medium"
              color="satrf.green.700"
              _hover={{ color: 'satrf.gold.600', textDecoration: 'none' }}
              alignSelf="flex-start"
            >
              <Icon as={FiArrowLeft} boxSize={4} aria-hidden />
              Back to Dashboard
            </ChakraLink>

            <Box textAlign="center">
              <Heading size="lg" color="satrf.navy" fontFamily="heading">
                Edit Profile
              </Heading>
              <Text color="text.muted" mt={1}>
                Update your member information
              </Text>
            </Box>

            {saveSuccess && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                Profile saved. Redirecting…
              </Alert>
            )}

            <Card bg="bg.surface" borderWidth="1px" borderColor="border.subtle" shadow="md" overflow="hidden">
              <FlagStripe thickness={3} />
              <CardBody p={{ base: 6, md: 8 }}>
                <FormControl mb={6} isReadOnly>
                  <FormLabel>Email</FormLabel>
                  <Input value={user.email} bg="gray.50" _dark={{ bg: 'gray.800' }} />
                  <Text fontSize="xs" color="text.muted" mt={1}>
                    Email changes are not supported here — contact SATRF if you need to update it.
                  </Text>
                </FormControl>

                <Box as="form" onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={5}>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <FormControl isInvalid={!!errors.firstName} isRequired>
                        <FormLabel>First Name</FormLabel>
                        <Input {...register('firstName')} />
                        {errors.firstName && (
                          <Text color="red.500" fontSize="sm">{errors.firstName.message}</Text>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.lastName} isRequired>
                        <FormLabel>Last Name</FormLabel>
                        <Input {...register('lastName')} />
                        {errors.lastName && (
                          <Text color="red.500" fontSize="sm">{errors.lastName.message}</Text>
                        )}
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <FormControl isInvalid={!!errors.membershipType} isRequired>
                        <FormLabel>Membership Type</FormLabel>
                        <Select {...register('membershipType')}>
                          <option value="junior">Junior</option>
                          <option value="senior">Senior</option>
                          <option value="veteran">Veteran</option>
                        </Select>
                      </FormControl>

                      <FormControl isInvalid={!!errors.province} isRequired>
                        <FormLabel>Province / Region</FormLabel>
                        <Select {...register('province')} placeholder="Select province">
                          {SA_PROVINCES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </Select>
                        {errors.province && (
                          <Text color="red.500" fontSize="sm">{errors.province.message}</Text>
                        )}
                      </FormControl>
                    </SimpleGrid>

                    <FormControl isInvalid={!!errors.club} isRequired>
                      <FormLabel>Club</FormLabel>
                      <Input {...register('club')} />
                      {errors.club && (
                        <Text color="red.500" fontSize="sm">{errors.club.message}</Text>
                      )}
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <FormControl isInvalid={!!errors.dateOfBirth} isRequired>
                        <FormLabel>Date of Birth</FormLabel>
                        <Input type="date" {...register('dateOfBirth')} max={new Date().toISOString().split('T')[0]} />
                        {errors.dateOfBirth && (
                          <Text color="red.500" fontSize="sm">{errors.dateOfBirth.message}</Text>
                        )}
                      </FormControl>

                      <FormControl isInvalid={!!errors.phone} isRequired>
                        <FormLabel>Phone Number</FormLabel>
                        <Input type="tel" placeholder="+27 12 345 6789" {...register('phone')} />
                        {errors.phone && (
                          <Text color="red.500" fontSize="sm">{errors.phone.message}</Text>
                        )}
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel>Disciplines</FormLabel>
                      <Controller
                        name="disciplines"
                        control={control}
                        render={({ field }) => (
                          <CheckboxGroup value={field.value ?? []} onChange={field.onChange}>
                            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4} flexWrap="wrap">
                              {SHOOTING_DISCIPLINES.map((d) => (
                                <Checkbox key={d.id} value={d.id} colorScheme="green">
                                  {d.label}
                                </Checkbox>
                              ))}
                            </Stack>
                          </CheckboxGroup>
                        )}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Address (optional)</FormLabel>
                      <Input {...register('address')} />
                    </FormControl>

                    <Box>
                      <Heading size="sm" color="satrf.green.700" fontFamily="heading" mb={4}>
                        Emergency Contact
                      </Heading>
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                        <FormControl>
                          <FormLabel>Emergency Contact Name (optional)</FormLabel>
                          <Input {...register('emergencyContact')} />
                        </FormControl>

                        <FormControl isInvalid={!!errors.emergencyPhone}>
                          <FormLabel>Emergency Contact Phone (optional)</FormLabel>
                          <Input type="tel" placeholder="+27 12 345 6789" {...register('emergencyPhone')} />
                          {errors.emergencyPhone && (
                            <Text color="red.500" fontSize="sm">
                              {errors.emergencyPhone.message}
                            </Text>
                          )}
                        </FormControl>
                      </SimpleGrid>
                    </Box>

                    <HStack spacing={4} pt={2}>
                      <Button
                        type="submit"
                        variant="satrf"
                        size="lg"
                        flex={1}
                        isLoading={isSubmitting}
                        loadingText="Saving…"
                        isDisabled={saveSuccess}
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        flex={1}
                        onClick={() => router.push('/profile')}
                        isDisabled={isSubmitting || saveSuccess}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </Stack>
                </Box>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
}
