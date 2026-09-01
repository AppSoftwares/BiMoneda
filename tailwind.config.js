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
        "primary": "#0D2B5B",
        "primary-container": "#0D2B5B",
        "on-primary": "#FFFFFF",
        "secondary": "#3A9AD9",
        "secondary-container": "#F0F5FA",
        "on-secondary": "#FFFFFF",
        "background": "#F8FAFC",
        "surface": "#F8FAFC",
        "surface-bright": "#F8FAFC",
        "surface-container-low": "#F0F5FA",
        "on-surface": "#0B1C30",
        "accent-sky": "#3A9AD9",
        "error": "#BA1A1A",
        "on-error": "#FFFFFF",
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'level-1': '0 2px 4px rgba(0, 0, 0, 0.05)',
        'level-2': '0 8px 16px rgba(13, 43, 91, 0.08)',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
