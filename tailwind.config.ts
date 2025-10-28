import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./client/index.html', './client/src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      black: '#000000',

      coolgray: {
        50: '#F8FAFC',
        100: '#F1F5F9',
        200: '#E2E8F0',
        300: '#CBD5E1',
        400: '#94A3B8',
        500: '#64748B',
        600: '#475569',
        700: '#334155',
        800: '#1E293B',
        900: '#0F172A',
        950: '#020617',
      },

      primary: {
        50: '#FFF6EB',
        100: '#FEE7C8',
        200: '#F9D09B',
        300: '#F0B369',
        400: '#E8A658',
        500: '#E49A43',
        600: '#C78235',
        700: '#A06727',
        800: '#7C501C',
        900: '#5C3810',
        950: '#3A2304',
        DEFAULT: '#E49A43',
        foreground: '#FFFFFF',
      },

      secondary: {
        50: '#E6F3FB',
        100: '#C0E0F4',
        200: '#99CCEA',
        300: '#73B9E0',
        400: '#5FB1E5',
        500: '#4AA0D9',
        600: '#3B7FB0',
        700: '#2E648B',
        800: '#224967',
        900: '#162F43',
        950: '#09161F',
        DEFAULT: '#4AA0D9',
        foreground: '#FFFFFF',
      },

      tertiary: {
        50: '#F9FCEA',
        100: '#EBF2C4',
        200: '#DCE79F',
        300: '#CBDD7A',
        400: '#BEDA59',
        500: '#BED163',
        600: '#9AB04E',
        700: '#7A893D',
        800: '#5B662C',
        900: '#3B431B',
        950: '#1B200A',
        DEFAULT: '#BED163',
      },

      success: {
        50: '#D8F7DB',
        500: '#2ABF3C',
        700: '#1F8E2E',
        DEFAULT: '#2ABF3C',
      },

      danger: {
        50: '#FEEAEB',
        500: '#E74B3C',
        700: '#BF3428',
        DEFAULT: '#E74B3C',
      },

      warning: {
        50: '#FFF7E6',
        500: '#FFC700',
        700: '#D8A500',
        DEFAULT: '#FFC700',
      },

      info: {
        50: '#E6F3FB',
        500: '#4AA0D9',
        700: '#2E648B',
        DEFAULT: '#4AA0D9',
      },

      background: '#FFFFFF',
      foreground: '#475569',
      card: {
        DEFAULT: '#FFFFFF',
        foreground: '#475569',
      },
      popover: {
        DEFAULT: '#FFFFFF',
        foreground: '#475569',
      },
      muted: {
        DEFAULT: '#F1F5F9',
        foreground: '#64748B',
      },
      accent: {
        DEFAULT: '#BED163',
        foreground: '#FFFFFF',
      },
      destructive: {
        DEFAULT: '#E74B3C',
        foreground: '#FFFFFF',
      },
      border: '#E2E8F0',
      input: '#E2E8F0',
      ring: '#E49A43',
    },

    spacing: {
      0: '0',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      8: '32px',
      10: '40px',
      12: '48px',
      16: '64px',
      20: '80px',
      24: '96px',
      32: '128px',
    },

    borderRadius: {
      none: '0',
      sm: '2px',
      md: '4px',
      lg: '8px',
      xl: '12px',
      full: '9999px',
    },

    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },

    extend: {
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;
