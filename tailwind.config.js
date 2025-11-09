/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./contracts/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          '400': '#ff33ff',
          '500': '#ff00ff',
          '600': '#e600e6',
          '700': '#cc00cc',
        }
      },
      boxShadow: {
        'fuchsia-heavy': '0 10px 15px -3px rgba(179, 0, 179, 0.5), 0 4px 6px -2px rgba(179, 0, 179, 0.5)',
      }
    },
  },
  plugins: [],
}
