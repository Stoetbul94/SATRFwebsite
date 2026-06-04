'use client';

import { useEffect, useState } from 'react';
import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { isEmailAdmin } from '@/lib/adminClient';
import EventResultsTable from './EventResultsTable';

interface EventResultsSectionProps {
  eventId: string;
  eventTitle?: string;
}

export default function EventResultsSection({ eventId, eventTitle }: EventResultsSectionProps) {
  const subColor = useColorModeValue('gray.600', 'gray.400');
  const { user } = useAuth();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const isAdmin = !!user?.email && isEmailAdmin(user.email);

  useEffect(() => {
    if (!isAdmin) {
      setAuthToken(null);
      return;
    }
    auth.currentUser?.getIdToken().then(setAuthToken).catch(() => setAuthToken(null));
  }, [isAdmin, user?.uid]);

  return (
    <Box id="results" scrollMarginTop="24" w="100%">
      <Heading size="lg" color="satrf.navy" mb={1}>
        Results
      </Heading>
      {eventTitle && (
        <Text fontSize="sm" color={subColor} mb={2}>
          Match results for {eventTitle}
        </Text>
      )}
      {isAdmin && (
        <Text fontSize="xs" color={subColor} mb={6}>
          Admin view: provisional scores included when published.
        </Text>
      )}
      {!isAdmin && <Box mb={6} />}
      <EventResultsTable
        eventId={eventId}
        includeProvisional={isAdmin}
        authToken={authToken}
      />
    </Box>
  );
}
