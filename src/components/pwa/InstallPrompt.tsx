'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Button, Flex, Text, CloseButton } from '@chakra-ui/react';
import { usePWAInstall } from '@/contexts/PWAInstallContext';
import { isBannerDismissedRecently, isHiddenInstallPath } from '@/lib/pwa/installUtils';

export default function InstallPrompt() {
  const router = useRouter();
  const {
    canNativeInstall,
    postLoginNudge,
    showInstallEntry,
    promptInstall,
    dismissBanner,
    openInstructions,
    openBanner,
    bannerOpen,
  } = usePWAInstall();

  useEffect(() => {
    if (!showInstallEntry || isHiddenInstallPath(router.pathname)) return;

    if (postLoginNudge) {
      openBanner();
      return;
    }

    if (canNativeInstall && !isBannerDismissedRecently()) {
      openBanner();
    }
  }, [canNativeInstall, postLoginNudge, router.pathname, showInstallEntry, openBanner]);

  useEffect(() => {
    if (isHiddenInstallPath(router.pathname)) return;
    if (postLoginNudge && showInstallEntry) {
      openBanner();
    }
  }, [router.pathname, postLoginNudge, showInstallEntry, openBanner]);

  const dismiss = useCallback(() => {
    dismissBanner({ permanentPostLogin: postLoginNudge });
  }, [dismissBanner, postLoginNudge]);

  const install = useCallback(async () => {
    if (canNativeInstall) {
      await promptInstall();
      return;
    }
    openInstructions();
  }, [canNativeInstall, promptInstall, openInstructions]);

  if (!bannerOpen || !showInstallEntry || isHiddenInstallPath(router.pathname)) {
    return null;
  }

  const title = postLoginNudge ? 'Welcome back — install SATRF' : 'Install SATRF App';
  const body = postLoginNudge
    ? 'Add SATRF to your home screen for quicker access after sign-in.'
    : 'Add SATRF to your home screen for quicker access to events, results and notices.';

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
          {title}
        </Text>
        <CloseButton size="sm" onClick={dismiss} aria-label="Dismiss install prompt" />
      </Flex>
      <Text fontSize="sm" color="gray.600" mb={3}>
        {body}
      </Text>
      <Flex gap={2}>
        <Button size="sm" colorScheme="red" bg="#e53e3e" _hover={{ bg: '#c53030' }} onClick={install}>
          {canNativeInstall ? 'Install' : 'How to install'}
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Not now
        </Button>
      </Flex>
    </Box>
  );
}
