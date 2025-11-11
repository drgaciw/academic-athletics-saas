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
        primary: "#0A2A5B",
        secondary: "#4CAF50",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "neutral-light": "#F4F7FA",
        "neutral-medium": "#6C757D",
        "neutral-dark": "#212529",
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
    },
  },
  plugins: [],
}
