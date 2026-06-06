import React from 'react';
import Head from 'next/head';
import { Box, SimpleGrid, Icon, Text, VStack, Card, CardBody } from '@chakra-ui/react';
import { FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import Layout from '@/components/layout/Layout';
import ContactForm from '@/components/ContactForm';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';

const contactInfo = [
  { icon: FiMail, title: 'Email', content: 'support@satrf.org.za', description: 'Send us an email anytime' },
  { icon: FiPhone, title: 'Phone', content: '+27 (0) 11 123 4567', description: 'Mon–Fri 8am–5pm' },
  { icon: FiMapPin, title: 'Address', content: 'Johannesburg, South Africa', description: 'SATRF Headquarters' },
  { icon: FiClock, title: 'Response Time', content: '24–48 hours', description: 'During business days' },
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
            subtitle="Questions, technical support, or feedback — we're here to help you get the most out of your SATRF experience."
          />

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
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

          <Box>
            <ContactForm showTitle={false} />
          </Box>
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
