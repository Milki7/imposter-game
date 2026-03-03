/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-orbitron)', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
        display: ['var(--font-orbitron)', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366F1',
        },
        imposter: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#F87171',
        },
        innocent: {
          DEFAULT: '#22C55E',
          dark: '#16A34A',
          light: '#4ADE80',
        },
        background: '#F8FAFC',
        surface: '#1E293B',
        foreground: '#F8FAFC',
      },
      boxShadow: {
        'glow-imposter': '0 0 20px rgba(239, 68, 68, 0.35)',
        'glow-innocent': '0 0 20px rgba(34, 197, 94, 0.35)',
        'glow-white': '0 0 14px rgba(248, 250, 252, 0.2)',
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.35)',
        'glass': '0 18px 45px rgba(2, 6, 23, 0.45)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
