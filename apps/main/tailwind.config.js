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
                            primary: {
                                        DEFAULT: '#4217cf',
                                        foreground: '#ffffff',
                            },
                            'background-light': '#f6f6f8',
                            'background-dark': '#151121',
                            'neutral-light': '#f5f5f5',
                            'muted-foreground': '#6b7280',
                            error: '#dc2626',
                  },
                  fontFamily: {
                            sans: ['var(--font-inter)', 'sans-serif'],
                            display: ['var(--font-lexend)', 'sans-serif'],
                  },
          },
    },
    plugins: [],
}
