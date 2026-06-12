'use client';

import Link from 'next/link';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from '@chakra-ui/react';
import * as FiIcons from 'react-icons/fi';
import { isToolInteractive } from '@/lib/toolbox/enabled';
import type { ToolboxToolDefinition } from '@/lib/toolbox/types';

function resolveIcon(iconName: string) {
  const icons = FiIcons as Record<string, React.ComponentType>;
  return icons[iconName] ?? FiIcons.FiTool;
}

interface ToolboxToolCardProps {
  tool: ToolboxToolDefinition;
  toolboxEnabled: boolean;
  onOpen?: (toolId: string) => void;
}

export default function ToolboxToolCard({ tool, toolboxEnabled, onOpen }: ToolboxToolCardProps) {
  const IconComponent = resolveIcon(tool.icon);
  const interactive = isToolInteractive(toolboxEnabled, tool);
  const showComingSoon = !toolboxEnabled || tool.status === 'coming_soon';

  return (
    <Card h="100%" data-testid={showComingSoon ? 'toolbox-coming-soon-card' : undefined}>
      <CardBody>
        <VStack align="start" spacing={4} h="100%">
          <HStack spacing={3}>
            <Box bg="satrf.green.50" color="brand" borderRadius="md" p={2}>
              <Icon as={IconComponent} boxSize={5} />
            </Box>
            <VStack align="start" spacing={0}>
              <Heading size="md">{tool.name}</Heading>
              <Text fontSize="sm" color="text.muted">
                {tool.tagline}
              </Text>
            </VStack>
          </HStack>

          <Text fontSize="sm" color="text.primary" flex="1">
            {tool.description}
          </Text>

          <HStack spacing={3} flexWrap="wrap">
            {showComingSoon && (
              <Badge colorScheme="orange">Coming soon</Badge>
            )}
            {interactive && onOpen && (
              <>
                <Button
                  variant="satrf"
                  size="sm"
                  onClick={() => onOpen(tool.id)}
                  data-testid={`toolbox-open-${tool.id}`}
                >
                  Open assistant
                </Button>
                <Button
                  as={Link}
                  href={`/toolbox/${tool.id}`}
                  variant="satrfOutline"
                  size="sm"
                >
                  View page
                </Button>
              </>
            )}
            {toolboxEnabled && tool.status === 'coming_soon' && onOpen && (
              <Button variant="satrfOutline" size="sm" onClick={() => onOpen(tool.id)}>
                Preview
              </Button>
            )}
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
}
