'use client';

import { Button, Text, type ButtonProps } from '@chakra-ui/react';
import { FiDownload } from 'react-icons/fi';
import { usePWAInstall } from '@/contexts/PWAInstallContext';

type InstallAppActionProps = {
  variant?: 'footer-link' | 'button' | 'outline-button';
  label?: string;
} & Pick<ButtonProps, 'size' | 'width'>;

export default function InstallAppAction({
  variant = 'button',
  label = 'Install SATRF App',
  size = 'sm',
  width,
}: InstallAppActionProps) {
  const { showInstallEntry, canNativeInstall, promptInstall, openInstructions } = usePWAInstall();

  if (!showInstallEntry) {
    return null;
  }

  const handleClick = async () => {
    if (canNativeInstall) {
      await promptInstall();
      return;
    }
    openInstructions();
  };

  if (variant === 'footer-link') {
    return (
      <Text
        as="button"
        type="button"
        color="whiteAlpha.700"
        fontSize="sm"
        textAlign="left"
        _hover={{ color: 'white' }}
        transition="all 0.2s"
        onClick={handleClick}
      >
        {label}
      </Text>
    );
  }

  const isOutline = variant === 'outline-button';

  return (
    <Button
      leftIcon={<FiDownload />}
      size={size}
      width={width}
      colorScheme={isOutline ? 'blue' : 'red'}
      bg={isOutline ? undefined : '#e53e3e'}
      _hover={isOutline ? undefined : { bg: '#c53030' }}
      variant={isOutline ? 'outline' : 'solid'}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
