const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@material-tailwind/react/theme/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode using class strategy
  theme: {
    extend: {
      container: {
        center: false,
        padding: '0',
        margin: '0',
      },
      // Add dark mode colors
      colors: {
        dark: {
          primary: '#1a1a1a',    // Dark background
          secondary: '#2d2d2d',  // Slightly lighter dark
          accent: '#3d3d3d',     // Even lighter for hover states
        },
      },
      backgroundColor: {
        'dark-card': '#1e1e1e',  // Dark mode card background
        'dark-hover': '#2a2a2a', // Dark mode hover state
      },
      textColor: {
        'dark-primary': '#ffffff',    // Dark mode primary text
        'dark-secondary': '#a0aec0',  // Dark mode secondary text
      },
      borderColor: {
        'dark-border': '#2d2d2d',     // Dark mode borders
      },
    },
  },
  plugins: [],
});