/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0F62FE',
        secondary: '#FF6B00',
        bg: '#F5F7FA',
      },
    },
  },
  plugins: [],
}
