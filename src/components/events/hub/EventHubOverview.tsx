import { Box, Heading, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { formatEntryFee } from '@/lib/eventDisciplines';
import { formatEventDate } from '@/lib/eventDisplay';
import type { EventHubViewModel } from '@/lib/eventHub/types';

type DetailRow = { label: string; value: string };

function buildRows(event: EventHubViewModel): DetailRow[] {
  const rows: DetailRow[] = [];

  if (event.eventDate) {
    rows.push({ label: 'Date', value: formatEventDate(event.eventDate) });
  }
  if (event.startTime) {
    rows.push({ label: 'Start time', value: event.startTime });
  }
  if (event.equipmentInspectionTime) {
    rows.push({ label: 'Equipment inspection', value: event.equipmentInspectionTime });
  }
  if (event.endTime) {
    rows.push({ label: 'End time', value: event.endTime });
  }
  if (event.location) {
    rows.push({ label: 'Venue', value: event.location });
  }
  if (event.registrationDeadline) {
    rows.push({
      label: 'Entry closing',
      value: formatEventDate(event.registrationDeadline),
    });
  }
  if (event.price != null) {
    rows.push({ label: 'Entry fee', value: formatEntryFee(event.price) });
  }
  if (event.disciplineLabels.length > 0) {
    rows.push({ label: 'Disciplines', value: event.disciplineLabels.join(' · ') });
  }
  if (event.maxParticipants > 0) {
    rows.push({
      label: 'Capacity',
      value: `${event.currentParticipants} / ${event.maxParticipants} entries`,
    });
  } else if (event.currentParticipants > 0) {
    rows.push({
      label: 'Entries',
      value: `${event.currentParticipants} registered`,
    });
  }

  return rows;
}

type Props = {
  event: EventHubViewModel;
};

export default function EventHubOverview({ event }: Props) {
  const rows = buildRows(event);

  return (
    <Box id="overview" scrollMarginTop="24" data-testid="event-hub-overview">
      <Heading as="h2" size="md" mb={4} color="satrf.navy">
        Overview
      </Heading>

      {event.description && (
        <Text mb={5} color="text.muted" whiteSpace="pre-wrap">
          {event.description}
        </Text>
      )}

      {rows.length > 0 && (
        <>
          <Heading as="h3" size="sm" mb={3} color="satrf.navy">
            Event details
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
            {rows.map((row) => (
              <VStack
                key={row.label}
                align="start"
                spacing={0}
                p={3}
                borderWidth="1px"
                borderColor="border.subtle"
                borderRadius="md"
                bg="bg.surface"
              >
                <Text fontSize="xs" color="text.muted" textTransform="uppercase">
                  {row.label}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {row.value}
                </Text>
              </VStack>
            ))}
          </SimpleGrid>
        </>
      )}
    </Box>
  );
}
