module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        primaryBlue: '#203e99',
        darkBlue: '#102359',
      },
      backgroundImage: {
        dashboardGradient:
          'linear-gradient(90deg, #203e99 0%, #102359 100%)',
      },
    },
  },
  plugins: [],
}