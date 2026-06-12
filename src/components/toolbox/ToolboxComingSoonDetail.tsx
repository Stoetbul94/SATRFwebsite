'use client';

import Link from 'next/link';
import { Badge, Button, Text, VStack } from '@chakra-ui/react';
import type { ToolboxToolDefinition } from '@/lib/toolbox/types';

export default function ToolboxComingSoonDetail({ tool }: { tool: ToolboxToolDefinition }) {
  return (
    <VStack align="start" spacing={4} data-testid="toolbox-tool-coming-soon">
      <Badge colorScheme="orange">Coming soon</Badge>
      <Text fontSize="lg" fontWeight="700" fontFamily="heading">
        {tool.name}
      </Text>
      <Text color="text.muted">{tool.description}</Text>
      <Text fontSize="sm" color="text.muted">
        This SATRF Toolbox assistant is not available yet. Check back soon.
      </Text>
      <Button as={Link} href="/toolbox" variant="satrfOutline">
        All toolbox tools
      </Button>
    </VStack>
  );
}
