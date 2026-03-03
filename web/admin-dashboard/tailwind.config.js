/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: "#1a1a1a",
          100: "#0f0f0f",
          200: "#1a1a1a",
          300: "#2a2a2a",
        },
        lime: {
          400: "#b4e835",
          500: "#a4d830",
        },
      },
    },
  },
  plugins: [],
};
