/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['"EB Garamond"', 'Garamond', 'Georgia', 'Times New Roman', 'serif'],
        mono: ['"Courier Prime"', '"JetBrains Mono"', 'Courier', 'monospace'],
        condensed: ['"Oswald"', '"Barlow Condensed"', 'Impact', 'sans-serif'],
        classical: ['"Cinzel"', '"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
