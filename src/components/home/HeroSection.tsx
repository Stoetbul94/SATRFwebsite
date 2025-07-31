import { Box, Container, Heading, Text, Button, Stack, Image as ChakraImage, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import Image from 'next/image';

const HeroSection = () => {
  const router = useRouter();
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Box
      bg={bgColor}
      position="relative"
      overflow="hidden"
      py={20}
      backgroundImage="url('/images/hero-bg.jpg')"
      backgroundSize="cover"
      backgroundPosition="center"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: 'blackAlpha.600',
        zIndex: 1,
      }}
    >
      <Container maxW="container.xl" position="relative" zIndex={2}>
        <Stack spacing={8} align="center" textAlign="center" color="white">
          <Box mb={2}>
            <Image
              src="/SATRFLOGO.png"
              alt="SATRF Logo"
              width={100}
              height={100}
              style={{ borderRadius: '50%' }}
              priority
            />
          </Box>
          <Heading
            as="h1"
            size="2xl"
            fontWeight="bold"
            textShadow="2px 2px 4px rgba(0,0,0,0.5)"
          >
            South African Target Rifle Federation
          </Heading>
          <Text
            fontSize="xl"
            maxW="2xl"
            textShadow="1px 1px 2px rgba(0,0,0,0.5)"
          >
            Promoting excellence in target rifle shooting across South Africa. Join us in our mission to develop and support competitive shooting sports.
          </Text>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
            <Button
              size="lg"
              colorScheme="red"
              onClick={() => router.push('/join')}
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
            >
              Join SATRF
            </Button>
            <Button
              size="lg"
              variant="outline"
              color="white"
              borderColor="white"
              onClick={() => router.push('/events')}
              _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-2px)' }}
            >
              View Events
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default HeroSection; 