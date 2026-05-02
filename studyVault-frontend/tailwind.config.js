/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff4f1',
          100: '#ffe1d9',
          200: '#f2beb0',
          500: '#c65a46',
          600: '#a84537',
          700: '#923b31',
          800: '#7a332b',
          900: '#8f3b32',
        },
        dark: '#0f172a',
        base: {
          50: '#f6f8fb',
          100: '#edf2f7',
        },
        accent: '#9a5b1f',
        'sks-primary': '#c65a46',
        'sks-primary-dark': '#8f3b32',
        'sks-primary-light': '#fff4f1',
        'sks-accent': '#9a5b1f',
        'sks-slate': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'sans-serif'],
        'display': ['Plus Jakarta Sans', 'sans-serif'],
        'serif': ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'sks-soft': '0 18px 45px -28px rgba(45, 44, 47, 0.22)',
        'sks-medium': '0 22px 60px -30px rgba(45, 44, 47, 0.28)',
        'sks-heavy': '0 28px 70px -40px rgba(45, 44, 47, 0.32)',
        'sks-glow': '0 22px 55px -28px rgba(155, 63, 54, 0.42)',
      },
      borderRadius: {
        'sks-xl': '1.1rem',
        'sks-2xl': '1.75rem',
        'sks-3xl': '2rem',
      },
      animation: {
        'spin-slow': 'spin 25s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 8s ease-in-out 1s infinite',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      }
    },
  },
  plugins: [],
};
