const baseConfig = require('../../packages/config/tailwind/base');

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...baseConfig,
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      ...baseConfig.theme.extend,
      colors: {
        ...baseConfig.theme.extend.colors,
        primary: '#005A9C',
        'background-light': '#F4F7FA',
        'background-dark': '#101922',
        'accent-gold': '#FFC72C',
        'status-green': '#28A745',
        'status-yellow': '#FFC107',
        'status-red': '#DC3545',
        'neutral-text': '#333333',
        'neutral-border': '#E0E0E0',
      },
      fontFamily: {
        ...baseConfig.theme.extend.fontFamily,
        display: ['var(--font-lexend)', 'sans-serif'],
      },
      borderRadius: {
        ...baseConfig.theme.extend.borderRadius,
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
    },
  },
};
