import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Text,
  VStack,
  HStack,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';

export default function Footer() {
  const bgColor = useColorModeValue('blue.900', 'blue.800');
  const textColor = useColorModeValue('white', 'gray.100');
  const linkColor = useColorModeValue('gray.300', 'gray.400');
  const borderColor = useColorModeValue('gray.700', 'gray.600');

  return (
    <Box as="footer" bg={bgColor} color={textColor}>
      <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={12}>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={8}>
          {/* Logo and Description */}
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Flex align="center" mb={4}>
              <Image
                src="/images/SATRFLOGO.png"
                alt="SATRF Logo"
                width={120}
                height={40}
                style={{ height: '40px', width: 'auto' }}
              />
            </Flex>
            <Text color={linkColor} fontSize="sm" lineHeight="relaxed" maxW="md">
              The South African Target Rifle Federation promotes excellence in precision shooting 
              and provides a platform for competitive target rifle shooting across South Africa.
            </Text>
          </GridItem>

          {/* Quick Links */}
          <GridItem>
            <VStack align="flex-start" spacing={4}>
              <Text fontSize="lg" fontWeight="semibold">Quick Links</Text>
              <VStack align="flex-start" spacing={2}>
                <Link href="/about">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    About SATRF
                  </Text>
                </Link>
                <Link href="/events">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Events
                  </Text>
                </Link>
                <Link href="/scores">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Scores
                  </Text>
                </Link>
                <Link href="/leaderboard">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Leaderboard
                  </Text>
                </Link>
                <Link href="/media">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Media
                  </Text>
                </Link>
              </VStack>
            </VStack>
          </GridItem>

          {/* Contact & Support */}
          <GridItem>
            <VStack align="flex-start" spacing={4}>
              <Text fontSize="lg" fontWeight="semibold">Contact & Support</Text>
              <VStack align="flex-start" spacing={2}>
                <Link href="/contact">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Contact Us
                  </Text>
                </Link>
                <Link href="/forum">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Forum
                  </Text>
                </Link>
                <Link href="/privacy">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Privacy Policy
                  </Text>
                </Link>
                <Link href="/terms">
                  <Text color={linkColor} _hover={{ color: textColor }} transition="all 0.2s">
                    Terms of Service
                  </Text>
                </Link>
              </VStack>
            </VStack>
          </GridItem>
        </Grid>

        {/* Bottom Bar */}
        <Box borderTop="1px" borderColor={borderColor} mt={8} pt={8}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
          >
            <Text color={linkColor} fontSize="sm">
              © 2024 South African Target Rifle Federation. All rights reserved.
            </Text>
            <HStack spacing={4} mt={{ base: 4, md: 0 }}>
              <Link href="/privacy">
                <Text color={linkColor} _hover={{ color: textColor }} fontSize="sm" transition="all 0.2s">
                  Privacy
                </Text>
              </Link>
              <Link href="/terms">
                <Text color={linkColor} _hover={{ color: textColor }} fontSize="sm" transition="all 0.2s">
                  Terms
                </Text>
              </Link>
              <Link href="/sitemap">
                <Text color={linkColor} _hover={{ color: textColor }} fontSize="sm" transition="all 0.2s">
                  Sitemap
                </Text>
              </Link>
            </HStack>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
} 