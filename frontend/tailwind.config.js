/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 3 główne kolory z Twojego designu
        primary: {
          DEFAULT: '#8b6f47',  // brąz
          light: '#a0826d',
          dark: '#5d4e37',
        },
        accent: {
          DEFAULT: '#c9a882',  // beż
          light: '#dfd3c3',
          dark: '#b8956f',
        },
        cream: {
          DEFAULT: '#f5ebe0',  // krem
          light: '#faf7f2',
          dark: '#e8dac5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
