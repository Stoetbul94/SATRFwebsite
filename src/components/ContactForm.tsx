import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  VStack,
  HStack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Container,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum(['general', 'technical', 'billing', 'bug', 'feature', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  userAgent: z.string().optional(),
  pageUrl: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
  onSuccess?: () => void;
  showTitle?: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSuccess, showTitle = true }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      category: 'general',
      priority: 'medium',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Send to backend API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Message sent successfully!',
          description: 'We will get back to you as soon as possible.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Capture successful submission in Sentry for analytics
        Sentry.addBreadcrumb({
          category: 'contact_form',
          message: 'Contact form submitted successfully',
          level: 'info',
          data: {
            category: data.category,
            priority: data.priority,
            subject: data.subject,
          },
        });

        reset();
        onSuccess?.();
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      // Capture error in Sentry
      Sentry.captureException(error, {
        tags: {
          component: 'ContactForm',
          action: 'submit',
        },
        extra: {
          formData: data,
        },
      });

      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.'
      );

      toast({
        title: 'Failed to send message',
        description: 'Please try again or contact us directly.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      {showTitle && (
        <Box textAlign="center" mb={8}>
          <Heading size="lg" mb={2}>
            Contact Support
          </Heading>
          <Text color="gray.600">
            We're here to help! Send us a message and we'll respond as soon as possible.
          </Text>
        </Box>
      )}

      <Box
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        bg="white"
        p={6}
        borderRadius="lg"
        boxShadow="md"
      >
        {submitError && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>Submission Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Box>
          </Alert>
        )}

        <VStack spacing={4} align="stretch">
          <HStack spacing={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormLabel>Name *</FormLabel>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Your full name"
                    bg="gray.50"
                    _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  />
                )}
              />
              {errors.name && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.name.message}
                </Text>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email *</FormLabel>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    placeholder="your.email@example.com"
                    bg="gray.50"
                    _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  />
                )}
              />
              {errors.email && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.email.message}
                </Text>
              )}
            </FormControl>
          </HStack>

          <FormControl isInvalid={!!errors.subject}>
            <FormLabel>Subject *</FormLabel>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Brief description of your issue or question"
                  bg="gray.50"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                />
              )}
            />
            {errors.subject && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.subject.message}
              </Text>
            )}
          </FormControl>

          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Category</FormLabel>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    bg="gray.50"
                    _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature">Feature Request</option>
                    <option value="other">Other</option>
                  </Select>
                )}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Priority</FormLabel>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    bg="gray.50"
                    _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Select>
                )}
              />
            </FormControl>
          </HStack>

          <FormControl isInvalid={!!errors.message}>
            <FormLabel>Message *</FormLabel>
            <Controller
              name="message"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="Please provide detailed information about your issue or question..."
                  rows={6}
                  bg="gray.50"
                  _focus={{ bg: 'white', borderColor: 'brand.500' }}
                  resize="vertical"
                />
              )}
            />
            {errors.message && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.message.message}
              </Text>
            )}
          </FormControl>

          <Box>
            <Text fontSize="sm" color="gray.600" mb={2}>
              Help us help you faster:
            </Text>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="blue" variant="subtle">
                Include screenshots if relevant
              </Badge>
              <Badge colorScheme="green" variant="subtle">
                Describe steps to reproduce
              </Badge>
              <Badge colorScheme="purple" variant="subtle">
                Mention your browser/device
              </Badge>
            </HStack>
          </Box>

          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Sending..."
            disabled={isSubmitting}
          >
            Send Message
          </Button>

          <Text fontSize="xs" color="gray.500" textAlign="center">
            By submitting this form, you agree to our privacy policy. 
            We typically respond within 24-48 hours during business days.
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default ContactForm; 