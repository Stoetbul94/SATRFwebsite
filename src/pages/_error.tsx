import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { NextPage } from 'next';

interface ErrorProps {
  statusCode?: number;
}

const Error: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <Box textAlign="center" py={10} px={6}>
      <VStack spacing={4}>
        <Heading
          display="inline-block"
          as="h2"
          size="2xl"
          bgGradient="linear(to-r, blue.400, blue.600)"
          backgroundClip="text"
        >
          {statusCode ? `Error ${statusCode}` : 'An error occurred'}
        </Heading>
        <Text color={'gray.500'} mb={6}>
          {statusCode
            ? `An error ${statusCode} occurred on server`
            : 'An error occurred on client'}
        </Text>
        <Button
          colorScheme="blue"
          bgGradient="linear(to-r, blue.400, blue.500, blue.600)"
          color="white"
          variant="solid"
          onClick={() => window.location.href = '/'}
        >
          Go to Home
        </Button>
      </VStack>
    </Box>
  );
};

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error; 