import Head from 'next/head';
import Link from 'next/link';
import {
  Badge,
  Box,
  Heading,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import PublicPageHeader from '@/components/layout/PublicPageHeader';

const NOTICES = [
  {
    href: '/notices/satrf-governance-clarification',
    title: 'Official Notice: SATRF Governance Clarification',
    date: '23 January 2026',
    dateIso: '2026-01-23',
    category: 'Governance',
    summary:
      'Signed communiqué clarifying recognised governance for non-air-rifle ISSF rifle disciplines in South Africa.',
  },
] as const;

export default function NoticesIndexPage() {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedText = useColorModeValue('gray.600', 'gray.300');

  return (
    <Layout>
      <Head>
        <title>Official Notices | SATRF</title>
        <meta
          name="description"
          content="Official SATRF notices and governance clarifications for members, clubs and the public."
        />
        <link rel="canonical" href="https://satrf.org.za/notices" />
      </Head>

      <PublicPageShell>
        <PublicPageHeader
          eyebrow="SATRF official communications"
          title="Official Notices"
          subtitle="Governance clarifications and formal member notices issued by the South African Target Rifle Federation."
        />

        <VStack align="stretch" spacing={4}>
          {NOTICES.map((notice) => (
            <Box
              key={notice.href}
              as={Link}
              href={notice.href}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              p={6}
              transition="all 0.2s"
              _hover={{ borderColor: '#3182ce', boxShadow: 'md' }}
              display="block"
            >
              <Badge colorScheme="red" mb={3} fontSize="xs">
                Official Notice
              </Badge>
              <Heading as="h2" size="md" color="#1a365d" mb={2}>
                {notice.title}
              </Heading>
              <Text fontSize="sm" color={mutedText} mb={2}>
                <time dateTime={notice.dateIso}>{notice.date}</time>
                {' · '}
                {notice.category}
              </Text>
              <Text color={mutedText} fontSize="sm" lineHeight="tall">
                {notice.summary}
              </Text>
            </Box>
          ))}
        </VStack>
      </PublicPageShell>
    </Layout>
  );
}
