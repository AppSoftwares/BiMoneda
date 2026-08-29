/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "surface-bright": "#f8f9ff",
        "primary": "#0B2545", // Deep blue from your palette
        "primary-variant": "#1C5C8C",
        "secondary": "#006495",
        "secondary-container": "#65beff",
        "accent-gold": "#C99A32",
        "accent-gold-light": "#F4CA6E",
        "surface-container-low": "#eff4ff",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#0b1c30",
        "outline-variant": "#c4c6d0",
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      }
    },
  },
  plugins: [],
}
