/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0a0a0a',
          card: '#141414',
          elevated: '#1a1a1a',
          hover: '#1f1f1f',
        },
        border: {
          DEFAULT: '#1f1f1f',
          subtle: '#2a2a2a',
          hover: '#333333',
        },
        accent: {
          DEFAULT: '#A076F9',
          light: '#B794F6',
          dark: '#7C3AED',
          muted: 'rgba(160, 118, 249, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
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