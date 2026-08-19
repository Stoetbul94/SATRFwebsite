import Link from 'next/link';
import { Box, Heading, Text } from '@chakra-ui/react';
import FaqAccordion from '@/components/faq/FaqAccordion';
import { featuredFaqItems } from '@/data/faq';

export default function HomeFaqSection() {
  const featured = featuredFaqItems();

  return (
    <Box as="section" py={{ base: 12, md: 16 }} bg="gray.50" aria-labelledby="home-faq-heading">
      <Box maxW="3xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
        <Heading
          as="h2"
          id="home-faq-heading"
          size="lg"
          color="satrf.navy"
          textAlign="center"
          mb={3}
        >
          Frequently asked questions
        </Heading>
        <Text color="text.muted" textAlign="center" mb={8} fontSize="md">
          Short answers about SATRF, disciplines, events, scores and getting started.
        </Text>
        <FaqAccordion items={featured} />
        <Box textAlign="center" mt={8}>
          <Box
            as={Link}
            href="/faq"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            px={6}
            py={3}
            borderWidth="1px"
            borderColor="satrf.navy"
            color="satrf.navy"
            borderRadius="md"
            fontWeight="semibold"
            _hover={{ bg: 'satrf.navy', color: 'white' }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'satrf.gold.400',
              outlineOffset: '2px',
            }}
          >
            View all FAQs
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
