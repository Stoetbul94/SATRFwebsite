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
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registrationSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  category: z.enum(['junior', 'senior', 'veteran']),
  club: z.string().min(2, 'Club name is required'),
  licenseNumber: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

// Mock event data - in a real app, this would come from an API
const MOCK_EVENT = {
  id: '1',
  title: 'National Championship 2024',
  date: 'March 15-17, 2024',
  location: 'Johannesburg Shooting Range',
  price: 500,
};

export default function EventRegistration() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    try {
      // In a real application, this would:
      // 1. Create a registration record in the database
      // 2. Generate a PayFast payment URL
      // 3. Redirect to PayFast for payment

      // Mock successful registration
      toast({
        title: 'Registration successful',
        description: 'Redirecting to payment...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Simulate PayFast redirect
      setTimeout(() => {
        // In a real app, this would be the PayFast payment URL
        window.location.href = 'https://sandbox.payfast.co.za/eng/process';
      }, 2000);
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: 'Please try again later',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Register for {MOCK_EVENT.title}
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Complete the form below to register for this event
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

                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input type="email" {...register('email')} />
                  {errors.email && (
                    <Text color="red.500">{errors.email.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.phone}>
                  <FormLabel>Phone Number</FormLabel>
                  <Input type="tel" {...register('phone')} />
                  {errors.phone && (
                    <Text color="red.500">{errors.phone.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.category}>
                  <FormLabel>Category</FormLabel>
                  <Select {...register('category')}>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="veteran">Veteran</option>
                  </Select>
                  {errors.category && (
                    <Text color="red.500">{errors.category.message}</Text>
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
                  <FormLabel>License Number (Optional)</FormLabel>
                  <Input {...register('licenseNumber')} />
                </FormControl>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Entry Fee: R{MOCK_EVENT.price}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Payment will be processed through PayFast
                  </Text>
                </Box>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={isSubmitting}
                >
                  Proceed to Payment
                </Button>
              </Stack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
} 