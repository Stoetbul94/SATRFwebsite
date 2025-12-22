import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Heading,
  Stack,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { FiArrowLeft, FiShield, FiKey, FiBell, FiTrash2 } from 'react-icons/fi';

export default function Account() {
  const router = useRouter();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Layout>
      <Container maxW="container.md" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => router.back()}
              mb={4}
            >
              Back
            </Button>
            <Heading size="xl" mb={2}>
              Account Settings
            </Heading>
            <Text color={useColorModeValue('gray.600', 'gray.400')}>
              Manage your account preferences and security settings
            </Text>
          </Box>

          {/* Account Settings Cards */}
          <Stack spacing={6}>
            {/* Security Settings */}
            <Card bg={cardBg} shadow="md">
              <CardHeader>
                <Heading size="md" display="flex" alignItems="center" gap={3}>
                  <FiShield />
                  Security Settings
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Manage your password, two-factor authentication, and security preferences.
                  </Text>
                  <Button
                    leftIcon={<FiKey />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement password change functionality
                      alert('Password change functionality coming soon!');
                    }}
                  >
                    Change Password
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Notification Preferences */}
            <Card bg={cardBg} shadow="md">
              <CardHeader>
                <Heading size="md" display="flex" alignItems="center" gap={3}>
                  <FiBell />
                  Notification Preferences
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Configure how you receive notifications about events, scores, and updates.
                  </Text>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement notification settings
                      alert('Notification settings coming soon!');
                    }}
                  >
                    Configure Notifications
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Privacy Settings */}
            <Card bg={cardBg} shadow="md">
              <CardHeader>
                <Heading size="md">Privacy Settings</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Control your privacy settings and data sharing preferences.
                  </Text>
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement privacy settings
                      alert('Privacy settings coming soon!');
                    }}
                  >
                    Manage Privacy
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Account Deletion */}
            <Card bg={cardBg} shadow="md" border="1px" borderColor="red.200">
              <CardHeader>
                <Heading size="md" display="flex" alignItems="center" gap={3} color="red.600">
                  <FiTrash2 />
                  Danger Zone
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Text color="gray.600">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </Text>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement account deletion
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        alert('Account deletion functionality coming soon!');
                      }
                    }}
                  >
                    Delete Account
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </Stack>

          {/* Back to Profile */}
          <Box textAlign="center">
            <Button
              colorScheme="blue"
              onClick={() => router.push('/profile')}
            >
              Back to Profile
            </Button>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
} 