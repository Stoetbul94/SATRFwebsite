import { Box, Divider, VStack } from '@chakra-ui/react';
import EventHubHeader from '@/components/events/hub/EventHubHeader';
import EventHubSectionNav, { type HubSection } from '@/components/events/hub/EventHubSectionNav';
import EventHubOverview from '@/components/events/hub/EventHubOverview';
import EventHubEntries from '@/components/events/hub/EventHubEntries';
import EventHubDocuments from '@/components/events/hub/EventHubDocuments';
import EventResultsSection from '@/components/events/results/EventResultsSection';
import type { CalendarEventInput } from '@/lib/eventCalendarLinks';
import type { EventHubViewModel } from '@/lib/eventHub/types';

type Props = {
  event: EventHubViewModel;
  calendarInput: CalendarEventInput;
  onRegister: () => void;
  registerDisabled: boolean;
  registerLabel: string;
};

export default function EventHubShell({
  event,
  calendarInput,
  onRegister,
  registerDisabled,
  registerLabel,
}: Props) {
  const sections: HubSection[] = ['overview', 'entries'];
  if (event.documents.length > 0) sections.push('documents');
  sections.push('results');

  return (
    <VStack align="stretch" spacing={8} data-testid="event-hub-shell">
      <EventHubHeader
        event={event}
        calendarInput={calendarInput}
        onRegister={onRegister}
        registerDisabled={registerDisabled}
        registerLabel={registerLabel}
      />

      <EventHubSectionNav sections={sections} />

      <EventHubOverview event={event} />
      <Divider />
      <EventHubEntries
        event={event}
        onRegister={onRegister}
        registerDisabled={registerDisabled}
        registerLabel={registerLabel}
      />

      {event.documents.length > 0 && (
        <>
          <Divider />
          <EventHubDocuments documents={event.documents} />
        </>
      )}

      <Divider />
      <EventResultsSection eventId={event.id} eventTitle={event.title} />
    </VStack>
  );
}
