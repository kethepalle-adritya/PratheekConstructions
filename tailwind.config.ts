import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: 'var(--color-cream)',
        paper: 'var(--color-paper)',
        teal: 'var(--color-teal)',
        wood: 'var(--color-wood)',
        terracotta: 'var(--color-terracotta)',
        navy: 'var(--color-navy)',
        muted: 'var(--color-muted)',
        maroon: 'var(--color-maroon)',
        peach: 'var(--color-peach)',
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Open Sans', 'Arial', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
      },
      boxShadow: {
        soft: '0 12px 32px rgba(43, 63, 140, 0.10)',
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
} satisfies Config
