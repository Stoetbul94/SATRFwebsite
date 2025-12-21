import Head from 'next/head';
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

export default function Privacy() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const headingColor = useColorModeValue('gray.900', 'white');
  const textColor = useColorModeValue('gray.700', 'gray.300');

  return (
    <>
      <Head>
        <title>Privacy Policy - SATRF</title>
        <meta name="description" content="SATRF Privacy Policy - Learn how we collect, use, and protect your personal information." />
        <meta property="og:title" content="Privacy Policy - SATRF" />
        <meta property="og:description" content="SATRF Privacy Policy - Learn how we collect, use, and protect your personal information." />
      </Head>

      <Layout>
        <Container maxW="container.xl" py={12}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={8}>
              <Heading as="h1" size="2xl" color={headingColor} mb={4}>
                Privacy Policy
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="3xl" mx="auto">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </Box>

            <Divider />

            {/* Privacy Policy Content */}
            <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
              <VStack spacing={8} align="stretch">
                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    1. Introduction
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    The South African Target Rifle Federation ("SATRF", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    2. Information We Collect
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Heading as="h3" size="md" color={headingColor} mb={2}>
                        2.1 Personal Information
                      </Heading>
                      <Text color={textColor} lineHeight="relaxed">
                        We may collect personal information that you voluntarily provide to us when you:
                      </Text>
                      <Box as="ul" pl={6} mt={2} color={textColor}>
                        <li>Register for a membership account</li>
                        <li>Register for events or competitions</li>
                        <li>Submit scores or competition results</li>
                        <li>Contact us through our contact form</li>
                        <li>Subscribe to our newsletter</li>
                        <li>Make donations</li>
                      </Box>
                      <Text color={textColor} lineHeight="relaxed" mt={2}>
                        This information may include: name, email address, phone number, postal address, date of birth, membership type, club affiliation, and payment information.
                      </Text>
                    </Box>

                    <Box>
                      <Heading as="h3" size="md" color={headingColor} mb={2}>
                        2.2 Automatically Collected Information
                      </Heading>
                      <Text color={textColor} lineHeight="relaxed">
                        When you visit our website, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. We also collect information about how you interact with our website.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    3. How We Use Your Information
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed" mb={2}>
                    We use the information we collect to:
                  </Text>
                  <Box as="ul" pl={6} color={textColor} lineHeight="relaxed">
                    <li>Process and manage your membership</li>
                    <li>Register you for events and competitions</li>
                    <li>Maintain and display scores and leaderboards</li>
                    <li>Send you important updates about events and competitions</li>
                    <li>Respond to your inquiries and provide customer support</li>
                    <li>Improve our website and services</li>
                    <li>Comply with legal obligations</li>
                    <li>Prevent fraud and ensure security</li>
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    4. Information Sharing and Disclosure
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed" mb={4}>
                    We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                  </Text>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" color={headingColor}>Service Providers:</Text>
                      <Text color={textColor}>We may share information with third-party service providers who perform services on our behalf (e.g., payment processing, email services).</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={headingColor}>Legal Requirements:</Text>
                      <Text color={textColor}>We may disclose information if required by law or in response to valid requests by public authorities.</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={headingColor}>Public Information:</Text>
                      <Text color={textColor}>Your name and scores may be displayed publicly on leaderboards and competition results, as this is part of the competitive nature of the sport.</Text>
                    </Box>
                  </VStack>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    5. Data Security
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    6. Your Rights
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed" mb={2}>
                    You have the right to:
                  </Text>
                  <Box as="ul" pl={6} color={textColor} lineHeight="relaxed">
                    <li>Access your personal information</li>
                    <li>Correct inaccurate or incomplete information</li>
                    <li>Request deletion of your personal information</li>
                    <li>Object to processing of your personal information</li>
                    <li>Request restriction of processing</li>
                    <li>Data portability</li>
                    <li>Withdraw consent at any time</li>
                  </Box>
                  <Text color={textColor} lineHeight="relaxed" mt={4}>
                    To exercise these rights, please contact us using the information provided in the Contact section below.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    7. Cookies and Tracking Technologies
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    We use cookies and similar tracking technologies to track activity on our website and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    8. Children's Privacy
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    9. Changes to This Privacy Policy
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Heading as="h2" size="lg" color={headingColor} mb={4}>
                    10. Contact Us
                  </Heading>
                  <Text color={textColor} lineHeight="relaxed">
                    If you have any questions about this Privacy Policy, please contact us:
                  </Text>
                  <Box mt={4} p={4} bg="blue.50" borderRadius="md">
                    <Text color={textColor} fontWeight="semibold">South African Target Rifle Federation</Text>
                    <Text color={textColor}>Email: info@satrf.org.za</Text>
                    <Text color={textColor}>Website: <a href="/contact" style={{ color: '#3182ce', textDecoration: 'underline' }}>Contact Page</a></Text>
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

