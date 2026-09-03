/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#7C5CBF',
          light: '#9B7FD4',
          dark: '#5A3D96',
          muted: 'rgba(124, 92, 191, 0.15)',
        },
        surface: {
          0: 'rgb(var(--bg-surface-0) / <alpha-value>)',
          50: 'rgb(var(--bg-surface-50) / <alpha-value>)',
          100: 'rgb(var(--bg-surface-100) / <alpha-value>)',
          200: 'rgb(var(--bg-surface-200) / <alpha-value>)',
          300: 'rgb(var(--bg-surface-300) / <alpha-value>)',
          400: 'rgb(var(--bg-surface-400) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border-color) / <alpha-value>)',
          light: 'rgb(var(--border-light) / <alpha-value>)',
          accent: 'rgba(124, 92, 191, 0.4)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '0.85rem' }],
      },
      spacing: {
        'sidebar': '240px',
        'ai-panel': '360px',
      },
      animation: {
        'slide-in-left': 'slideInLeft 200ms ease-out',
        'slide-in-right': 'slideInRight 200ms ease-out',
        'fade-in': 'fadeIn 150ms ease-out',
      },
      keyframes: {
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
