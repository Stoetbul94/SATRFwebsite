/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        satrf: {
          navy: '#0A1A2F',
          green: {
            DEFAULT: '#0B3D2E',
            500: '#14492F',
            700: '#0B3D2E',
          },
          gold: {
            DEFAULT: '#C99A3B',
            500: '#C99A3B',
            600: '#B8860B',
          },
          red: '#E03C31',
          lightBlue: '#C99A3B',
          grayBlue: '#4A5C54',
          lightGray: '#F7F8F7',
          darkGray: '#1A2420',
        },
        midnight: {
          steel: '#0b1e2f',
          dark: '#0a1a28',
          light: '#1a2f3f',
        },
        electric: {
          cyan: '#00ffff',
          blue: '#0080ff',
          neon: '#00d4ff',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        heading: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        wordmark: ['var(--font-michroma)', 'Michroma', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        // Slow the marquee to improve readability/accessibility
        'marquee': 'marquee 120s linear infinite',
        'glow-pulse': 'glowPulse 8s ease-in-out infinite alternate',
        'float': 'float 20s ease-in-out infinite',
        'gradient-x': 'gradientX 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        glowPulse: {
          '0%': { 
            textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff, 0 0 20px #00ffff',
            filter: 'brightness(1)'
          },
          '100%': { 
            textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff',
            filter: 'brightness(1.2)'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate3d(1, 1, 0, 2deg)' },
          '50%': { transform: 'translateY(-10px) rotate3d(1, 1, 0, -2deg)' },
        },
        gradientX: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 