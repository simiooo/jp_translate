/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
        '6xl': 'var(--font-size-6xl)',
        '7xl': 'var(--font-size-7xl)',
        '8xl': 'var(--font-size-8xl)',
        '9xl': 'var(--font-size-9xl)',
      },
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
      },
      colors: {
        // 自定义柔和色
        'soft-green-bg': 'var(--color-soft-green-bg)',
        'soft-green-text': 'var(--color-soft-green-text)',
        'soft-purple-bg': 'var(--color-soft-purple-bg)',
        'soft-purple-text': 'var(--color-soft-purple-text)',
        'soft-orange-bg': 'var(--color-soft-orange-bg)',
        'soft-orange-text': 'var(--color-soft-orange-text)',
        'soft-pink-bg': 'var(--color-soft-pink-bg)',
        'soft-pink-text': 'var(--color-soft-pink-text)',
        'soft-cyan-bg': 'var(--color-soft-cyan-bg)',
        'soft-cyan-text': 'var(--color-soft-cyan-text)',
        'soft-red-bg': 'var(--color-soft-red-bg)', // 新增的柔和红
        'soft-red-text': 'var(--color-soft-red-text)',
      },
    },
  },
  plugins: [
    // require('tailwind-scrollbar'),
  ],
}

