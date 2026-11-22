import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    borderRadius: {
      none: '0',
      sm: '2px',
      DEFAULT: '2px',
      md: '2px',
      lg: '2px',
      xl: '2px',
      '2xl': '2px',
      '3xl': '2px',
      full: '2px',
      dot: '9999px',
    },
    extend: {
      colors: {
        linen: '#F3EEE6',
        paper: '#FBF8F3',
        ink: '#3A2E2A',
        wine: {
          DEFAULT: '#7A3B3B',
          50: '#F7EEEC',
          100: '#EFDCD9',
          200: '#DFB9B4',
          300: '#C99089',
          400: '#AE665F',
          500: '#934C47',
          600: '#854242',
          700: '#7A3B3B',
          800: '#5E2C2C',
          900: '#432020',
        },
        sand: '#E6DCCE',
        rosewood: '#E8D3CF',
        rule: '#CDBFAF',
        line: '#CDBFAF',
        muted: { DEFAULT: '#6A5B54', 2: '#8A7A70' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      letterSpacing: {
        eyebrow: '0.24em',
      },
      maxWidth: {
        page: '1240px',
      },
      boxShadow: {
        paper: '0 1px 2px rgba(58, 46, 42, 0.12)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stitch: {
          '0%': { strokeDashoffset: '120' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        rise: 'rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        stitch: 'stitch 2.4s ease-out both',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
