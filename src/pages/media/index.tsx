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
import { FaImages, FaClock, FaVideo, FaFilePdf } from 'react-icons/fa';

/**
 * Media Library Page - Coming Soon
 * 
 * TODO: Future Firebase Integration
 * - Set up Firebase Storage for media files
 * - Implement file upload with progress tracking
 * - Create Firestore collection for media metadata
 * - Add image/document organization and categorization
 * - Implement admin upload/moderation tools
 * - Add public/private access control
 * - Create gallery views with lightbox
 * - Add video support and streaming
 * - Implement file deletion and management
 * - Add search and filtering capabilities
 */

export default function Media() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Layout>
      <Head>
        <title>Media Gallery - Coming Soon | SATRF</title>
        <meta name="description" content="SATRF media gallery - coming soon. Browse event photos, videos, and documents." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <Box bg={bgColor} minH="calc(100vh - 200px)" py={16}>
        <Container maxW="container.md">
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={8}>
              <Icon
                as={FaImages}
                w={16}
                h={16}
                color="blue.500"
                mb={6}
              />
              <Heading size="2xl" mb={4} color={headingColor}>
                Media Gallery Coming Soon
              </Heading>
              <Text fontSize="xl" color={textColor} maxW="2xl" mx="auto">
                We're building a comprehensive media library to showcase event photos, 
                videos, and documents from SATRF competitions and activities.
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
                  The SATRF media gallery is currently under development and will be available 
                  in a future release. This will include:
                </Text>

                <Box
                  as="ul"
                  textAlign="left"
                  color={textColor}
                  maxW="md"
                  mx="auto"
                  sx={{
                    '& li': {
                      mb: 3,
                      pl: 2,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 3,
                    },
                  }}
                >
                  <li>
                    <Icon as={FaImages} w={5} h={5} color="blue.400" mt={0.5} flexShrink={0} />
                    <span>Event photo galleries from competitions and training sessions</span>
                  </li>
                  <li>
                    <Icon as={FaVideo} w={5} h={5} color="blue.400" mt={0.5} flexShrink={0} />
                    <span>Video highlights and recordings of major events</span>
                  </li>
                  <li>
                    <Icon as={FaFilePdf} w={5} h={5} color="blue.400" mt={0.5} flexShrink={0} />
                    <span>Event documents, results sheets, and official publications</span>
                  </li>
                  <li>
                    <span>Organized by event, date, and category for easy browsing</span>
                  </li>
                  <li>
                    <span>High-quality image viewing with lightbox functionality</span>
                  </li>
                </Box>

                <Box
                  mt={6}
                  p={4}
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderRadius="md"
                  w="100%"
                >
                  <Text fontSize="sm" color={useColorModeValue('blue.800', 'blue.200')}>
                    <strong>Stay tuned!</strong> We'll announce when the media gallery is ready 
                    for launch. In the meantime, check out our{' '}
                    <a
                      href="/events"
                      style={{ textDecoration: 'underline' }}
                    >
                      events page
                    </a>
                    {' '}for upcoming competitions.
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