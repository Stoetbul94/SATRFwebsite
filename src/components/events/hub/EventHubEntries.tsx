import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { formatEntryFee } from '@/lib/eventDisciplines';
import type { EventHubViewModel } from '@/lib/eventHub/types';

type Props = {
  event: EventHubViewModel;
  onRegister: () => void;
  registerDisabled: boolean;
  registerLabel: string;
};

export default function EventHubEntries({
  event,
  onRegister,
  registerDisabled,
  registerLabel,
}: Props) {
  return (
    <Box id="entries" scrollMarginTop="24" data-testid="event-hub-entries">
      <Heading as="h2" size="md" mb={3} color="satrf.navy">
        Entries
      </Heading>
      <VStack align="stretch" spacing={3} p={4} borderWidth="1px" borderRadius="lg" bg="bg.surface">
        <Text fontSize="sm">
          Status: <strong>{event.hubStatus}</strong>
        </Text>
        {event.maxParticipants > 0 && (
          <Text fontSize="sm">
            {event.currentParticipants} of {event.maxParticipants} places filled
          </Text>
        )}
        {event.price != null && (
          <Text fontSize="sm">{formatEntryFee(event.price)}</Text>
        )}
        <Button
          variant={registerDisabled ? 'solid' : 'satrf'}
          colorScheme={registerDisabled ? 'gray' : undefined}
          minH="44px"
          alignSelf={{ base: 'stretch', sm: 'flex-start' }}
          onClick={onRegister}
          isDisabled={registerDisabled}
        >
          {registerLabel}
        </Button>
        <Text fontSize="xs" color="text.muted">
          No login required · Payment details shown after registration
        </Text>
      </VStack>
    </Box>
  );
}
