/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0D10',
        surface: {
          DEFAULT: '#15181D',
          2: '#1C2026',
          3: '#22272F',
        },
        line: {
          DEFAULT: '#262B33',
          strong: '#333A45',
        },
        ink: {
          DEFAULT: '#E6E9EF',
          muted: '#8A93A2',
          faint: '#5B6573',
        },
        muted: '#8A93A2',
        faint: '#5B6573',
        accent: {
          DEFAULT: '#6E8BFF',
          dim: '#3A4A8A',
        },
        gold: '#C9A961',
        success: '#4ADE80',
        warning: '#FBBF24',
        danger: '#F87171',
        streak: '#FB923C',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['"Playfair Display"', 'Iowan Old Style', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'SF Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '18px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,.4),0 8px 24px rgba(0,0,0,.25)',
        glow: '0 4px 24px rgba(110,139,255,.25)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(.4)' },
          '60%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        rise: {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        fade: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        pop: 'pop .25s ease',
        rise: 'rise .22s cubic-bezier(.2,.8,.3,1)',
        fade: 'fade .18s ease',
      },
    },
  },
  plugins: [],
};
