/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12181B',
        paper: '#F6F4EF',
        brand: {
          50: '#EFF6F6',
          100: '#D8EBEA',
          400: '#3E8E88',
          500: '#276C67',
          600: '#1D524E',
          700: '#153B38',
        },
        amber: {
          400: '#E3A138',
          500: '#C9821F',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
      },
    },
  },
  plugins: [],
}
