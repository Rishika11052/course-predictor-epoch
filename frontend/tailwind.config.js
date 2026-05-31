/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cp-dark': '#1a0f0a',     // Dark brown-black background
        'cp-cream': '#f5f0e8',    // Light cream background (Home/Courses)
        'cp-text': '#fdf4ec',     // Warm cream text
        'cp-primary': '#C0350F',  // Rust red buttons
        'cp-hover': '#F3904B',    // Orange hover
        'cp-accent': '#F7C767',   // Yellow accents/titles
        'cp-card': '#642F37',     // Puce red cards/borders
        'cp-green': '#2d6a1f',    // Home page green
        'cp-green-light': '#e8f5e1', // Navbar green
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'], // Body text
        display: ['Syne', 'sans-serif'],   // Headings
        gothic: ['"UnifrakturMaguntia"', 'cursive'], // Logo
      }
    },
  },
  plugins: [],
}