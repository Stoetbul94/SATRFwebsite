'use client';

import { Box, Container, type BoxProps } from '@chakra-ui/react';

interface PublicPageShellProps extends BoxProps {
  children: React.ReactNode;
  maxW?: string;
}

/** Standard public page canvas + container rhythm. */
export default function PublicPageShell({
  children,
  maxW = 'container.xl',
  ...props
}: PublicPageShellProps) {
  return (
    <Box bg="bg.canvas" minH="100vh" py={{ base: 6, md: 10 }} {...props}>
      <Container maxW={maxW}>{children}</Container>
    </Box>
  );
}
