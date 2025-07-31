import { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  user?: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function Layout({ children, user }: LayoutProps) {
  return (
    <Box minH="100vh" display="flex" flexDirection="column">
      <Navbar user={user} />
      <Box as="main" flex="1">
        {children}
      </Box>
      <Footer />
    </Box>
  );
} 