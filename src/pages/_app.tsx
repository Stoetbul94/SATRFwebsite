import type { AppProps } from 'next/app';
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import '@/styles/globals.css';
import { fontVariables } from '@/lib/fonts';
import { theme } from '@/lib/theme';

function CustomErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomErrorBoundary>
      <div className={fontVariables}>
        <ChakraProvider theme={theme}>
          <AuthProvider>
            <Component {...pageProps} />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1A2420',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#14492F',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#E03C31',
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
