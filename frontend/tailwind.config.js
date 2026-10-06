/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        citi: {
          blue: '#002D72',
          lightBlue: '#0055B8',
          red: '#ED1B24',
          dark: '#001A44',
          accent: '#0A84FF',
        },
        npci: {
          green: '#107C41',
          teal: '#0E7090',
          orange: '#F97316',
          dark: '#042F2E',
          accent: '#10B981',
        },
        drunix: {
          base: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          glow: '#3B82F6',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
