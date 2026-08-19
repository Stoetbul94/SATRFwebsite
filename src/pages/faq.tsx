import Head from 'next/head';
import Link from 'next/link';
import { Box, Heading, HStack, Text } from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import PublicPageShell from '@/components/layout/PublicPageShell';
import FlagStripe from '@/components/brand/FlagStripe';
import TargetRingMotif from '@/components/brand/TargetRingMotif';
import FaqAccordion from '@/components/faq/FaqAccordion';
import {
  FAQ_CATEGORIES,
  FAQ_H1,
  FAQ_INTRO,
  FAQ_META_DESCRIPTION,
  FAQ_PAGE_TITLE,
  faqItemsByCategory,
} from '@/data/faq';
import { buildFaqBreadcrumbJsonLd, buildFaqPageJsonLd } from '@/lib/faqStructuredData';
import { absoluteUrl } from '@/lib/siteUrl';

const FAQ_PATH = '/faq';

export default function FaqPage() {
  const canonical = absoluteUrl(FAQ_PATH);
  const ogImage = absoluteUrl('/brand/satrf-brand-banner.png');

  return (
    <Layout>
      <Head>
        <title>{FAQ_PAGE_TITLE}</title>
        <meta name="description" content={FAQ_META_DESCRIPTION} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SATRF — South African Target Rifle Federation" />
        <meta property="og:title" content={FAQ_PAGE_TITLE} />
        <meta property="og:description" content={FAQ_META_DESCRIPTION} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={FAQ_PAGE_TITLE} />
        <meta name="twitter:description" content={FAQ_META_DESCRIPTION} />
        <meta name="twitter:image" content={ogImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqPageJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqBreadcrumbJsonLd()) }}
        />
      </Head>

      <PublicPageShell>
        <Box as="nav" aria-label="Breadcrumb" mb={6} fontSize="sm" color="text.muted">
          <HStack as="ol" spacing={2} listStyleType="none" m={0} p={0}>
            <Box as="li">
              <Box
                as={Link}
                href="/"
                color="brand"
                _hover={{ textDecoration: 'underline' }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'satrf.gold.400',
                  outlineOffset: '2px',
                }}
              >
                Home
              </Box>
            </Box>
            <Box as="li" aria-hidden>
              &gt;
            </Box>
            <Box as="li" color="text.primary" fontWeight="medium" aria-current="page">
              FAQ
            </Box>
          </HStack>
        </Box>

        <Box position="relative" mb={8}>
          <TargetRingMotif top={-8} right={0} size={200} opacity={0.06} color="satrf.green.700" />
          <Text textStyle="eyebrow">SATRF</Text>
          <Heading as="h1" size="xl" color="text.primary" mt={2}>
            {FAQ_H1}
          </Heading>
          <Text color="text.muted" fontSize="lg" maxW="3xl" mt={3}>
            {FAQ_INTRO}
          </Text>
          <Box w={{ base: '100%', md: '280px' }} pt={3}>
            <FlagStripe thickness={4} />
          </Box>
        </Box>

        {FAQ_CATEGORIES.map((category) => {
          const items = faqItemsByCategory(category.id);
          if (items.length === 0) return null;
          return (
            <Box as="section" key={category.id} mb={10} aria-labelledby={`faq-${category.id}`}>
              <Heading as="h2" id={`faq-${category.id}`} size="md" color="satrf.navy" mb={4}>
                {category.label}
              </Heading>
              <FaqAccordion items={items} />
            </Box>
          );
        })}
      </PublicPageShell>
    </Layout>
  );
}
