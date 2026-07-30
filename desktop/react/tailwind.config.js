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
          0: '#0d0d17',
          50: '#111122',
          100: '#181830',
          200: '#1e1e35',
          300: '#252540',
          400: '#2c2c4a',
        },
        border: {
          DEFAULT: '#2a2a42',
          light: '#3a3a58',
          accent: 'rgba(124, 92, 191, 0.4)',
        },
        text: {
          primary: '#e4e4ef',
          secondary: '#9090a8',
          muted: '#5a5a72',
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
