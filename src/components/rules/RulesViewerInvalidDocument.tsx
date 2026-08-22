import { Button, Heading, Text, VStack } from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function RulesViewerInvalidDocument() {
  return (
    <VStack align="stretch" spacing={4} py={8} data-testid="viewer-invalid-document">
      <Heading as="h1" size="md">
        Rule document unavailable
      </Heading>
      <Text color="text.muted">
        This document is not part of the current SATRF rules library.
      </Text>
      <Button
        as={Link}
        href="/rules"
        leftIcon={<FiArrowLeft />}
        variant="satrfOutline"
        alignSelf="flex-start"
        minH="44px"
      >
        Back to Rule Finder
      </Button>
    </VStack>
  );
}
