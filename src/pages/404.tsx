import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { NextPage } from 'next';

const Custom404: NextPage = () => {
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
          404
        </Heading>
        <Text color={'gray.500'} mb={6}>
          The page you're looking for does not seem to exist
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

export default Custom404; 