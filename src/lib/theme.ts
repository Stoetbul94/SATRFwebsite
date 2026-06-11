import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    satrf: {
      green: {
        50: '#E9F2EE',
        100: '#C9DDD4',
        200: '#9FBFAD',
        300: '#6FA086',
        400: '#458764',
        500: '#14492F',
        600: '#0F3D27',
        700: '#0B3D2E',
        800: '#082A20',
        900: '#051A14',
      },
      gold: {
        50: '#FBF6EA',
        100: '#F3E6C4',
        200: '#E8D19A',
        300: '#DDB86F',
        400: '#D4A84E',
        500: '#C99A3B',
        600: '#B8860B',
        700: '#946E09',
        800: '#6F5207',
        900: '#4A3604',
      },
      navy: '#0A1A2F',
      flagRed: '#E03C31',
      flagGreen: '#007A4D',
      flagGold: '#FFB81C',
      flagBlue: '#001489',
      white: '#FFFFFF',
      surface: {
        offWhite: '#F7F8F7',
      },
      text: {
        primary: '#1A2420',
        muted: '#4A5C54',
      },
      border: {
        default: '#D8DED9',
        subtle: '#E8ECE9',
      },
      /** Legacy aliases — existing pages reference these */
      red: '#E03C31',
      lightBlue: '#C99A3B',
      grayBlue: '#4A5C54',
      lightGray: '#F7F8F7',
      darkGray: '#1A2420',
    },
  },
  fonts: {
    heading: 'var(--font-montserrat), Montserrat, sans-serif',
    body: 'var(--font-inter), Inter, sans-serif',
    wordmark: 'var(--font-michroma), Michroma, sans-serif',
  },
  textStyles: {
    wordmark: {
      fontFamily: 'wordmark',
      fontWeight: '400',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      lineHeight: '1',
    },
    eyebrow: {
      fontFamily: 'heading',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      fontSize: 'xs',
      color: 'satrf.gold.600',
    },
    eyebrowGreen: {
      fontFamily: 'heading',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      fontSize: 'xs',
      color: 'satrf.green.700',
    },
  },
  styles: {
    global: {
      'html, body': {
        bg: 'bg.canvas',
        color: 'text.primary',
      },
    },
  },
  semanticTokens: {
    colors: {
      'bg.canvas': { default: 'satrf.surface.offWhite' },
      'bg.surface': { default: 'satrf.white' },
      'text.primary': { default: 'satrf.text.primary' },
      'text.muted': { default: 'satrf.text.muted' },
      'border.default': { default: 'satrf.border.default' },
      'border.subtle': { default: 'satrf.border.subtle' },
      accent: { default: 'satrf.gold.500' },
      brand: { default: 'satrf.green.700' },
      'chakra-body-text': { default: 'satrf.text.primary' },
      'chakra-body-bg': { default: 'satrf.surface.offWhite' },
      'chakra-border-color': { default: 'satrf.border.default' },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'green',
      },
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: '600',
        borderRadius: 'md',
        letterSpacing: '0.02em',
      },
      variants: {
        outline: {
          borderWidth: '2px',
        },
        ghost: {
          _hover: { bg: 'satrf.green.50' },
        },
        satrf: {
          bg: 'brand',
          color: 'white',
          _hover: { bg: 'satrf.green.600' },
        },
        satrfGold: {
          bg: 'accent',
          color: 'satrf.navy',
          _hover: { bg: 'satrf.gold.600', color: 'white' },
        },
        satrfOutline: {
          border: '2px solid',
          borderColor: 'brand',
          color: 'brand',
          bg: 'transparent',
          _hover: { bg: 'satrf.green.50' },
        },
        satrfRed: {
          bg: 'satrf.flagRed',
          color: 'white',
          _hover: { bg: '#C43228' },
        },
      },
      sizes: {
        lg: { borderRadius: 'md', px: 8 },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'bg.surface',
          borderRadius: 'lg',
          borderWidth: '1px',
          borderColor: 'border.default',
          boxShadow: 'sm',
          p: 6,
        },
      },
    },
    Badge: {
      baseStyle: {
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontWeight: '600',
        fontSize: 'xs',
        borderRadius: 'sm',
      },
      variants: {
        statusOpen: {
          bg: 'satrf.green.100',
          color: 'satrf.green.800',
        },
        statusClosing: {
          bg: 'satrf.gold.100',
          color: 'satrf.gold.800',
        },
        statusClosed: {
          bg: 'gray.100',
          color: 'gray.700',
        },
        discipline: {
          bg: 'satrf.green.50',
          color: 'satrf.green.800',
          borderWidth: '1px',
          borderColor: 'satrf.green.200',
        },
      },
    },
    Heading: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: '700',
        color: 'text.primary',
        letterSpacing: '0.01em',
      },
    },
    Table: {
      variants: {
        admin: {
          table: {
            width: '100%',
          },
          thead: {
            tr: {
              th: {
                bg: 'brand',
                color: 'white',
                fontFamily: 'heading',
                fontSize: 'xs',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                borderColor: 'satrf.green.800',
                py: 3,
                whiteSpace: 'nowrap',
              },
            },
          },
          tbody: {
            tr: {
              _even: { bg: 'satrf.green.50' },
              _hover: { bg: 'satrf.green.100' },
              transition: 'background 0.12s ease',
            },
            td: {
              py: 3.5,
              fontSize: 'sm',
              borderColor: 'border.subtle',
              verticalAlign: 'middle',
            },
          },
        },
      },
      defaultProps: {
        variant: 'admin',
      },
    },
    Input: {
      defaultProps: {
        focusBorderColor: 'satrf.green.500',
      },
      variants: {
        outline: {
          field: {
            bg: 'bg.surface',
            borderColor: 'border.default',
            _hover: { borderColor: 'satrf.green.300' },
          },
        },
      },
    },
    Select: {
      defaultProps: {
        focusBorderColor: 'satrf.green.500',
      },
      variants: {
        outline: {
          field: {
            bg: 'bg.surface',
            borderColor: 'border.default',
          },
        },
      },
    },
    FormLabel: {
      baseStyle: {
        fontFamily: 'heading',
        fontWeight: '600',
        fontSize: 'sm',
        color: 'text.primary',
        mb: 1.5,
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: 'lg',
          mx: 4,
        },
        header: {
          fontFamily: 'heading',
          fontWeight: '700',
          color: 'text.primary',
          borderBottomWidth: '1px',
          borderColor: 'border.subtle',
          pb: 3,
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'border.subtle',
          pt: 4,
          gap: 3,
        },
      },
    },
  },
});

export { theme };
