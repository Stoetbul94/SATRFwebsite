'use client';

import Link from 'next/link';
import {
  Avatar,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  HStack,
  Text,
  Icon,
  VStack,
  Box,
} from '@chakra-ui/react';
import { FiChevronDown, FiShield, FiGrid, FiUser, FiLogOut } from 'react-icons/fi';
import type { UserProfile } from '@/lib/auth';
import { isUserAdmin } from '@/lib/userRole';
import { isAdminAthlete } from '@/lib/userAthlete';

interface UserNavMenuProps {
  user: UserProfile;
  onLogout: () => void | Promise<void>;
  /** Compact list style for mobile drawer */
  variant?: 'menu' | 'stack';
  onNavigate?: () => void;
}

function userInitials(user: UserProfile): string {
  const a = (user.firstName?.[0] || '').toUpperCase();
  const b = (user.lastName?.[0] || '').toUpperCase();
  return a + b || '?';
}

export default function UserNavMenu({
  user,
  onLogout,
  variant = 'menu',
  onNavigate,
}: UserNavMenuProps) {
  const isAdmin = isUserAdmin(user);
  const showMemberDashboard = !isAdmin || isAdminAthlete(user);
  const showAdminNav = isAdmin;

  const items = [
    showMemberDashboard && {
      key: 'dashboard',
      label: 'My Dashboard',
      href: '/dashboard',
      icon: FiGrid,
    },
    showAdminNav && {
      key: 'admin',
      label: 'Admin Panel',
      href: '/admin/dashboard',
      icon: FiShield,
    },
    {
      key: 'profile',
      label: 'My Profile',
      href: '/profile',
      icon: FiUser,
    },
  ].filter(Boolean) as { key: string; label: string; href: string; icon: typeof FiUser }[];

  if (variant === 'stack') {
    return (
      <VStack align="stretch" spacing={1} pt={2} borderTopWidth="1px" borderColor="whiteAlpha.300">
        <HStack px={3} py={2} spacing={3}>
          <Avatar size="sm" name={`${user.firstName} ${user.lastName}`} bg="satrf.gold.500" color="satrf.navy" />
          <Text color="whiteAlpha.900" fontWeight="semibold" fontSize="sm">
            {user.firstName}
          </Text>
        </HStack>
        {items.map((item) => (
          <Button
            key={item.key}
            as={Link}
            href={item.href}
            variant="ghost"
            color="white"
            justifyContent="flex-start"
            leftIcon={<Icon as={item.icon} />}
            onClick={onNavigate}
            px={3}
            fontWeight="medium"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            {item.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          color="white"
          justifyContent="flex-start"
          leftIcon={<FiLogOut />}
          onClick={() => {
            onNavigate?.();
            void onLogout();
          }}
          px={3}
        >
          Logout
        </Button>
      </VStack>
    );
  }

  return (
    <Menu placement="bottom-end">
      <MenuButton
        as={Button}
        variant="ghost"
        color="white"
        size="sm"
        px={2}
        _hover={{ bg: 'whiteAlpha.200' }}
        _active={{ bg: 'whiteAlpha.300' }}
        rightIcon={<FiChevronDown />}
      >
        <HStack spacing={2}>
          <Avatar
            size="sm"
            name={`${user.firstName} ${user.lastName}`}
            bg="satrf.gold.500"
            color="satrf.navy"
            fontSize="xs"
            getInitials={() => userInitials(user)}
          />
          <Text fontSize="sm" fontWeight="600" display={{ base: 'none', lg: 'block' }}>
            {user.firstName}
          </Text>
        </HStack>
      </MenuButton>
      <MenuList minW="200px" shadow="lg" borderColor="border.subtle">
        <Box px={3} py={2} borderBottomWidth="1px" borderColor="border.subtle">
          <Text fontWeight="semibold" fontSize="sm" color="text.primary">
            {user.firstName} {user.lastName}
          </Text>
          <Text fontSize="xs" color="text.muted" noOfLines={1}>
            {user.email}
          </Text>
        </Box>
        {items.map((item) => (
          <MenuItem
            key={item.key}
            as={Link}
            href={item.href}
            icon={<Icon as={item.icon} />}
            fontWeight="medium"
          >
            {item.label}
          </MenuItem>
        ))}
        <MenuDivider />
        <MenuItem icon={<FiLogOut />} onClick={() => void onLogout()} color="red.600">
          Logout
        </MenuItem>
      </MenuList>
    </Menu>
  );
}
