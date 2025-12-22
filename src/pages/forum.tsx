import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { FiMessageSquare, FiUsers, FiTrendingUp, FiLock } from 'react-icons/fi';
import Link from 'next/link';

export default function Forum() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.900', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.300');

  return (
    <>
      <Head>
        <title>Forum - SATRF</title>
        <meta name="description" content="Join the SATRF community forum to discuss target shooting, share experiences, and connect with fellow shooters." />
        <meta property="og:title" content="Forum - SATRF" />
        <meta property="og:description" content="Join the SATRF community forum to discuss target shooting, share experiences, and connect with fellow shooters." />
      </Head>

      <Layout>
        <Container maxW="container.xl" py={12}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={8}>
              <Heading as="h1" size="2xl" color={headingColor} mb={4}>
                SATRF Community Forum
              </Heading>
              <Text fontSize="xl" color={textColor} maxW="3xl" mx="auto">
                Connect with fellow shooters, share experiences, and discuss all things target rifle shooting
              </Text>
            </Box>

            <Divider />

            {/* Forum Information */}
            <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="xl" color={headingColor}>
                  Community Forum Coming Soon
                </Heading>
                
                <Text fontSize="lg" color={textColor} lineHeight="relaxed">
                  We&apos;re building an active community forum where SATRF members can:
                </Text>

                <VStack spacing={4} align="stretch" mt={4}>
                  <HStack spacing={4}>
                    <Icon as={FiMessageSquare} w={6} h={6} color="blue.500" />
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={1}>
                        Discuss Shooting Techniques
                      </Text>
                      <Text color={textColor} fontSize="sm">
                        Share tips, techniques, and best practices for improving your shooting performance
                      </Text>
                    </Box>
                  </HStack>

                  <HStack spacing={4}>
                    <Icon as={FiUsers} w={6} h={6} color="green.500" />
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={1}>
                        Connect with Members
                      </Text>
                      <Text color={textColor} fontSize="sm">
                        Network with fellow shooters, find training partners, and build lasting friendships
                      </Text>
                    </Box>
                  </HStack>

                  <HStack spacing={4}>
                    <Icon as={FiTrendingUp} w={6} h={6} color="purple.500" />
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={1}>
                        Stay Updated
                      </Text>
                      <Text color={textColor} fontSize="sm">
                        Get the latest news about events, competitions, and developments in target shooting
                      </Text>
                    </Box>
                  </HStack>

                  <HStack spacing={4}>
                    <Icon as={FiLock} w={6} h={6} color="orange.500" />
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={1}>
                        Members Only
                      </Text>
                      <Text color={textColor} fontSize="sm">
                        Exclusive access for SATRF members to ensure a safe and respectful community environment
                      </Text>
                    </Box>
                  </HStack>
                </VStack>

                <Divider my={4} />

                <Box bg="blue.50" p={6} borderRadius="md" borderLeft="4px" borderColor="blue.500">
                  <Text fontWeight="semibold" color="blue.900" mb={2}>
                    Forum Access
                  </Text>
                  <Text color="blue.800" mb={4}>
                    The forum will be available to all registered SATRF members. You&apos;ll need to log in with your member account to participate in discussions.
                  </Text>
                  <HStack spacing={4}>
                    <Link href="/register">
                      <Button colorScheme="blue" size="sm">
                        Become a Member
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" colorScheme="blue" size="sm">
                        Member Login
                      </Button>
                    </Link>
                  </HStack>
                </Box>

                <Box bg="gray.50" p={6} borderRadius="md">
                  <Text fontWeight="semibold" color={headingColor} mb={2}>
                    Expected Launch
                  </Text>
                  <Text color={textColor}>
                    We&apos;re working hard to launch the forum in the coming months. In the meantime, you can stay connected through our events and contact us directly with any questions.
                  </Text>
                </Box>
              </VStack>
            </Box>

            {/* Contact Alternative */}
            <Box textAlign="center" py={4}>
              <Text color={textColor} mb={4}>
                Have questions or want to get involved? Contact us directly:
              </Text>
              <Link href="/contact">
                <Button colorScheme="blue" size="lg">
                  Contact SATRF
                </Button>
              </Link>
            </Box>
          </VStack>
        </Container>
      </Layout>
    </>
  );
}

