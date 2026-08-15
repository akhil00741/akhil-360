/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          bg: '#000000',
          card: '#1C1C1E',
          cardSecondary: '#2C2C2E',
          cardTertiary: '#3A3A3C',
          border: '#38383A',
          blue: '#0A84FF',
          green: '#30D158',
          indigo: '#5E5CE6',
          orange: '#FF9F0A',
          pink: '#FF375F',
          purple: '#BF5AF2',
          red: '#FF453A',
          teal: '#64D2FF',
          yellow: '#FFD60A',
          gray: '#8E8E93',
          gray2: '#636366',
          gray3: '#48484A',
          gray4: '#3A3A3C',
          gray5: '#2C2C2E',
          gray6: '#1C1C1E',
          gold: '#FFD700',
          accent: '#007AFF',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'ios': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'glow-blue': '0 0 20px rgba(10, 132, 255, 0.35)',
        'glow-green': '0 0 20px rgba(48, 209, 88, 0.35)',
        'glow-red': '0 0 20px rgba(255, 69, 58, 0.35)',
        'glow-amber': '0 0 20px rgba(255, 159, 10, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0.8' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
