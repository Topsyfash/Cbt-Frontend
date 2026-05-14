/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#eef6ff',
          100: '#d9ebff',
          200: '#bcd9ff',
          300: '#8ebeff',
          400: '#5a9aff',
          500: '#3474f5',
          600: '#1e54ea',
          700: '#1640d7',
          800: '#1835ae',
          900: '#1a3189',
          950: '#141f55',
        },
        surface: {
          DEFAULT: '#0f1117',
          1: '#16191f',
          2: '#1c2029',
          3: '#232834',
        },
        accent: {
          green:  '#22c55e',
          amber:  '#f59e0b',
          red:    '#ef4444',
          purple: '#a78bfa',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'count': 'count 1s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
