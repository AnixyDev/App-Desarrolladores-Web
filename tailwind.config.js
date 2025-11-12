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
          '400': '#f735c7',
          '500': '#F000B8',
          '600': '#d9009f',
          '700': '#c0008b',
        }
      },
      boxShadow: {
        'fuchsia-heavy': '0 10px 15px -3px rgba(179, 0, 179, 0.5), 0 4px 6px -2px rgba(179, 0, 179, 0.5)',
      }
    },
  },
  plugins: [],
}