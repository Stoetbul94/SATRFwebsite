import { Box, Button, Heading, HStack, Text, VStack } from '@chakra-ui/react';
import { FiDownload, FiExternalLink } from 'react-icons/fi';
import { formatEventDate } from '@/lib/eventDisplay';
import type { EventHubDocument } from '@/lib/eventHub/types';

type Props = {
  documents: EventHubDocument[];
};

export default function EventHubDocuments({ documents }: Props) {
  if (documents.length === 0) return null;

  return (
    <Box id="documents" scrollMarginTop="24" data-testid="event-hub-documents">
      <Heading as="h2" size="md" mb={4} color="satrf.navy">
        Documents
      </Heading>
      <VStack align="stretch" spacing={3}>
        {documents.map((doc) => (
          <Box
            key={doc.id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg="bg.surface"
            borderColor="border.subtle"
          >
            <Text fontWeight="semibold">{doc.title}</Text>
            {doc.publishedAt && (
              <Text fontSize="sm" color="text.muted" mt={1}>
                Published {formatEventDate(doc.publishedAt)}
              </Text>
            )}
            <HStack mt={3} spacing={2} flexWrap="wrap">
              <Button
                as="a"
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="satrfOutline"
                leftIcon={<FiExternalLink />}
                minH="44px"
              >
                View
              </Button>
              <Button
                as="a"
                href={doc.fileUrl}
                download
                size="sm"
                variant="ghost"
                leftIcon={<FiDownload />}
                minH="44px"
              >
                Download
              </Button>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}
