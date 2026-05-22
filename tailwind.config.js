/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2a14b4',
        secondary: '#008080',
        'on-surface': '#1a1a2e',
        'on-surface-variant': '#5c5c6f',
        outline: '#8e8e9a',
        'secondary-container': '#e0f5f3',
        'on-secondary-container': '#004d47',
      },
    },
  },
  plugins: [],
}
