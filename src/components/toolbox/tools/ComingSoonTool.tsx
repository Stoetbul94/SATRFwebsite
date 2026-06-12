'use client';

import { Box, Text, VStack } from '@chakra-ui/react';
import { getToolById } from '@/lib/toolbox/registry';

export default function ComingSoonTool({ toolId }: { toolId: string }) {
  const tool = getToolById(toolId);

  return (
    <Box flex="1" p={6}>
      <VStack align="start" spacing={3}>
        <Text fontFamily="heading" fontSize="lg" fontWeight="700">
          {tool?.name ?? 'Coming soon'}
        </Text>
        <Text color="text.muted" fontSize="sm">
          {tool?.description ?? 'This SATRF Toolbox assistant is not available yet.'}
        </Text>
      </VStack>
    </Box>
  );
}
