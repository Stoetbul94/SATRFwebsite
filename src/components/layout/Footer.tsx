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
} from '@chakra-ui/react';
import FlagStripe from '@/components/brand/FlagStripe';
import SatrfHorizontalLogo from '@/components/brand/SatrfHorizontalLogo';
import SocialLinks from '@/components/layout/SocialLinks';

export default function Footer() {
  const linkColor = 'whiteAlpha.700';
  const textColor = 'white';

  return (
    <Box as="footer" bg="satrf.navy" color={textColor} position="relative">
      <FlagStripe position="absolute" top={0} left={0} right={0} thickness={4} />
      <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} py={12} pt={14}>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={8}>
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Box mb={4}>
              <SatrfHorizontalLogo variant="footer" />
            </Box>
            <Text textStyle="eyebrow" mb={2} color="satrf.gold.400">
              Precision · Focus · Excellence
            </Text>
            <Text color={linkColor} fontSize="sm" lineHeight="relaxed" maxW="md" mb={4}>
              The South African Target Rifle Federation promotes excellence in precision shooting
              and provides a platform for competitive target rifle shooting across South Africa.
            </Text>
            <SocialLinks color={linkColor} hoverColor="white" />
          </GridItem>

          <GridItem>
            <VStack align="flex-start" spacing={4}>
              <Text fontSize="sm" textStyle="eyebrowGreen" color="satrf.gold.400">
                Quick Links
              </Text>
              <VStack align="flex-start" spacing={2}>
                {[
                  ['/about', 'About SATRF'],
                  ['/events', 'Events'],
                  ['/scores', 'Scores'],
                  ['/leaderboard', 'Leaderboard'],
                  ['/media', 'Media'],
                ].map(([href, label]) => (
                  <Link key={href} href={href}>
                    <Text color={linkColor} fontSize="sm" _hover={{ color: 'white' }} transition="all 0.2s">
                      {label}
                    </Text>
                  </Link>
                ))}
              </VStack>
            </VStack>
          </GridItem>

          <GridItem>
            <VStack align="flex-start" spacing={4}>
              <Text fontSize="sm" textStyle="eyebrowGreen" color="satrf.gold.400">
                Contact & Support
              </Text>
              <VStack align="flex-start" spacing={2}>
                {[
                  ['/contact', 'Contact Us'],
                  ['/forum', 'Forum'],
                  ['/privacy', 'Privacy Policy'],
                  ['/terms', 'Terms of Service'],
                ].map(([href, label]) => (
                  <Link key={href} href={href}>
                    <Text color={linkColor} fontSize="sm" _hover={{ color: 'white' }} transition="all 0.2s">
                      {label}
                    </Text>
                  </Link>
                ))}
              </VStack>
            </VStack>
          </GridItem>
        </Grid>

        <Box borderTop="1px" borderColor="whiteAlpha.200" mt={8} pt={8}>
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center">
            <Text color={linkColor} fontSize="sm">
              © {new Date().getFullYear()} South African Target Rifle Federation. All rights reserved.
            </Text>
            <HStack spacing={4} mt={{ base: 4, md: 0 }}>
              <Link href="/privacy">
                <Text color={linkColor} _hover={{ color: 'white' }} fontSize="sm">
                  Privacy
                </Text>
              </Link>
              <Link href="/terms">
                <Text color={linkColor} _hover={{ color: 'white' }} fontSize="sm">
                  Terms
                </Text>
              </Link>
            </HStack>
          </Flex>

          <Flex
            justify="center"
            align="center"
            gap={3}
            mt={6}
            pt={6}
            borderTop="1px"
            borderColor="whiteAlpha.100"
          >
            <Text color={linkColor} fontSize="xs">
              Designed by
            </Text>
            <Image
              src="/brand/tech-aim-logo.png"
              alt="Tech Aim Websites"
              width={160}
              height={48}
              className="h-9 w-auto object-contain"
            />
            <Text color="whiteAlpha.800" fontSize="xs" fontWeight="semibold">
              Tech Aim Websites
            </Text>
          </Flex>
        </Box>
      </Container>
    </Box>
  );
}
