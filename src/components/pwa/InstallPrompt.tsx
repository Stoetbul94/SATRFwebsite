'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Flex, Text, CloseButton } from '@chakra-ui/react';

const STORAGE_KEY = 'satrf-pwa-install-dismissed';
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isDismissedRecently(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (!Number.isFinite(dismissedAt)) return false;
    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isHiddenPath(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/register'
  );
}

export default function InstallPrompt() {
  const router = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isDismissedRecently()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isHiddenPath(window.location.pathname)) {
        setVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  useEffect(() => {
    if (!deferredPrompt) return;
    if (isHiddenPath(router.pathname)) {
      setVisible(false);
    } else if (!isDismissedRecently()) {
      setVisible(true);
    }
  }, [router.pathname, deferredPrompt]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
    setDeferredPrompt(null);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      /* ignore */
    }
    setVisible(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!visible || !deferredPrompt || isHiddenPath(router.pathname)) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom={{ base: 4, md: 6 }}
      left={{ base: 4, md: 6 }}
      right={{ base: 4, md: 'auto' }}
      maxW="md"
      zIndex={1400}
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="lg"
      boxShadow="lg"
      p={4}
    >
      <Flex justify="space-between" align="flex-start" gap={2} mb={2}>
        <Text fontWeight="bold" color="#1a365d" fontSize="md">
          Install SATRF App
        </Text>
        <CloseButton size="sm" onClick={dismiss} aria-label="Dismiss install prompt" />
      </Flex>
      <Text fontSize="sm" color="gray.600" mb={3}>
        Add SATRF to your home screen for quicker access to events, results and notices.
      </Text>
      <Flex gap={2}>
        <Button size="sm" colorScheme="red" bg="#e53e3e" _hover={{ bg: '#c53030' }} onClick={install}>
          Install
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </Flex>
    </Box>
  );
}
