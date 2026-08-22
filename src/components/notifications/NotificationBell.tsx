'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Spinner,
  Text,
  VStack,
  VisuallyHidden,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FiBell } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '@/lib/firebase';
import { formatNotificationWhen } from '@/lib/notifications/formatRelative';
import type { UserNotificationView } from '@/lib/notifications/types';

async function getToken(): Promise<string | null> {
  const fresh = await auth.currentUser?.getIdToken().catch(() => null);
  if (fresh) return fresh;
  return typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
}

export default function NotificationBell() {
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UserNotificationView[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [badge, setBadge] = useState<string | null>(null);
  const fetchedOnce = useRef(false);

  const fetchDropdown = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?view=dropdown', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setItems(data.notifications || []);
      setUnreadCount(Number(data.unreadCount) || 0);
      setBadge(typeof data.badge === 'string' ? data.badge : null);
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;
    void fetchDropdown();
    const interval = window.setInterval(() => {
      void fetchDropdown();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [fetchDropdown]);

  const markReadAndNavigate = async (item: UserNotificationView) => {
    const token = await getToken();
    if (token && item.unread) {
      await fetch(`/api/notifications/${item.id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, unread: false, readAt: new Date().toISOString() }
            : row,
        ),
      );
      setUnreadCount((count) => {
        const next = Math.max(0, count - 1);
        setBadge(next <= 0 ? null : next > 99 ? '99+' : String(next));
        return next;
      });
    }
    onClose();
    if (item.href) {
      void router.push(item.href);
    }
  };

  const markAllRead = async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'read-all' }),
      });
      if (!response.ok) throw new Error('Failed');
      setItems((prev) =>
        prev.map((row) => ({ ...row, unread: false, readAt: row.readAt || new Date().toISOString() })),
      );
      setUnreadCount(0);
      setBadge(null);
    } catch {
      toast({ title: 'Could not mark all as read', status: 'error', duration: 2500 });
    }
  };

  const ariaLabel =
    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications';

  return (
    <Popover
      isOpen={isOpen}
      onOpen={() => {
        onOpen();
        void fetchDropdown();
      }}
      onClose={onClose}
      placement="bottom-end"
      closeOnBlur
      isLazy
    >
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <IconButton
            aria-label={ariaLabel}
            icon={<FiBell />}
            variant="ghost"
            color="white"
            size="md"
            minW="44px"
            minH="44px"
            _hover={{ bg: 'whiteAlpha.200' }}
            data-testid="notification-bell"
          />
          {badge && (
            <Badge
              position="absolute"
              top="2px"
              right="2px"
              borderRadius="full"
              colorScheme="red"
              fontSize="0.65rem"
              minW="18px"
              textAlign="center"
              pointerEvents="none"
              data-testid="notification-badge"
            >
              {badge}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <Portal>
        <PopoverContent
          w={{ base: '92vw', sm: '360px' }}
          maxW="360px"
          borderColor="border.subtle"
          shadow="lg"
          _focus={{ outline: 'none' }}
          data-testid="notification-dropdown"
        >
          <PopoverHeader fontWeight="bold" borderColor="border.subtle">
            Notifications
          </PopoverHeader>
          <PopoverBody p={0}>
            {loading && items.length === 0 ? (
              <HStack justify="center" py={8}>
                <Spinner size="sm" />
              </HStack>
            ) : items.length === 0 ? (
              <Box px={4} py={6} data-testid="notification-empty">
                <Text fontWeight="medium">No notifications yet.</Text>
                <Text fontSize="sm" color="text.muted" mt={1}>
                  Important event and account updates will appear here.
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={0} divider={<Divider />}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    as="button"
                    textAlign="left"
                    px={4}
                    py={3}
                    bg={item.unread ? 'blackAlpha.50' : 'transparent'}
                    _hover={{ bg: 'blackAlpha.100' }}
                    onClick={() => void markReadAndNavigate(item)}
                    minH="44px"
                  >
                    <HStack align="start" spacing={2}>
                      {item.unread && (
                        <Box
                          mt={2}
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg="satrf.green.600"
                          flexShrink={0}
                          aria-hidden
                        />
                      )}
                      <Box flex={1} minW={0}>
                        <Text fontWeight={item.unread ? 'bold' : 'semibold'} fontSize="sm">
                          {item.title}
                          {item.unread ? <VisuallyHidden> (unread)</VisuallyHidden> : null}
                        </Text>
                        <Text fontSize="sm" color="text.muted" noOfLines={2}>
                          {item.message}
                        </Text>
                        <Text fontSize="xs" color="text.muted" mt={1}>
                          {formatNotificationWhen(item.publishedAt)}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
            <Divider />
            <HStack justify="space-between" px={3} py={2}>
              <Button size="sm" variant="ghost" onClick={() => void markAllRead()} minH="40px">
                Mark all as read
              </Button>
              <Button
                as={Link}
                href="/notifications"
                size="sm"
                variant="ghost"
                onClick={onClose}
                minH="40px"
              >
                View all
              </Button>
            </HStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}
