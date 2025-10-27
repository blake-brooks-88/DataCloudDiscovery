import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // shadcn colors (CSS variables)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          // Direct orange palette
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
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          // Direct blue palette
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
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Brand color palettes
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
        },
        success: {
          50: '#D8F7DB',
          500: '#2ABF3C',
          700: '#1F8E2E',
        },
        danger: {
          50: '#FEEAEB',
          500: '#E74B3C',
          700: '#BF3428',
        },
        warning: {
          50: '#FFF7E6',
          500: '#FFC700',
          700: '#D8A500',
        },
        info: {
          50: '#E6F3FB',
          500: '#4AA0D9',
          700: '#2E648B',
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
