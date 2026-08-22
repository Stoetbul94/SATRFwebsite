import { Button, HStack, Wrap, WrapItem } from '@chakra-ui/react';

export type HubSection = 'overview' | 'entries' | 'documents' | 'results';

type Props = {
  sections: HubSection[];
  active?: HubSection;
};

const LABELS: Record<HubSection, string> = {
  overview: 'Overview',
  entries: 'Entries',
  documents: 'Documents',
  results: 'Results',
};

export default function EventHubSectionNav({ sections }: Props) {
  return (
    <HStack
      as="nav"
      aria-label="Event sections"
      spacing={2}
      overflowX="auto"
      py={2}
      mb={4}
      borderBottomWidth="1px"
      borderColor="border.subtle"
      data-testid="event-hub-nav"
    >
      <Wrap spacing={2}>
        {sections.map((section) => (
          <WrapItem key={section}>
            <Button
              as="a"
              href={`#${section}`}
              size="sm"
              variant="satrfOutline"
              minH="44px"
              scrollBehavior="smooth"
            >
              {LABELS[section]}
            </Button>
          </WrapItem>
        ))}
      </Wrap>
    </HStack>
  );
}
