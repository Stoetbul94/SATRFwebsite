import {
  Badge,
  Box,
  Button,
  HStack,
  Heading,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import EventDisciplinePills from '@/components/events/EventDisciplinePills';
import EventCoverImage from '@/components/events/EventCoverImage';
import EventImageFallback from '@/components/events/EventImageFallback';
import AddToCalendarMenu from '@/components/events/hub/AddToCalendarMenu';
import { formatEventDate } from '@/lib/eventDisplay';
import { hubStatusColor } from '@/lib/eventHub/status';
import type { EventHubViewModel } from '@/lib/eventHub/types';
import type { CalendarEventInput } from '@/lib/eventCalendarLinks';

type Props = {
  event: EventHubViewModel;
  calendarInput: CalendarEventInput;
  onRegister: () => void;
  registerDisabled: boolean;
  registerLabel: string;
};

export default function EventHubHeader({
  event,
  calendarInput,
  onRegister,
  registerDisabled,
  registerLabel,
}: Props) {
  const mapsQuery = encodeURIComponent(event.location);
  const directionsHref =
    event.latitude != null && event.longitude != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
      : event.location
        ? `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
        : null;

  return (
    <Box data-testid="event-hub-header">
      <Box w="100%" h={{ base: '220px', md: '320px' }} borderRadius="lg" overflow="hidden" mb={5}>
        {event.imageUrl ? (
          <EventCoverImage src={event.imageUrl} alt={event.title} height="100%" />
        ) : (
          <EventImageFallback height="100%" title={event.title} />
        )}
      </Box>

      <VStack align="stretch" spacing={3}>
        <HStack spacing={2} flexWrap="wrap">
          <Badge
            colorScheme={hubStatusColor(event.hubStatus)}
            fontSize="sm"
            px={3}
            py={1}
            data-testid="event-hub-status"
          >
            {event.hubStatus}
          </Badge>
          {event.disciplines.length > 0 && (
            <EventDisciplinePills disciplines={event.disciplines} size="sm" />
          )}
        </HStack>

        <Heading as="h1" size={{ base: 'lg', md: 'xl' }} color="satrf.navy">
          {event.title}
        </Heading>

        <VStack align="start" spacing={1}>
          {event.eventDate && (
            <Text fontSize="md" fontWeight="medium">
              {formatEventDate(event.eventDate)}
            </Text>
          )}
          {event.location && (
            <HStack spacing={2} align="start">
              <Box as={FaMapMarkerAlt} mt={1} color="text.muted" />
              <Text fontSize="sm" color="text.muted">
                {event.location}
              </Text>
            </HStack>
          )}
        </VStack>

        <Wrap spacing={2} pt={1}>
          <WrapItem>
            <Button
              variant={registerDisabled ? 'solid' : 'satrf'}
              colorScheme={registerDisabled ? 'gray' : undefined}
              minH="44px"
              onClick={onRegister}
              isDisabled={registerDisabled}
              data-testid="event-hub-register"
            >
              {registerLabel}
            </Button>
          </WrapItem>
          {event.eventDate && (
            <WrapItem>
              <AddToCalendarMenu
                calendarInput={calendarInput}
                icsUid={`satrf-event-${event.id}@rifleshooting.co.za`}
                filename={`satrf-${event.id}.ics`}
              />
            </WrapItem>
          )}
          {directionsHref && (
            <WrapItem>
              <Button
                as="a"
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                variant="satrfOutline"
                minH="44px"
              >
                Directions
              </Button>
            </WrapItem>
          )}
        </Wrap>
      </VStack>
    </Box>
  );
}
