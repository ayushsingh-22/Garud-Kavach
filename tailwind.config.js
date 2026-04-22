/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0A2540',
        'brand-gold': '#FFB700',
      },
    },
  },
  plugins: [],
}

