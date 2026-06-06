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
import { FiMenu, FiX, FiLogOut, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { isEmailAdmin } from '@/lib/adminClient';
import { isUserAdmin } from '@/lib/userRole';
import FlagStripe from '@/components/brand/FlagStripe';
import SatrfHorizontalLogo from '@/components/brand/SatrfHorizontalLogo';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = user ? isUserAdmin(user as Parameters<typeof isUserAdmin>[0]) || isEmailAdmin(user.email) : false;

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
        fontSize="sm"
        fontWeight="600"
        fontFamily="heading"
        letterSpacing="0.04em"
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
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
        <Flex justify="space-between" align="center" h={{ base: '14', md: '16' }}>
          <Box flexShrink={0} py={1}>
            <Link href="/">
              <SatrfHorizontalLogo variant="nav" />
            </Link>
          </Box>

          <Box display={{ base: 'none', md: 'block' }}>
            <HStack spacing={1} ml={6}>
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

          <Box display={{ base: 'none', md: 'block' }}>
            <HStack spacing={3} ml={4}>
              {isAuthenticated && user ? (
                <>
                  <Text color="whiteAlpha.900" fontSize="sm" fontWeight="500">
                    {user.firstName}
                  </Text>
                  {!isAdmin && (
                    <Link href="/dashboard">
                      <Button size="sm" variant="satrfOutline" color="white" borderColor="whiteAlpha.600" _hover={{ bg: 'whiteAlpha.200' }}>
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin/dashboard">
                      <Button size="sm" variant="satrfGold" leftIcon={<FiShield />}>
                        Admin
                      </Button>
                    </Link>
                  )}
                  <IconButton
                    aria-label="Logout"
                    icon={<FiLogOut />}
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={handleLogout}
                    size="sm"
                  />
                </>
              ) : (
                <>
                  <NavLink href="/login">Login</NavLink>
                  <Link href="/register">
                    <Button size="sm" variant="satrfGold">
                      Join SATRF
                    </Button>
                  </Link>
                </>
              )}
            </HStack>
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
              <>
                <NavLink href="/profile" onClick={closeMobileMenu}>Profile</NavLink>
                {!isAdmin && (
                  <NavLink href="/dashboard" onClick={closeMobileMenu}>Dashboard</NavLink>
                )}
                {isAdmin && (
                  <NavLink href="/admin/dashboard" onClick={closeMobileMenu}>Admin</NavLink>
                )}
                <Button
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  justifyContent="flex-start"
                  px={3}
                >
                  Logout
                </Button>
              </>
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
