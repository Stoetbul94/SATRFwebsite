import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Icon,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { FaTrophy, FaCrosshairs, FaUsers, FaChartLine, FaEnvelope, FaPhone } from 'react-icons/fa';
import Layout from '../components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import TargetRingMotif from '@/components/brand/TargetRingMotif';
import FlagStripe from '@/components/brand/FlagStripe';

const coaches = [
  {
    id: 1,
    name: 'Coach Sarah van der Merwe',
    title: 'Head Performance Coach',
    credentials: ['ISSF Level 3 Coach', 'Former National Champion', '15+ Years Experience'],
    bio: 'Former national champion specializing in mental preparation and technical precision.',
    specialties: ['Mental Preparation', 'Technical Precision', 'Competition Strategy'],
    contact: { email: 'sarah@satrf.co.za', phone: '+27 82 123 4567' },
  },
  {
    id: 2,
    name: 'Coach Michael Botha',
    title: 'Technical Development Coach',
    credentials: ['ISSF Level 2 Coach', 'Former Olympic Coach', '20+ Years Experience'],
    bio: 'Elite coach focused on biomechanics, equipment optimization, and athlete development.',
    specialties: ['Biomechanics', 'Equipment Optimization', 'Youth Development'],
    contact: { email: 'michael@satrf.co.za', phone: '+27 83 987 6543' },
  },
];

const benefits = [
  { icon: FaCrosshairs, title: 'Personalized Plans', description: 'Programs tailored to your skill level and goals.' },
  { icon: FaTrophy, title: 'Competitive Edge', description: 'Advanced techniques used by elite shooters.' },
  { icon: FaChartLine, title: 'Performance Tracking', description: 'Data-driven progress monitoring.' },
  { icon: FaUsers, title: 'Expert Mentorship', description: 'Certified coaches with proven records.' },
];

export default function CoachingPage() {
  return (
    <Layout>
      <Head>
        <title>Elite Coaching Services - SATRF</title>
        <meta name="description" content="Professional shooting coaching services in South Africa." />
      </Head>

      <Box bg="brand" color="white" py={{ base: 12, md: 16 }} position="relative" overflow="hidden">
        <TargetRingMotif top="10%" right="-5%" size={320} opacity={0.08} color="white" />
        <Box maxW="container.xl" mx="auto" px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
          <Text textStyle="eyebrow" color="satrf.gold.300" mb={2}>
            Performance
          </Text>
          <Heading size="2xl" mb={4} color="white">
            Elite Coaching for South African Shooters
          </Heading>
          <Text fontSize="lg" color="whiteAlpha.800" maxW="2xl" mb={8}>
            Personalized training from certified coaches — master technique, build mental resilience, and reach your competitive goals.
          </Text>
          <HStack spacing={4} flexWrap="wrap">
            <Button as={Link} href="/contact?service=coaching" variant="satrfGold" size="lg">
              Book Free Consultation
            </Button>
            <Button as="a" href="#coaches" variant="satrfOutline" size="lg" color="white" borderColor="whiteAlpha.600" _hover={{ bg: 'whiteAlpha.200' }}>
              Meet Our Coaches
            </Button>
          </HStack>
        </Box>
        <Box position="absolute" bottom={0} left={0} right={0}>
          <FlagStripe thickness={4} />
        </Box>
      </Box>

      <PublicPageShell>
        <VStack align="stretch" spacing={10} pt={4}>
          <Box>
            <PublicPageHeader
              eyebrow="Why SATRF"
              title="Why Choose SATRF Coaching?"
              subtitle="Technical expertise and proven methodologies for shooters at every level."
              showMotif={false}
            />
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              {benefits.map((b) => (
                <Card key={b.title}>
                  <CardBody textAlign="center">
                    <Icon as={b.icon} boxSize={8} color="brand" mb={3} />
                    <Heading size="sm" mb={2}>
                      {b.title}
                    </Heading>
                    <Text fontSize="sm" color="text.muted">
                      {b.description}
                    </Text>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          <Box id="coaches">
            <PublicPageHeader
              eyebrow="Our team"
              title="Meet Our Coaches"
              subtitle="Certified coaches with decades of combined competitive and development experience."
              showMotif={false}
            />
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {coaches.map((coach) => (
                <Card key={coach.id}>
                  <CardBody>
                    <Heading size="md" mb={1}>
                      {coach.name}
                    </Heading>
                    <Text textStyle="eyebrowGreen" mb={4}>
                      {coach.title}
                    </Text>
                    <Text color="text.muted" mb={4} fontSize="sm">
                      {coach.bio}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap" mb={4}>
                      {coach.specialties.map((s) => (
                        <Badge key={s} variant="discipline">
                          {s}
                        </Badge>
                      ))}
                    </HStack>
                    <VStack align="start" spacing={1} fontSize="sm">
                      <HStack>
                        <Icon as={FaEnvelope} color="brand" />
                        <Text as="a" href={`mailto:${coach.contact.email}`} color="text.primary">
                          {coach.contact.email}
                        </Text>
                      </HStack>
                      <HStack>
                        <Icon as={FaPhone} color="brand" />
                        <Text as="a" href={`tel:${coach.contact.phone}`} color="text.primary">
                          {coach.contact.phone}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          <Card bg="satrf.gold.100" borderColor="satrf.gold.300">
            <CardBody textAlign="center" py={10}>
              <Heading size="lg" mb={3} color="satrf.navy">
                Ready to Transform Your Shooting?
              </Heading>
              <Text color="text.muted" mb={6} maxW="lg" mx="auto">
                Book a free consultation — first session free, no commitment required.
              </Text>
              <Button as={Link} href="/contact?service=coaching" variant="satrf" size="lg">
                Book Free Consultation
              </Button>
            </CardBody>
          </Card>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
