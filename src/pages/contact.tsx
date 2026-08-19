import React from 'react';
import Head from 'next/head';
import { Box, SimpleGrid, Icon, Text, VStack, Card, CardBody } from '@chakra-ui/react';
import { FiMail, FiClock } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import ContactForm from '@/components/ContactForm';
import SocialLinks from '@/components/layout/SocialLinks';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';

const contactInfo = [
  {
    icon: FiMail,
    title: 'Email',
    content: 'support@satrf.org.za',
    description: 'Send us an email anytime',
  },
  {
    icon: FiClock,
    title: 'Response Time',
    content: 'During business days',
    description: 'Use the form below and we will reply as soon as we can',
  },
];

export default function ContactPage() {
  return (
    <Layout>
      <Head>
        <title>Contact Us - SATRF</title>
        <meta name="description" content="Get in touch with the South African Target Rifle Federation." />
      </Head>
      <PublicPageShell>
        <VStack align="stretch" spacing={8}>
          <PublicPageHeader
            eyebrow="Support"
            title="Get in Touch"
            subtitle="Questions, technical support, or feedback — use the form or email. SATRF does not currently publish a public office address or telephone number."
          />

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {contactInfo.map((info) => (
              <Card key={info.title}>
                <CardBody textAlign="center">
                  <Icon as={info.icon} w={8} h={8} color="brand" mb={3} />
                  <Text fontWeight="semibold" mb={1}>
                    {info.title}
                  </Text>
                  <Text color="text.primary" fontSize="sm" mb={1}>
                    {info.content}
                  </Text>
                  <Text color="text.muted" fontSize="xs">
                    {info.description}
                  </Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          <Box textAlign="center">
            <Text fontWeight="semibold" mb={3}>
              Official social channels
            </Text>
            <SocialLinks size={6} color="brand" hoverColor="satrf.gold.500" />
          </Box>

          <Box>
            <ContactForm showTitle={false} />
          </Box>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
