/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sugar': '#FFF5E6',
        'honey': '#FFD93D',
        'cotton-candy': '#FFB6C1',
        'synaptic': '#E6E6FA',
        'warm-glow': '#FF6B6B',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
