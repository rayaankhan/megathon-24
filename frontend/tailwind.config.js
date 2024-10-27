module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust the path as necessary
  ],
  theme: {
    extend: {
      keyframes: {
        'meteor-fall': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0) rotate(45deg)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(100vh) rotate(45deg)',
          },
        },
      },
      animation: {
        'meteor-fall': 'meteor-fall 5s linear infinite',
      },
    },
  },
  plugins: [],
};
