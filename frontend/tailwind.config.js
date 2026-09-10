/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#16a34a',
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d',
        },
        secondary: {
          DEFAULT: '#22c55e',
        },
        accent: {
          DEFAULT: '#84cc16',
        },
        warning: {
          DEFAULT: '#f59e0b',
        },
        error: {
          DEFAULT: '#ef4444',
        },
        success: {
          DEFAULT: '#22c55e',
        },
        agrimind: {
          green: '#16a34a',
          dark: '#0f172a',
          accent: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
