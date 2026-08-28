export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#F5F5F5',
          card: '#FFFFFF',
          text: '#171717'
        },
        dark: {
          bg: '#111111',
          card: '#1A1A1A',
          text: '#F5F5F5'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
};
