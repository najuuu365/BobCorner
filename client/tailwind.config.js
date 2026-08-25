/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        haven: {
          50: '#fdfbf7',
          100: '#f7f2e9',
          200: '#efe3d2',
          300: '#e3cdb2',
          400: '#d5b28d',
          500: '#c59569',
          600: '#b47d53',
          700: '#966343',
          800: '#7a513b',
          900: '#644333',
          950: '#362219',
        },
        sand: {
          50: '#faf9f6',
          100: '#f4f1ea',
          200: '#e6dfd3',
          300: '#d5ca8d',
          800: '#2b2927',
          900: '#1c1b1a',
        },
        sage: {
          50: '#f4f7f4',
          500: '#5a7d65',
          600: '#476550',
        },
        sepia: {
          bg: '#f8f1e5',
          text: '#433422',
          border: '#e4d5c1',
          accent: '#8c5e34',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
