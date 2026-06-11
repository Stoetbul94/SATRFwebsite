'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Link as ChakraLink,
  HStack,
  Icon,
  usePrefersReducedMotion,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiArrowLeft } from 'react-icons/fi';
import FlagStripe from '@/components/brand/FlagStripe';
import SatrfWordmark from '@/components/brand/SatrfWordmark';
import TargetRingMotif from '@/components/brand/TargetRingMotif';

const MotionBox = motion(Box);

interface AuthPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  headerIcon?: ReactNode;
}

function BrandPanel({ compact = false }: { compact?: boolean }) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Box
      position="relative"
      overflow="hidden"
      bgGradient="linear(to-br, satrf.green.900, satrf.navy)"
      color="white"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      px={compact ? 6 : { base: 8, lg: 12 }}
      py={compact ? 8 : { base: 10, lg: 16 }}
      minH={compact ? undefined : { lg: '100vh' }}
    >
      <TargetRingMotif top="-8%" right="-12%" size={compact ? 180 : 320} opacity={0.12} color="white" />
      <TargetRingMotif bottom="-10%" left="-8%" size={compact ? 140 : 260} opacity={0.08} color="satrf.gold.400" />

      <MotionBox
        position="relative"
        zIndex={1}
        textAlign="center"
        initial={reducedMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        <Image
          src="/brand/satrf-emblem-transparent.png"
          alt="SATRF emblem"
          width={588}
          height={644}
          priority
          style={{
            height: compact ? '72px' : 'clamp(100px, 18vw, 160px)',
            width: 'auto',
            margin: '0 auto',
            objectFit: 'contain',
          }}
        />
        <SatrfWordmark
          tone="light"
          as="p"
          display="block"
          fontSize={compact ? 'xl' : { base: '2xl', lg: '3xl' }}
          mt={compact ? 3 : 6}
        />
        <Text
          mt={compact ? 2 : 4}
          fontSize={compact ? 'sm' : { base: 'md', lg: 'lg' }}
          color="whiteAlpha.850"
          maxW="xs"
          mx="auto"
          lineHeight="tall"
        >
          South African Target Rifle Federation
        </Text>
        {!compact && (
          <Text mt={3} fontSize="sm" color="satrf.gold.300" fontWeight="medium">
            Precision · Community · Excellence
          </Text>
        )}
      </MotionBox>

      <Box position="absolute" bottom={0} left={0} right={0}>
        <FlagStripe thickness={4} opacity={1} />
      </Box>
    </Box>
  );
}

/** Split-screen branded shell for login / register / forgot-password. */
export default function AuthPageLayout({
  title,
  subtitle,
  children,
  headerIcon,
}: AuthPageLayoutProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }} bg="bg.canvas">
      {/* Mobile / tablet compact brand header */}
      <Box display={{ base: 'block', lg: 'none' }} w="100%">
        <BrandPanel compact />
      </Box>

      {/* Desktop brand side */}
      <Box display={{ base: 'none', lg: 'block' }} flex="1" maxW={{ lg: '48%' }}>
        <BrandPanel />
      </Box>

      {/* Form side */}
      <Flex
        flex="1"
        direction="column"
        justify="center"
        px={{ base: 4, sm: 8, lg: 12 }}
        py={{ base: 8, lg: 12 }}
        position="relative"
      >
        <Box position="absolute" top={{ base: 4, lg: 6 }} left={{ base: 4, lg: 8 }}>
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

        <MotionBox
          w="full"
          maxW="md"
          mx="auto"
          initial={reducedMotion ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: reducedMotion ? 0 : 0.1 }}
        >
          <VStack align="stretch" spacing={8}>
            <VStack align="stretch" spacing={3} textAlign="left">
              {headerIcon && <HStack justify="flex-start">{headerIcon}</HStack>}
              <Heading
                as="h1"
                size={{ base: 'lg', md: 'xl' }}
                color="satrf.navy"
                fontFamily="heading"
                letterSpacing="tight"
              >
                {title}
              </Heading>
              <Text color="text.muted" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">
                {subtitle}
              </Text>
            </VStack>
            {children}
          </VStack>
        </MotionBox>
      </Flex>
    </Flex>
  );
}

export function AuthHeaderIcon({ children }: { children: ReactNode }) {
  return (
    <HStack
      justify="center"
      w="12"
      h="12"
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
