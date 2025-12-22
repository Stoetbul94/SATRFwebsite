import { Box, Container, Heading, Text, Button, Stack, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const CallToAction = () => {
  const router = useRouter();
  const bgColor = useColorModeValue('red.50', 'red.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box bg={bgColor} py={16}>
      <Container maxW="container.xl">
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={8}
          align="center"
          justify="space-between"
        >
          <Stack spacing={4} maxW="2xl">
            <Heading size="xl">Join the South African Target Rifle Federation</Heading>
            <Text fontSize="lg" color={textColor}>
              Become part of our growing community of precision shooters. Access exclusive benefits,
              training resources, and compete in national and international events.
            </Text>
          </Stack>
          <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
            <Button
              size="lg"
              colorScheme="red"
              onClick={() => router.push('/join')}
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            >
              Join Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/contact')}
              _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-2px)' }}
            >
              Contact Us
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default CallToAction; 