import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Spinner, Text, Center } from '@chakra-ui/react';

export default function LeaderboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct leaderboard path
    router.replace('/scores/leaderboard');
  }, [router]);

  return (
    <Center minH="50vh">
      <Box textAlign="center">
        <Spinner size="xl" color="blue.500" mb={4} />
        <Text fontSize="lg" color="gray.600">
          Redirecting to leaderboard...
        </Text>
      </Box>
    </Center>
  );
} 