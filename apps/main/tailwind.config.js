/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4217cf',
        'background-light': '#f6f6f8',
        'background-dark': '#151121',
      },
      fontFamily: {
        display: ['var(--font-lexend)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
