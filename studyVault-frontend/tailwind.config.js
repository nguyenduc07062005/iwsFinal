/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#faebe8',
          100: '#f4d6d0',
          500: '#e2725b',
          600: '#cc6652',
          900: '#8c4238',
        },
        base: {
          50: '#faf9f6',
          100: '#f5f2eb',
        },
        accent: '#b87333',
        'sks-primary': '#e2725b',
        'sks-primary-dark': '#8c4238',
        'sks-primary-light': '#faebe8',
        'sks-accent': '#b87333',
        'sks-slate': {
          50: '#faf9f6',
          100: '#f5f2eb',
          200: '#eadfd5',
          300: '#d7c2b2',
          400: '#b69d91',
          500: '#8a756b',
          600: '#6f625d',
          700: '#514744',
          800: '#3a3230',
          900: '#2d2c2f',
          950: '#1c1a1d',
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
        'sks-glow': '0 22px 55px -28px rgba(140, 66, 56, 0.42)',
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
