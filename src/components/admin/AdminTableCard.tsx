import { Box, type BoxProps } from '@chakra-ui/react';

/** Bordered surface wrapper for admin data tables — scrolls on narrow viewports. */
export default function AdminTableCard({ children, ...props }: BoxProps) {
  return (
    <Box
      bg="bg.surface"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="border.default"
      boxShadow="sm"
      overflowX="auto"
      {...props}
    >
      {children}
    </Box>
  );
}
