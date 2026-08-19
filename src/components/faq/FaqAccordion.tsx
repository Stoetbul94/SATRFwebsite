import Link from 'next/link';
import { Box, Heading, Text } from '@chakra-ui/react';
import type { FAQInline, FAQItem } from '@/data/faq';

function FaqParagraph({ parts }: { parts: FAQInline[] }) {
  return (
    <Text color="text.muted" fontSize="md" lineHeight="tall" mb={3} _last={{ mb: 0 }}>
      {parts.map((part, index) =>
        typeof part === 'string' ? (
          <span key={index}>{part}</span>
        ) : (
          <Box
            as={Link}
            key={`${part.href}-${index}`}
            href={part.href}
            color="brand"
            textDecoration="underline"
            _hover={{ color: 'satrf.navy' }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'satrf.gold.400',
              outlineOffset: '2px',
            }}
          >
            {part.label}
          </Box>
        )
      )}
    </Text>
  );
}

export default function FaqAccordion({ items }: { items: FAQItem[] }) {
  return (
    <Box as="div">
      {items.map((item) => (
        <Box
          as="details"
          key={item.id}
          mb={3}
          borderWidth="1px"
          borderColor="blackAlpha.200"
          borderRadius="lg"
          bg="bg.surface"
          overflow="hidden"
        >
          <Box
            as="summary"
            id={`${item.id}-question`}
            cursor="pointer"
            px={4}
            py={3}
            fontWeight="semibold"
            color="text.primary"
            listStyleType="none"
            sx={{
              '&::-webkit-details-marker': { display: 'none' },
            }}
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'satrf.gold.400',
              outlineOffset: '-2px',
            }}
          >
            <Heading as="h3" size="sm" display="inline" fontWeight="semibold">
              {item.question}
            </Heading>
          </Box>
          <Box px={4} pb={4} pt={1} id={`${item.id}-answer`}>
            {item.paragraphs.map((parts, index) => (
              <FaqParagraph key={index} parts={parts} />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
