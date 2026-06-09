import { Box, Text, VStack } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

interface AdminEmptyStateProps {
  icon?: IconType;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function AdminEmptyState({ icon: Icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <Box py={12} px={6} textAlign="center">
      <VStack spacing={3}>
        {Icon && <Icon size={40} color="var(--chakra-colors-text-muted)" style={{ opacity: 0.45 }} />}
        <Text fontWeight="semibold" color="text.primary" fontSize="md">
          {title}
        </Text>
        {description && (
          <Text color="text.muted" fontSize="sm" maxW="sm" mx="auto">
            {description}
          </Text>
        )}
        {action}
      </VStack>
    </Box>
  );
}
