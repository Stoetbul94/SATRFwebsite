import NextLink from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaEnvelope } from 'react-icons/fa';
import SocialLinks from '@/components/layout/SocialLinks';
import Layout from '@/components/layout/Layout';
import Image from 'next/image';
import Head from 'next/head';

export default function About() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');

  return (
    <Layout>
      <Head>
        <title>About Us - South African Target Rifle Federation</title>
        <meta
          name="description"
          content="Learn about the South African Target Rifle Federation (SATRF), an affiliate of SASSCo promoting competitive target rifle shooting in South Africa."
        />
        <meta property="og:title" content="About Us - South African Target Rifle Federation" />
        <meta
          property="og:description"
          content="SATRF promotes target-rifle disciplines within its scope and is listed as an affiliate of SASSCo."
        />
        <meta property="og:type" content="website" />
      </Head>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" py={10}>
            <Box mb={4} display="flex" justifyContent="center">
              <Image
                src="/SATRFLOGO.png"
                alt="SATRF Logo"
                width={100}
                height={100}
                style={{ borderRadius: '50%' }}
                priority
              />
            </Box>
            <Heading as="h1" size="2xl" color={headingColor} mb={4}>
              Welcome to the South African Target Rifle Federation
            </Heading>
            <Text fontSize="xl" color={textColor} maxW="3xl" mx="auto">
              The South African Target Rifle Federation (SATRF) promotes and administers target-rifle
              disciplines within its scope and is listed as an affiliate of the South African Shooting
              Sport Confederation (SASSCo). SATRF is committed to promoting, developing and supporting
              competitive target rifle shooting across South Africa.
            </Text>
          </Box>

          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              Our Mission
            </Heading>
            <Text fontSize="lg" color={textColor}>
              Our mission is to advance the sport of target rifle shooting in South Africa by fostering
              excellence, integrity, and sportsmanship at all levels—from grassroots to international
              competition. We strive to create opportunities for shooters of all ages and backgrounds to
              participate, compete, and succeed.
            </Text>
          </Box>

          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              Who We Are
            </Heading>
            <Text fontSize="lg" color={textColor} mb={4}>
              SATRF is listed as an affiliate of the South African Shooting Sport Confederation
              (SASSCo). The International Shooting Sport Federation (ISSF) lists SASSCo as its South
              African member federation. SATRF therefore operates within the South African
              shooting-sport structure through SASSCo, rather than as the ISSF member federation
              itself.
            </Text>
            <Text fontSize="lg" color={textColor}>
              SATRF focuses on non-air-rifle target rifle disciplines. Air-rifle target shooting in
              South Africa is administered separately through the South African Air Rifle Association
              (SAARA).
            </Text>
          </Box>

          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              What We Do
            </Heading>
            <Text fontSize="lg" color={textColor}>
              Through this website SATRF publishes competitions, scores and rankings, rules
              documentation, coaching information and articles. Event programmes, venues and entry
              details are listed on the relevant event pages when they are available.
            </Text>
          </Box>

          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={4}>
              Join Us
            </Heading>
            <Text fontSize="lg" color={textColor}>
              You can create a SATRF website account to follow events, scores and federation
              information. A website account is not described here as automatic national-federation
              membership. SATRF welcomes shooters who want to compete, learn, or take part in the
              target rifle community.
            </Text>
            <Text fontSize="lg" color={textColor} mt={4}>
              For concise answers on disciplines, events, scores and getting started, see the{' '}
              <Link as={NextLink} href="/faq" color="blue.500">
                target rifle shooting FAQs
              </Link>
              .
            </Text>
          </Box>

          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading as="h2" size="xl" color={headingColor} mb={6}>
              Contact Us
            </Heading>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Icon as={FaEnvelope} color="blue.500" />
                <Link href="mailto:info@satrf.co.za" color={textColor}>
                  info@satrf.co.za
                </Link>
              </HStack>
              <Text fontSize="sm" color={textColor}>
                SATRF does not currently publish a public physical office address or telephone
                number. Use email, the contact form, or the official social channels below.
              </Text>
              <Box mt={2}>
                <SocialLinks size={6} color="blue.500" hoverColor="satrf.gold.500" />
              </Box>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
}
