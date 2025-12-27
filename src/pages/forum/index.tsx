import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  VStack,
  Icon,
} from '@chakra-ui/react';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import { FaComments, FaClock } from 'react-icons/fa';

/**
 * Forum Page - Coming Soon
 * 
 * TODO: Future Firebase Integration
 * - Set up Firestore collection for forum posts
 * - Implement Firebase Auth for user authentication
 * - Create post creation/editing/deletion functionality
 * - Add comment/reply system
 * - Implement likes/bookmarks with real-time updates
 * - Add category filtering and search
 * - Set up moderation tools for admins
 * - Add notification system for replies/mentions
 */

export default function Forum() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Layout>
      <Head>
        <title>Forum - Coming Soon | SATRF</title>
        <meta name="description" content="SATRF community forum - coming soon. Connect with fellow members and discuss shooting sports." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Box bg={bgColor} minH="calc(100vh - 200px)" py={16}>
        <Container maxW="container.md">
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={8}>
              <Icon
                as={FaComments}
                w={16}
                h={16}
                color="blue.500"
                mb={6}
              />
              <Heading size="2xl" mb={4} color={headingColor}>
                Forum Coming Soon
              </Heading>
              <Text fontSize="xl" color={textColor} maxW="2xl" mx="auto">
                We're building a community forum where SATRF members can connect, 
                share experiences, and discuss all things related to target rifle shooting.
              </Text>
            </Box>

            {/* Coming Soon Card */}
            <Box
              bg={cardBg}
              p={8}
              borderRadius="lg"
              boxShadow="md"
              textAlign="center"
            >
              <VStack spacing={6}>
                <Icon
                  as={FaClock}
                  w={12}
                  h={12}
                  color="blue.400"
                />
                <Heading size="lg" color={headingColor}>
                  Under Development
                </Heading>
                <Text color={textColor} maxW="md" mx="auto">
                  The SATRF forum is currently under development and will be available 
                  in a future release. This will be a space for members to:
                </Text>

                <Box
                  as="ul"
                  textAlign="left"
                  color={textColor}
                  maxW="md"
                  mx="auto"
                  sx={{
                    '& li': {
                      mb: 2,
                      pl: 2,
                    },
                  }}
                >
                  <li>Share training tips and techniques</li>
                  <li>Discuss equipment and gear</li>
                  <li>Connect with fellow shooters</li>
                  <li>Ask questions and get advice</li>
                  <li>Discuss upcoming events and competitions</li>
                  <li>Share achievements and celebrate successes</li>
                </Box>

                <Box
                  mt={6}
                  p={4}
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderRadius="md"
                  w="100%"
                >
                  <Text fontSize="sm" color={useColorModeValue('blue.800', 'blue.200')}>
                    <strong>Stay tuned!</strong> We'll announce when the forum is ready 
                    for launch. In the meantime, feel free to reach out through our{' '}
                    <a
                      href="/contact"
                      style={{ textDecoration: 'underline' }}
                    >
                      contact page
                    </a>
                    .
                  </Text>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
} 