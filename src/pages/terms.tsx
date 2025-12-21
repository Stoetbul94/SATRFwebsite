import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';

export default function Terms() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.900', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.300');

  return (
    <>
      <Head>
        <title>Terms of Service - SATRF</title>
        <meta name="description" content="SATRF Terms of Service - Read our terms and conditions for using the SATRF website and services." />
        <meta property="og:title" content="Terms of Service - SATRF" />
        <meta property="og:description" content="SATRF Terms of Service - Read our terms and conditions for using the SATRF website and services." />
      </Head>

      <Layout>
        <Container maxW="container.xl" py={12}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={8}>
              <Heading as="h1" size="2xl" color={headingColor} mb={4}>
                Terms of Service
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="3xl" mx="auto">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </Box>

            <Divider />

            {/* Terms Content */}
            <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
              <VStack spacing={8} align="stretch">
                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    1. Acceptance of Terms
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    By accessing and using the South African Target Rifle Federation ("SATRF") website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    2. Use License
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed" mb={4}>
                    Permission is granted to temporarily access the materials on SATRF&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                  </Text>
                  <Box as="ul" pl={6} color={textColor} lineHeight="relaxed">
                    <li>Modify or copy the materials</li>
                    <li>Use the materials for any commercial purpose or for any public display</li>
                    <li>Attempt to reverse engineer any software contained on the website</li>
                    <li>Remove any copyright or other proprietary notations from the materials</li>
                    <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    3. Membership and Account
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={2}>3.1 Account Registration</Text>
                      <Text color={textColor} lineHeight="relaxed">
                        To access certain features of our website, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={2}>3.2 Account Security</Text>
                      <Text color={textColor} lineHeight="relaxed">
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={2}>3.3 Membership Requirements</Text>
                      <Text color={textColor} lineHeight="relaxed">
                        Membership in SATRF is subject to approval and compliance with our membership requirements. We reserve the right to refuse or revoke membership at our discretion.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    4. User Conduct
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed" mb={2}>
                    You agree not to use the website or services to:
                  </Text>
                  <Box as="ul" pl={6} color={textColor} lineHeight="relaxed">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon the rights of others</li>
                    <li>Transmit any harmful, offensive, or inappropriate content</li>
                    <li>Interfere with or disrupt the website or services</li>
                    <li>Attempt to gain unauthorized access to any portion of the website</li>
                    <li>Use automated systems to access the website without permission</li>
                    <li>Impersonate any person or entity</li>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    5. Competition and Scoring
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={2}>5.1 Score Submission</Text>
                      <Text color={textColor} lineHeight="relaxed">
                        Scores submitted through our platform must be accurate and verifiable. False or fraudulent score submissions may result in immediate account suspension or termination.
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={2}>5.2 Competition Rules</Text>
                      <Text color={textColor} lineHeight="relaxed">
                        All competitions and events are subject to official SATRF rules and regulations. Participants must comply with all competition rules, safety requirements, and codes of conduct.
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={headingColor} mb={2}>5.3 Public Display</Text>
                      <Text color={textColor} lineHeight="relaxed">
                        By participating in competitions, you consent to the public display of your name, scores, and rankings on our website and leaderboards.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    6. Intellectual Property
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    The website and its original content, features, and functionality are owned by SATRF and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise exploit any of the content without our prior written permission.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    7. Payment Terms
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed" mb={2}>
                    If you make payments through our website:
                  </Text>
                  <Box as="ul" pl={6} color={textColor} lineHeight="relaxed">
                    <li>All fees are non-refundable unless otherwise stated</li>
                    <li>You are responsible for providing accurate payment information</li>
                    <li>We reserve the right to change our pricing at any time</li>
                    <li>Refunds, if applicable, will be processed according to our refund policy</li>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    8. Disclaimer of Warranties
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    The materials on SATRF&apos;s website are provided on an &apos;as is&apos; basis. SATRF makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    9. Limitation of Liability
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    In no event shall SATRF or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on SATRF&apos;s website, even if SATRF or a SATRF authorized representative has been notified orally or in writing of the possibility of such damage.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    10. Indemnification
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    You agree to indemnify, defend, and hold harmless SATRF, its officers, directors, employees, agents, and affiliates from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use of the website, violation of these terms, or infringement of any rights of another.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    11. Termination
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    We may terminate or suspend your account and access to the website immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service. Upon termination, your right to use the website will cease immediately.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    12. Governing Law
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    These Terms of Service shall be governed by and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions. Any disputes arising under or in connection with these terms shall be subject to the exclusive jurisdiction of the courts of South Africa.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    13. Changes to Terms
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the &quot;Last updated&quot; date. Your continued use of the website after such changes constitutes acceptance of the new terms.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    14. Contact Information
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    If you have any questions about these Terms of Service, please contact us:
                  </Text>
                  <Box mt={4} p={4} bg="blue.50" borderRadius="md">
                    <Text color={textColor} fontWeight="semibold">South African Target Rifle Federation</Text>
                    <Text color={textColor}>Email: info@satrf.org.za</Text>
                    <Text color={textColor}>Website: <Link href="/contact" style={{ color: '#3182ce', textDecoration: 'underline' }}>Contact Page</Link></Text>
                  </Box>
                </Box>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Layout>
    </>
  );
}

