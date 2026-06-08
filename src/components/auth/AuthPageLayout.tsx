'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  Box,
  Card,
  CardBody,
  Container,
  Heading,
  Text,
  VStack,
  Link as ChakraLink,
  HStack,
  Icon,
} from '@chakra-ui/react';
import { FiArrowLeft } from 'react-icons/fi';
import FlagStripe from '@/components/brand/FlagStripe';
import SatrfHorizontalLogo from '@/components/brand/SatrfHorizontalLogo';

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Optional icon above the title (brand accent, not cyan) */
  headerIcon?: ReactNode;
}

/** Shared branded shell for login / register — visual only. */
export default function AuthPageLayout({
  title,
  subtitle,
  children,
  headerIcon,
}: AuthPageLayoutProps) {
  return (
    <Box bg="bg.canvas" minH="100vh" py={{ base: 8, md: 12 }} px={4} position="relative">
      <Box position="absolute" top={{ base: 3, md: 4 }} left={{ base: 3, md: 6 }} zIndex={1}>
        <ChakraLink
          as={Link}
          href="/"
          display="inline-flex"
          alignItems="center"
          gap={2}
          fontSize="sm"
          fontWeight="medium"
          color="satrf.green.700"
          _hover={{ color: 'satrf.gold.600', textDecoration: 'none' }}
        >
          <Icon as={FiArrowLeft} boxSize={4} aria-hidden />
          Back to Home
        </ChakraLink>
      </Box>

      <Container maxW="md" centerContent>
        <Card
          w="full"
          bg="bg.surface"
          borderWidth="1px"
          borderColor="border.subtle"
          shadow="md"
          overflow="hidden"
          borderRadius="lg"
        >
          <FlagStripe thickness={3} />
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              <VStack spacing={4} textAlign="center">
                <SatrfHorizontalLogo variant="footer" alignSelf="center" />
                {headerIcon}
                <Box>
                  <Heading
                    as="h1"
                    size="lg"
                    color="satrf.navy"
                    fontFamily="heading"
                    letterSpacing="tight"
                  >
                    {title}
                  </Heading>
                  <Text mt={2} color="text.muted" fontSize="sm">
                    {subtitle}
                  </Text>
                </Box>
              </VStack>
              {children}
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}

export function AuthHeaderIcon({ children }: { children: ReactNode }) {
  return (
    <HStack
      justify="center"
      w="12"
      h="12"
      mx="auto"
      rounded="full"
      bg="satrf.green.50"
      color="satrf.green.700"
      borderWidth="1px"
      borderColor="satrf.green.200"
    >
      {children}
    </HStack>
  );
}
