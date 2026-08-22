import { Button, HStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

type Props = {
  eventId: string;
};

const tabs = [
  { key: 'overview', label: 'Overview', href: (id: string) => `/admin/events/${id}` },
  {
    key: 'registrations',
    label: 'Registrations',
    href: (id: string) => `/admin/events/${id}/registrations`,
  },
  { key: 'documents', label: 'Documents', href: (id: string) => `/admin/events/${id}/documents` },
] as const;

export default function AdminEventSubNav({ eventId }: Props) {
  const router = useRouter();
  const path = router.pathname;

  const active =
    path.endsWith('/documents')
      ? 'documents'
      : path.endsWith('/registrations')
        ? 'registrations'
        : 'overview';

  return (
    <HStack spacing={2} flexWrap="wrap" mb={4} data-testid="admin-event-subnav">
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          as={Link}
          href={tab.href(eventId)}
          size="sm"
          variant={active === tab.key ? 'solid' : 'outline'}
          colorScheme={active === tab.key ? 'green' : 'gray'}
        >
          {tab.label}
        </Button>
      ))}
    </HStack>
  );
}
