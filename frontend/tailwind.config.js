/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: '#FAF8F4',
        graphite: '#4A4A4A',
        'light-grey': '#E8E5E0',
        teal: {
          DEFAULT: '#3D9E8C',
          50: '#eef8f6',
          100: '#d5eeea',
          500: '#3D9E8C',
          600: '#2d8a78',
          700: '#227060',
        },
        brand: {
          black: '#1A1A1A',
          white: '#FFFFFF',
          cream: '#FAF8F4',
          graphite: '#4A4A4A',
          grey: '#E8E5E0',
          teal: '#3D9E8C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
        'float-up': 'floatUp 0.5s ease-out forwards',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
