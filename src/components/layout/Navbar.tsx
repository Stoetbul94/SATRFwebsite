'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Flex,
  Button,
  Text,
  IconButton,
  VStack,
  HStack,
  Collapse,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiMenu, FiX, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
  };

  const bgColor = useColorModeValue('blue.900', 'blue.800');
  const textColor = useColorModeValue('white', 'gray.100');
  const hoverColor = useColorModeValue('blue.700', 'blue.600');

  const NavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
    <Link href={href} onClick={onClick}>
      <Text
        px={3}
        py={2}
        rounded="md"
        textStyle="sm"
        fontWeight="medium"
        color={textColor}
        _hover={{ bg: hoverColor }}
        transition="all 0.2s"
      >
        {children}
      </Text>
    </Link>
  );

  return (
    <Box bg={bgColor} shadow="lg">
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
        <Flex justify="space-between" align="center" h="16">
          {/* Logo */}
          <Box flexShrink={0}>
            <Link href="/">
              <Flex align="center">
                <Image
                  src="/images/SATRFLOGO.png"
                  alt="SATRF Logo"
                  width={120}
                  height={40}
                  style={{ height: '40px', width: 'auto' }}
                />
              </Flex>
            </Link>
          </Box>

          {/* Desktop Navigation */}
          <Box display={{ base: 'none', md: 'block' }}>
            <HStack spacing={4} ml={10}>
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

          {/* User Menu / Auth Buttons */}
          <Box display={{ base: 'none', md: 'block' }}>
            <HStack spacing={4} ml={4}>
              {isAuthenticated && user ? (
                <>
                  <Text color={textColor} fontSize="sm">
                    Welcome, {user.firstName}
                  </Text>
                  <Link href="/dashboard">
                    <Button size="sm" variant="outline" colorScheme="blue">
                      Dashboard
                    </Button>
                  </Link>
                  <IconButton
                    aria-label="Logout"
                    icon={<FiLogOut />}
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: hoverColor }}
                    onClick={handleLogout}
                    size="sm"
                  />
                </>
              ) : (
                <>
                  <NavLink href="/login">Login</NavLink>
                  <Link href="/register">
                    <Button size="sm" colorScheme="blue">
                      Join SATRF
                    </Button>
                  </Link>
                </>
              )}
            </HStack>
          </Box>

          {/* Mobile menu button */}
          <Box display={{ base: 'block', md: 'none' }}>
            <IconButton
              aria-label="Toggle mobile menu"
              icon={isMobileMenuOpen ? <FiX /> : <FiMenu />}
              variant="ghost"
              color={textColor}
              _hover={{ bg: hoverColor }}
              onClick={toggleMobileMenu}
              size="md"
            />
          </Box>
        </Flex>
      </Box>

                {/* Mobile Navigation */}
      <Collapse in={isMobileMenuOpen} animateOpacity>
        <Box display={{ base: 'block', md: 'none' }}>
                      <VStack spacing={1} px={2} pt={2} pb={3} bg={bgColor}>
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
                <NavLink href="/dashboard" onClick={closeMobileMenu}>Dashboard</NavLink>
                <Button
                  variant="ghost"
                  color={textColor}
                  _hover={{ bg: hoverColor }}
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  w="full"
                  justifyContent="flex-start"
                  px={3}
                  py={2}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <NavLink href="/login" onClick={closeMobileMenu}>Login</NavLink>
                <Link href="/register" onClick={closeMobileMenu}>
                  <Button colorScheme="blue" w="full" mx={3} mt={4}>
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