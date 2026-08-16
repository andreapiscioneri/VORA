import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// VORA design tokens — derived from portfolio-andrea's brand
// (accent #39FF14, ink/paper scale, Roboto) extended for a SaaS product surface.
export default {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './composables/**/*.{js,ts}',
    './app.vue',
    './error.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          50: '#f7f7f7', 100: '#e5e5e5', 200: '#c9c9c9', 300: '#a0a0a0',
          400: '#707070', 500: '#4a4a4a', 600: '#2c2c2c', 700: '#1a1a1a',
          800: '#121212', 900: '#0a0a0a', 950: '#050505',
        },
        paper: {
          DEFAULT: '#fafaf7',
          50: '#ffffff', 100: '#fafaf7', 200: '#f2f2ee', 300: '#e7e7e0',
        },
        primary: {
          DEFAULT: '#39FF14',
          hover: '#2db30d',
          active: '#279c0b',
          muted: '#c9ffb8',
          glow: 'rgba(57, 255, 20, 0.35)',
          50: '#f0ffe8', 500: '#39FF14', 600: '#2db30d',
        },
        surface: {
          DEFAULT: '#ffffff',
          elevated: '#fafaf7',
          glass: 'rgba(255, 255, 255, 0.6)',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      // 4px spacing grid — dominant rule for margin/padding/gap across the app
      spacing: {
        1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px',
        7: '28px', 8: '32px', 10: '40px', 12: '48px', 14: '56px',
        16: '64px', 20: '80px', 24: '96px',
      },
      fontSize: {
        display: ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        h1: ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        h2: ['1.75rem', { lineHeight: '1.25', letterSpacing: '-0.015em' }],
        h3: ['1.375rem', { lineHeight: '1.3' }],
        h4: ['1.125rem', { lineHeight: '1.35' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.5' }],
        body: ['0.9375rem', { lineHeight: '1.5' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.45' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
        label: ['0.8125rem', { lineHeight: '1.3', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        sm: '8px', md: '12px', lg: '16px', xl: '20px', '2xl': '28px',
      },
      screens: {
        xs: '375px',
        sm: '430px',
        tablet: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
        wide: '1920px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
} satisfies Config
