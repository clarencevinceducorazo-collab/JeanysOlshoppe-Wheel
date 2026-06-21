/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        blush:    '#FFE5EC',
        'pink-l': '#FFB3C1',
        'pink-m': '#FF8FAB',
        crimson:  '#E63950',
        'deep-r': '#C9184A',
      },
    },
  },
  plugins: [],
}
