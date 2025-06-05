/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'neon-pink': '#ff2e63',
        'neon-purple': '#c71585',
        'dark-glass': 'rgba(20, 20, 30, 0.7)',
        'glow-pink': 'rgba(255, 46, 99, 0.3)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'neumorphic': '8px 8px 16px rgba(0, 0, 0, 0.3), -8px -8px 16px rgba(50, 50, 70, 0.1)',
        'glow': '0 0 20px rgba(255, 46, 99, 0.5)',
      },
    },
  },
  plugins: [],
};