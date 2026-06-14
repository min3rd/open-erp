/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./projects/shared-ui/src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'rose-gold': {
          50: '#FDF8F5',
          100: '#FBECE6',
          200: '#F6D2C4',
          300: '#EEA994',
          400: '#E27E67',
          500: '#B76E79', // Màu Hồng Vàng chủ đạo (Rose Gold)
          600: '#A45964',
          700: '#894650',
          800: '#723A43',
          900: '#5F323A',
        },
        'dark-bg': '#0F172A',
        'dark-card': '#1E293B',
        'light-bg': '#F8FAFC',
        'light-card': '#FFFFFF',
      }
    },
  },
  plugins: [],
}
