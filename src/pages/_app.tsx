import type { AppProps } from 'next/app';
import React from 'react';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import '@/styles/globals.css';
import { Oxanium } from 'next/font/google';

const oxanium = Oxanium({ 
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-oxanium',
});

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      900: '#0d47a1',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
      },
    },
  },
});

// Simple error boundary component (Sentry integration handled by config files)
function CustomErrorBoundary({ children }: { children: React.ReactNode }) {
  // For now, just pass through - Sentry is initialized via config files
  // ErrorBoundary from Sentry would be added here if DSN is configured
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomErrorBoundary>
      <div className={oxanium.variable}>
        <ChakraProvider theme={theme}>
          <AuthProvider>
            <Component {...pageProps} />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#4ade80',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
                      />
          </AuthProvider>
        </ChakraProvider>
      </div>
    </CustomErrorBoundary>
  );
} 