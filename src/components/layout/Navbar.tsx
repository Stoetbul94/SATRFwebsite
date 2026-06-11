'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Flex,
  Button,
  Text,
  IconButton,
  VStack,
  HStack,
  Collapse,
} from '@chakra-ui/react';
import { FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import FlagStripe from '@/components/brand/FlagStripe';
import SatrfNavEmblem from '@/components/brand/SatrfNavEmblem';
import UserNavMenu from '@/components/layout/UserNavMenu';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((o) => !o);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = async () => {
    await logout();
  };

  const NavLink = ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <Link href={href} onClick={onClick}>
      <Text
        px={3}
        py={2}
        rounded="md"
        fontSize={{ base: 'sm', md: 'md' }}
        fontWeight="700"
        fontFamily="heading"
        letterSpacing="0.05em"
        textTransform="uppercase"
        color="whiteAlpha.900"
        _hover={{ bg: 'whiteAlpha.200' }}
        transition="all 0.2s"
      >
        {children}
      </Text>
    </Link>
  );

  return (
    <Box as="header" bg="brand" shadow="md" position="relative">
      <FlagStripe position="absolute" bottom={0} left={0} right={0} thickness={3} opacity={1} />
      <Box maxW="7xl" mx="auto" px={{ base: 3, sm: 6, lg: 8 }} py={{ base: 2, md: 3 }}>
        <Flex justify="space-between" align="center" minH={{ base: '16', md: '20' }} gap={2}>
          <Box flexShrink={0} minW={0}>
            <SatrfNavEmblem showWordmark />
          </Box>

          <Box display={{ base: 'none', md: 'block' }} flex={1}>
            <HStack spacing={1} ml={4} justify="center">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/events">Events</NavLink>
              <NavLink href="/scores">Scores</NavLink>
              <NavLink href="/coaching">Coaching</NavLink>
              <NavLink href="/scores/leaderboard">Leaderboard</NavLink>
              <NavLink href="/rules">Rules</NavLink>
              <NavLink href="/about">About</NavLink>
              <NavLink href="/contact">Contact</NavLink>
              <NavLink href="/donate">Donate</NavLink>
            </HStack>
          </Box>

          <HStack spacing={2} flexShrink={0}>
            <Box display={{ base: 'none', md: 'block' }}>
              {isAuthenticated && user ? (
                <UserNavMenu user={user} onLogout={handleLogout} />
              ) : (
                <HStack spacing={3}>
                  <NavLink href="/login">Login</NavLink>
                  <Link href="/register">
                    <Button size="md" variant="satrfGold">
                      Join SATRF
                    </Button>
                  </Link>
                </HStack>
              )}
            </Box>

            <Box display={{ base: 'block', md: 'none' }}>
              <IconButton
                aria-label="Toggle mobile menu"
                icon={isMobileMenuOpen ? <FiX /> : <FiMenu />}
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={toggleMobileMenu}
                size="md"
              />
            </Box>
          </HStack>
        </Flex>
      </Box>

      <Collapse in={isMobileMenuOpen} animateOpacity>
        <Box display={{ base: 'block', md: 'none' }} bg="satrf.green.800" pb={3}>
          <VStack spacing={1} px={2} pt={2} align="stretch">
            <NavLink href="/" onClick={closeMobileMenu}>Home</NavLink>
            <NavLink href="/events" onClick={closeMobileMenu}>Events</NavLink>
            <NavLink href="/scores" onClick={closeMobileMenu}>Scores</NavLink>
            <NavLink href="/coaching" onClick={closeMobileMenu}>Coaching</NavLink>
            <NavLink href="/scores/leaderboard" onClick={closeMobileMenu}>Leaderboard</NavLink>
            <NavLink href="/rules" onClick={closeMobileMenu}>Rules</NavLink>
            <NavLink href="/about" onClick={closeMobileMenu}>About</NavLink>
            <NavLink href="/contact" onClick={closeMobileMenu}>Contact</NavLink>
            <NavLink href="/donate" onClick={closeMobileMenu}>Donate</NavLink>

            {isAuthenticated && user ? (
              <UserNavMenu
                user={user}
                onLogout={handleLogout}
                variant="stack"
                onNavigate={closeMobileMenu}
              />
            ) : (
              <>
                <NavLink href="/login" onClick={closeMobileMenu}>Login</NavLink>
                <Link href="/register" onClick={closeMobileMenu}>
                  <Button variant="satrfGold" w="full" mx={2} mt={2}>
                    Join SATRF
                  </Button>
                </Link>
              </>
            )}
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
}
