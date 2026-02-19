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
                                    // ORU Brand Colors
                          'oru-navy': '#003057',      // ORU primary navy blue
                                    'oru-gold': '#C5973E',      // ORU gold
                                    'oru-gold-light': '#E8B96A', // lighter gold for hover states
                                    'oru-navy-light': '#1a4a7a', // lighter navy for accents
                                    // Legacy / system tokens kept for compatibility
                                    primary: {
                                                  DEFAULT: '#003057',
                                                  foreground: '#ffffff',
                                    },
                                    'background-light': '#f6f6f8',
                                    'background-dark': '#0a1929',
                                    'neutral-light': '#f5f7fa',
                                    'muted-foreground': '#6b7280',
                        },
                        fontFamily: {
                                    sans: ['var(--font-inter)', 'sans-serif'],
                                    display: ['var(--font-lexend)', 'sans-serif'],
                        },
                        backgroundImage: {
                                    'oru-gradient': 'linear-gradient(135deg, #003057 0%, #001a33 100%)',
                                    'oru-gold-gradient': 'linear-gradient(135deg, #C5973E 0%, #E8B96A 100%)',
                        },
                        boxShadow: {
                                    'oru': '0 4px 20px rgba(0, 48, 87, 0.15)',
                                    'oru-lg': '0 8px 40px rgba(0, 48, 87, 0.2)',
                        },
              },
      },
      plugins: [],
}
