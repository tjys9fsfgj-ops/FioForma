import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F6F2',
        ink: '#222725',
        forest: {
          DEFAULT: '#24483D',
          50: '#EEF3F0',
          100: '#DCE7E1',
          200: '#B9CFC5',
          300: '#8FB0A1',
          400: '#5F8A78',
          500: '#3E6B58',
          600: '#2F5647',
          700: '#24483D',
          800: '#1B382F',
          900: '#132821',
        },
        sage: {
          DEFAULT: '#ABB8A8',
          100: '#E6ECE3',
          200: '#D3DCCF',
          300: '#BFCBBB',
        },
        blush: {
          DEFAULT: '#EBD6CB',
          100: '#F6EAE3',
          200: '#F0DED5',
          300: '#E3C3B3',
        },
        clay: '#A8503A',
        cream: '#EFEBE1',
        rose: '#C9A9A0',
        line: '#E2DED4',
        muted: '#626864',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      maxWidth: {
        page: '1240px',
      },
      borderRadius: {
        arch: '999px 999px 24px 24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(34, 39, 37, 0.04), 0 18px 40px -28px rgba(34, 39, 37, 0.35)',
        float: '0 24px 48px -28px rgba(34, 39, 37, 0.5)',
        soft: '0 1px 0 rgba(34, 39, 37, 0.04), 0 10px 30px -22px rgba(34, 39, 37, 0.3)',
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
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        rise: 'rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        stitch: 'stitch 2.4s ease-out both',
        marquee: 'marquee 38s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
