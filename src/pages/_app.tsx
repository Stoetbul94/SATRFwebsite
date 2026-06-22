import type { AppContext, AppProps } from 'next/app';
import React from 'react';
import dynamic from 'next/dynamic';
import { ChakraProvider } from '@chakra-ui/react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ToolboxEnabledProvider } from '@/contexts/ToolboxEnabledContext';
import { ToolboxProvider } from '@/components/toolbox/ToolboxProvider';
import { isToolboxEnabled } from '@/lib/toolbox/enabled';
import '@/styles/globals.css';
import { fontVariables } from '@/lib/fonts';
import { theme } from '@/lib/theme';

const ToolboxLauncher = dynamic(() => import('@/components/toolbox/ToolboxLauncher'), {
  ssr: false,
  loading: () => null,
});

const PWARegister = dynamic(() => import('@/components/pwa/PWARegister'), {
  ssr: false,
  loading: () => null,
});

const InstallPrompt = dynamic(() => import('@/components/pwa/InstallPrompt'), {
  ssr: false,
  loading: () => null,
});

type SatrfAppProps = AppProps & {
  toolboxEnabled: boolean;
};

function CustomErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function App({ Component, pageProps, toolboxEnabled }: SatrfAppProps) {
  const toaster = (
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
  );

  return (
    <CustomErrorBoundary>
      <div className={fontVariables}>
        <ChakraProvider theme={theme}>
          <ToolboxEnabledProvider enabled={toolboxEnabled}>
            <AuthProvider>
              <PWARegister />
              <InstallPrompt />
              {toolboxEnabled ? (
                <ToolboxProvider>
                  <Component {...pageProps} />
                  <ToolboxLauncher />
                  {toaster}
                </ToolboxProvider>
              ) : (
                <>
                  <Component {...pageProps} />
                  {toaster}
                </>
              )}
            </AuthProvider>
          </ToolboxEnabledProvider>
        </ChakraProvider>
      </div>
    </CustomErrorBoundary>
  );
}

App.getInitialProps = async (appContext: AppContext) => {
  const appProps = await (async () => {
    if (appContext.Component.getInitialProps) {
      return appContext.Component.getInitialProps(appContext.ctx);
    }
    return {};
  })();

  return {
    pageProps: appProps,
    toolboxEnabled: isToolboxEnabled(),
  };
};
