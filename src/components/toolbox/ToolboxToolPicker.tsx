'use client';

import { Badge, Box, Button, HStack, Icon, Text, VStack } from '@chakra-ui/react';
import * as FiIcons from 'react-icons/fi';
import { TOOLBOX_TOOLS } from '@/lib/toolbox/registry';
import { useToolbox } from './ToolboxProvider';

function resolveIcon(iconName: string) {
  const icons = FiIcons as Record<string, React.ComponentType>;
  return icons[iconName] ?? FiIcons.FiTool;
}

export default function ToolboxToolPicker() {
  const { selectTool } = useToolbox();

  return (
    <VStack align="stretch" spacing={3} p={4} data-testid="toolbox-tool-picker">
      <Text fontSize="sm" color="text.muted">
        Choose an AI assistant for shooters, coaches, and officials.
      </Text>
      {TOOLBOX_TOOLS.map((tool) => {
        const IconComponent = resolveIcon(tool.icon);
        return (
          <Box
            key={tool.id}
            borderWidth="1px"
            borderRadius="lg"
            p={4}
            bg="bg.surface"
            _hover={{ borderColor: 'brand', shadow: 'sm' }}
            transition="all 0.2s"
          >
            <HStack align="start" spacing={3}>
              <Box
                bg="satrf.green.50"
                color="brand"
                borderRadius="md"
                p={2}
                flexShrink={0}
              >
                <Icon as={IconComponent} boxSize={5} />
              </Box>
              <VStack align="start" spacing={1} flex="1">
                <HStack>
                  <Text fontWeight="700" fontFamily="heading">
                    {tool.name}
                  </Text>
                  {tool.status === 'coming_soon' && (
                    <Badge colorScheme="orange" fontSize="xs">
                      Coming soon
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="text.muted">
                  {tool.tagline}
                </Text>
                <Button
                  size="sm"
                  variant={tool.status === 'available' ? 'satrf' : 'satrfOutline'}
                  mt={2}
                  onClick={() => selectTool(tool.id)}
                >
                  {tool.status === 'available' ? 'Open' : 'Preview'}
                </Button>
              </VStack>
            </HStack>
          </Box>
        );
      })}
    </VStack>
  );
}
