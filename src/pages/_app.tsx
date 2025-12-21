import type { AppProps } from 'next/app';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import * as Sentry from '@sentry/nextjs';
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

// Custom error boundary component
function CustomErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, resetError }) => {
        // Only show error boundary for critical errors, not for expected errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        
        const isCriticalError = errorMessage?.includes('Critical') || 
                               errorName === 'CriticalError' ||
                               process.env.NODE_ENV === 'development';
        
        if (!isCriticalError) {
          return <>{children}</>;
        }
        
        return (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>
              Something went wrong
            </h2>
            <p style={{ marginBottom: '1rem', color: '#4a5568' }}>
              We've been notified and are working to fix this issue.
            </p>
            <button
              onClick={resetError}
              style={{
                background: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Try again
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '1rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#718096' }}>
                  Error details (development only)
                </summary>
                <pre style={{ 
                  background: '#f7fafc', 
                  padding: '1rem', 
                  borderRadius: '0.375rem',
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  marginTop: '0.5rem'
                }}>
                  {error?.toString()}
                  {componentStack}
                </pre>
              </details>
            )}
          </div>
        );
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
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