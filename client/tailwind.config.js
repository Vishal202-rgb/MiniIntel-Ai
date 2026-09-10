export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        light: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          text: '#0F172A',
          border: '#E2E8F0'
        },
        dark: {
          bg: '#0B0E14', 
          card: '#161B26',
          cardElevated: '#1F2430',
          text: '#F1F5F9',
          border: '#2B3245'
        },
        // Muted industrial copper / safety orange palette
        amber: {
          50: '#FDF8F6',
          100: '#F4EAE6',
          200: '#E8D5CE',
          300: '#D6B5A7',
          400: '#C28A74',
          500: '#C05621', // Muted industrial copper / burnt safety orange
          600: '#9C4115', // Deep industrial copper (for primary CTA button)
          700: '#7B341E',
          800: '#652B19',
          900: '#431407',
          950: '#2A0B02',
        },
        copper: {
          50: '#FDF8F6',
          100: '#F4EAE6',
          200: '#E8D5CE',
          300: '#D6B5A7',
          400: '#C28A74',
          500: '#C05621',
          600: '#9C4115',
          700: '#7B341E',
          800: '#652B19',
          900: '#431407',
          950: '#2A0B02',
        },
        industrial: {
          graphite: '#0B0E14',
          charcoal: '#161B26',
          slate: '#1F2430',
          border: '#2B3245',
          muted: '#64748B',
          copper: '#C05621',
          copperHover: '#9C4115'
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ]
};
