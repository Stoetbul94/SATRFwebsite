import { Box, Flex, Heading, Text, type FlexProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface AdminPageHeaderProps extends FlexProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, subtitle, actions, ...props }: AdminPageHeaderProps) {
  return (
    <Flex
      direction={{ base: 'column', sm: 'row' }}
      align={{ base: 'stretch', sm: 'flex-start' }}
      justify="space-between"
      gap={4}
      mb={6}
      {...props}
    >
      <Box minW={0}>
        <Heading size="lg" mb={subtitle ? 1 : 0}>
          {title}
        </Heading>
        {subtitle && (
          <Text color="text.muted" fontSize="sm">
            {subtitle}
          </Text>
        )}
      </Box>
      {actions && (
        <Flex gap={2} flexShrink={0} wrap="wrap" justify={{ base: 'stretch', sm: 'flex-end' }}>
          {actions}
        </Flex>
      )}
    </Flex>
  );
}
