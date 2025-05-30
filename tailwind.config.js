/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-0': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in-95': {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-in-from-bottom-4': {
          '0%': { transform: 'translateY(1rem)' },
          '100%': { transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-in-0': 'fade-in-0 0.3s ease-out',
        'zoom-in-95': 'zoom-in-95 0.3s ease-out',
        'slide-in-from-bottom-4': 'slide-in-from-bottom-4 0.3s ease-out',
        'in': 'fade-in-0 0.3s ease-out, zoom-in-95 0.3s ease-out, slide-in-from-bottom-4 0.3s ease-out'
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}

