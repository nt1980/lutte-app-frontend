/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: '#DC2626', 600: '#DC2626', 700: '#B91C1C', 500: '#EF4444' },
        blue: { DEFAULT: '#1D4ED8', 600: '#2563EB', 700: '#1D4ED8', 500: '#3B82F6' },
        dark: { DEFAULT: '#0F0F0F', 100: '#1A1A1A', 200: '#242424', 300: '#2E2E2E', 400: '#3A3A3A', 500: '#4A4A4A' },
      },
    },
  },
  plugins: [],
}
