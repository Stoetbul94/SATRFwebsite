import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

export default function AdminLoadingPanel({ label = 'Loading…' }: { label?: string }) {
  return (
    <Center minH="40vh" py={12}>
      <VStack spacing={4}>
        <Spinner size="lg" color="brand" thickness="3px" />
        <Text fontSize="sm" color="text.muted">
          {label}
        </Text>
      </VStack>
    </Center>
  );
}
