import React from 'react';
import { Box, Container, VStack, Heading, Text, SimpleGrid, Icon, useColorModeValue } from '@chakra-ui/react';
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import ContactForm from '@/components/ContactForm';

const ContactPage: React.FC = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  const contactInfo = [
    {
      icon: FiMail,
      title: 'Email',
      content: 'support@satrf.org.za',
      description: 'Send us an email anytime',
    },
    {
      icon: FiPhone,
      title: 'Phone',
      content: '+27 (0) 11 123 4567',
      description: 'Mon-Fri from 8am to 5pm',
    },
    {
      icon: FiMapPin,
      title: 'Address',
      content: 'Johannesburg, South Africa',
      description: 'SATRF Headquarters',
    },
    {
      icon: FiClock,
      title: 'Response Time',
      content: '24-48 hours',
      description: 'During business days',
    },
  ];

  return (
    <Layout>
      <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="stretch">
            {/* Header Section */}
            <Box textAlign="center" py={8}>
              <Heading size="2xl" mb={4} color="brand.600">
                Get in Touch
              </Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl" mx="auto">
                Have a question, need technical support, or want to report an issue? 
                We're here to help you get the most out of your SATRF experience.
              </Text>
            </Box>

            {/* Contact Information Cards */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
              {contactInfo.map((info, index) => (
                <Box
                  key={index}
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  boxShadow="md"
                  textAlign="center"
                  transition="transform 0.2s"
                  _hover={{ transform: 'translateY(-2px)' }}
                >
                  <Icon
                    as={info.icon}
                    w={8}
                    h={8}
                    color="brand.500"
                    mb={4}
                  />
                  <Heading size="md" mb={2}>
                    {info.title}
                  </Heading>
                  <Text fontSize="lg" fontWeight="semibold" mb={2}>
                    {info.content}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {info.description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            {/* Contact Form */}
            <ContactForm showTitle={false} />
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
};

export default ContactPage; 