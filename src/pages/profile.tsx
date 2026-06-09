import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Link as ChakraLink,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import FlagStripe from '@/components/brand/FlagStripe';
import { useAuth, useProtectedRoute } from '../contexts/AuthContext';
import { GetServerSideProps } from 'next';
import { SHOOTING_DISCIPLINES } from '@/lib/memberFields';

function displayValue(value?: string | null): string {
  return value?.trim() ? value.trim() : '—';
}

function formatMembershipType(type?: string): string {
  if (!type) return '—';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatDisciplines(ids?: string[]): string {
  if (!ids?.length) return '—';
  return ids
    .map((id) => SHOOTING_DISCIPLINES.find((d) => d.id === id)?.label ?? id)
    .join(', ');
}

const ProfileField = ({ label, value }: { label: string; value: string }) => (
  <FormControl>
    <FormLabel color="text.muted" fontSize="sm" mb={1}>
      {label}
    </FormLabel>
    <Text color="text.primary" fontWeight="medium">
      {value}
    </Text>
  </FormControl>
);

const ProfilePage: NextPage = () => {
  const { user } = useAuth();
  useProtectedRoute();

  if (!user) {
    return (
      <Layout>
        <Container maxW="container.md" py={12}>
          <Text color="text.muted">Loading profile…</Text>
        </Container>
      </Layout>
    );
  }

  const phone = user.phone || user.phoneNumber;

  return (
    <Layout>
      <Head>
        <title>Profile - SATRF</title>
        <meta name="description" content="View your SATRF member profile" />
      </Head>

      <Box bg="bg.canvas" minH="calc(100vh - 80px)" py={{ base: 8, md: 12 }}>
        <Container maxW="container.md">
          <VStack spacing={6} align="stretch">
            <ChakraLink
              as={Link}
              href="/dashboard"
              display="inline-flex"
              alignItems="center"
              gap={2}
              fontSize="sm"
              fontWeight="medium"
              color="satrf.green.700"
              _hover={{ color: 'satrf.gold.600', textDecoration: 'none' }}
              alignSelf="flex-start"
            >
              <Icon as={FiArrowLeft} boxSize={4} aria-hidden />
              Back to Dashboard
            </ChakraLink>

            <Box textAlign="center">
              <Heading size="lg" color="satrf.navy" fontFamily="heading">
                My Profile
              </Heading>
              <Text color="text.muted" mt={1}>
                Your member details and account information
              </Text>
            </Box>

            <Card
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.subtle"
              shadow="md"
              overflow="hidden"
            >
              <FlagStripe thickness={3} />
              <CardBody p={{ base: 6, md: 8 }}>
                <Stack spacing={8}>
                  <Box>
                    <Heading size="sm" color="satrf.green.700" fontFamily="heading" mb={4}>
                      Basic Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <ProfileField label="First Name" value={displayValue(user.firstName)} />
                      <ProfileField label="Last Name" value={displayValue(user.lastName)} />
                      <ProfileField
                        label="Membership Type"
                        value={formatMembershipType(user.membershipType)}
                      />
                      <ProfileField label="Province / Region" value={displayValue(user.province)} />
                      <ProfileField label="Club" value={displayValue(user.club)} />
                      <ProfileField label="Disciplines" value={formatDisciplines(user.disciplines)} />
                    </SimpleGrid>
                  </Box>

                  <Divider borderColor="border.subtle" />

                  <Box>
                    <Heading size="sm" color="satrf.green.700" fontFamily="heading" mb={4}>
                      Contact Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <ProfileField label="Phone Number" value={displayValue(phone)} />
                      <ProfileField
                        label="Date of Birth"
                        value={
                          user.dateOfBirth
                            ? new Date(user.dateOfBirth).toLocaleDateString()
                            : '—'
                        }
                      />
                    </SimpleGrid>
                    <Box mt={4}>
                      <ProfileField label="Address" value={displayValue(user.address)} />
                    </Box>
                  </Box>

                  <Divider borderColor="border.subtle" />

                  <Box>
                    <Heading size="sm" color="satrf.green.700" fontFamily="heading" mb={4}>
                      Emergency Contact
                    </Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <ProfileField
                        label="Emergency Contact Name"
                        value={displayValue(user.emergencyContact)}
                      />
                      <ProfileField
                        label="Emergency Contact Phone"
                        value={displayValue(user.emergencyPhone)}
                      />
                    </SimpleGrid>
                  </Box>

                  <Divider borderColor="border.subtle" />

                  <Box>
                    <Heading size="sm" color="satrf.green.700" fontFamily="heading" mb={4}>
                      Account Information
                    </Heading>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
                      <ProfileField label="Email Address" value={displayValue(user.email)} />
                      <ProfileField
                        label="Member Since"
                        value={new Date(user.createdAt).toLocaleDateString()}
                      />
                      <ProfileField
                        label="Last Login"
                        value={
                          user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'
                        }
                      />
                      <ProfileField
                        label="Login Count"
                        value={String(user.loginCount ?? 0)}
                      />
                    </SimpleGrid>
                  </Box>

                  <HStack spacing={4} pt={2}>
                    <Button as={Link} href="/profile/edit" variant="satrf" size="lg" flex={1}>
                      Edit Profile
                    </Button>
                    <Button
                      as={Link}
                      href="/dashboard"
                      variant="outline"
                      size="lg"
                      flex={1}
                    >
                      Back to Dashboard
                    </Button>
                  </HStack>
                </Stack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </Layout>
  );
};

export default ProfilePage;

export const getServerSideProps: GetServerSideProps = async () => ({
  props: {},
});
