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
} from '@chakra-ui/react';
import { FaCrosshairs, FaUsers, FaChartLine, FaBrain, FaTrophy, FaBookOpen } from 'react-icons/fa';
import Layout from '../components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';
import TargetRingMotif from '@/components/brand/TargetRingMotif';
import FlagStripe from '@/components/brand/FlagStripe';

const developmentAreas = [
  {
    icon: FaCrosshairs,
    title: 'Technical rifle fundamentals',
    description: 'Sighting, trigger control and the core skills used in precision rifle.',
  },
  {
    icon: FaUsers,
    title: 'Position development',
    description: 'Prone, kneeling and standing work as applied in SATRF rifle disciplines.',
  },
  {
    icon: FaTrophy,
    title: 'Competition preparation',
    description: 'Match-day process, programme awareness and using published scores to track progress.',
  },
  {
    icon: FaBrain,
    title: 'Mental preparation',
    description: 'Focus, routine and composure under competitive conditions.',
  },
  {
    icon: FaChartLine,
    title: 'Performance analysis',
    description: 'Using SATRF scores and rankings to understand results over a season.',
  },
  {
    icon: FaBookOpen,
    title: 'Training resources',
    description: 'Articles and notes in From the Firing Line, plus current rules documentation.',
  },
];

export default function CoachingPage() {
  return (
    <Layout>
      <Head>
        <title>Coaching &amp; Development - SATRF</title>
        <meta
          name="description"
          content="SATRF coaching and development information for target rifle shooters in South Africa."
        />
      </Head>

      <Box bg="brand" color="white" py={{ base: 12, md: 16 }} position="relative" overflow="hidden">
        <TargetRingMotif top="10%" right="-5%" size={320} opacity={0.08} color="white" />
        <Box maxW="container.xl" mx="auto" px={{ base: 4, md: 8 }} position="relative" zIndex={1}>
          <Text textStyle="eyebrow" color="satrf.gold.300" mb={2}>
            Development
          </Text>
          <Heading as="h1" size="2xl" mb={4} color="white">
            Coaching &amp; Athlete Development
          </Heading>
          <Text fontSize="lg" color="whiteAlpha.800" maxW="2xl" mb={8}>
            SATRF provides coaching and development information for shooters at different stages of
            the sport. Contact SATRF for current coaching enquiries, or read training articles in From
            the Firing Line.
          </Text>
          <HStack spacing={4} flexWrap="wrap">
            <Button as={Link} href="/contact?service=coaching" variant="satrfGold" size="lg">
              Contact SATRF about coaching
            </Button>
            <Button as={Link} href="/insights" variant="satrfOutline" size="lg" color="white" borderColor="whiteAlpha.600" _hover={{ bg: 'whiteAlpha.200' }}>
              View training insights
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
              eyebrow="SATRF"
              title="Development focus areas"
              subtitle="Topics SATRF supports through its coaching pages, competition structure, scores and published resources."
              showMotif={false}
            />
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {developmentAreas.map((area) => (
                <Card key={area.title}>
                  <CardBody>
                    <Icon as={area.icon} boxSize={8} color="brand" mb={3} />
                    <Heading size="sm" mb={2}>
                      {area.title}
                    </Heading>
                    <Text fontSize="sm" color="text.muted">
                      {area.description}
                    </Text>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          <Card bg="satrf.gold.100" borderColor="satrf.gold.300">
            <CardBody textAlign="center" py={10}>
              <Heading size="lg" mb={3} color="satrf.navy">
                Looking for coaching support?
              </Heading>
              <Text color="text.muted" mb={6} maxW="lg" mx="auto">
                Use the contact form for coaching enquiries. Named coach directories are published
                only when SATRF has verified current coaching contacts.
              </Text>
              <HStack justify="center" spacing={4} flexWrap="wrap">
                <Button as={Link} href="/contact?service=coaching" variant="satrf" size="lg">
                  Contact SATRF about coaching
                </Button>
                <Button as={Link} href="/insights" variant="satrfOutline" size="lg">
                  View training insights
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
