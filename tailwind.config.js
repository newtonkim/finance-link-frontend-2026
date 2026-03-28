/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
   safelist: [
    {
      pattern: /(text|bg)-(red|blue|green|yellow|purple|gray)-(100|200|300|400|500|600)/,
    },
    {
      pattern: /bg-(red|blue|green|yellow|purple|gray)-100\/10/,
    },
  ],
}
