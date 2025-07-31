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
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  membershipType: z.enum(['junior', 'senior', 'veteran']),
  club: z.string().min(2, 'Club name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          reset({
            firstName: data.firstName,
            lastName: data.lastName,
            membershipType: data.membershipType,
            club: data.club,
            phone: data.phone || '',
            address: data.address || '',
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router, reset, toast]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    const user = auth.currentUser;
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      router.push('/profile');
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="container.xl" py={8}>
          <Text>Loading...</Text>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Edit Profile
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Update your personal information
            </Text>
          </Box>

          <Box
            bg={useColorModeValue('white', 'gray.700')}
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
                    <Text color="red.500">{errors.firstName.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.lastName}>
                  <FormLabel>Last Name</FormLabel>
                  <Input {...register('lastName')} />
                  {errors.lastName && (
                    <Text color="red.500">{errors.lastName.message}</Text>
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
                    <Text color="red.500">{errors.membershipType.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.club}>
                  <FormLabel>Club</FormLabel>
                  <Input {...register('club')} />
                  {errors.club && (
                    <Text color="red.500">{errors.club.message}</Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <Input type="tel" {...register('phone')} />
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
                    flex={1}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/profile')}
                    flex={1}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
} 