import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Link,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import NextLink from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = (document.getElementById('email') as HTMLInputElement).value;
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter your email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password reset email sent',
        description: 'Check your email for reset instructions',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Sign In
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Welcome back to SATRF
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
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                  />
                  {errors.email && (
                    <Text color="red.500">{errors.email.message}</Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    type="password"
                    {...register('password')}
                  />
                  {errors.password && (
                    <Text color="red.500">{errors.password.message}</Text>
                  )}
                </FormControl>

                <Button
                  variant="link"
                  colorScheme="blue"
                  size="sm"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </Button>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={isSubmitting}
                >
                  Sign In
                </Button>

                <Text textAlign="center">
                  Don't have an account?{' '}
                  <Link as={NextLink} href="/register" color="blue.500">
                    Register here
                  </Link>
                </Text>
              </Stack>
            </form>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
} 