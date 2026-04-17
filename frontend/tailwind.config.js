/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sika: {
          red: '#CC0000',
          'red-dark': '#A30000',
        },
      },
    },
  },
  plugins: [],
};
