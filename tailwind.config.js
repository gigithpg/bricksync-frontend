module.exports = {
  content: ['./src/**/*.{html,js}', './src/partials/**/*.{html,js}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      colors: {
        indigo: { 600: '#4f46e5', 700: '#4338ca' },
        gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 600: '#4b5563', 700: '#374151', 900: '#111827' }
      },
      spacing: { '8xl': '90rem', '9xl': '105rem', '10xl': '120rem' },
      animation: { 'spin-slow': 'spin-slow 8s linear infinite' },
      keyframes: { 'spin-slow': { '100%': { transform: 'rotate(-360deg)' } } }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};