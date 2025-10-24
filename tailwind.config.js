/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C084FC',
          dark: '#9333EA',
        },
        background: '#0A0A0F',
        surface: {
          light: 'rgba(192, 132, 252, 0.05)',
          DEFAULT: 'rgba(26, 15, 46, 0.4)',
        },
      },
    },
  },
  plugins: [],
};


