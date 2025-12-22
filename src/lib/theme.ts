import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    satrf: {
      navy: '#1a365d',
      red: '#e53e3e',
      lightBlue: '#3182ce',
      grayBlue: '#4a5568',
      lightGray: '#f7fafc',
      darkGray: '#2d3748',
    },
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'blue',
      },
      variants: {
        satrf: {
          bg: 'satrf.navy',
          color: 'white',
          _hover: {
            bg: 'satrf.lightBlue',
          },
        },
        satrfRed: {
          bg: 'satrf.red',
          color: 'white',
          _hover: {
            bg: 'red.600',
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'white',
          borderRadius: 'lg',
          boxShadow: 'md',
          p: 6,
        },
      },
    },
  },
  semanticTokens: {
    colors: {
      'chakra-body-text': { _light: 'gray.800', _dark: 'white' },
      'chakra-body-bg': { _light: 'gray.50', _dark: 'gray.800' },
      'chakra-border-color': { _light: 'gray.200', _dark: 'gray.700' },
    },
  },
});

export { theme }; 