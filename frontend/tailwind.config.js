/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        display: ['Special Elite', 'serif'],
      },
      colors: {
        brand: {
          dark: '#0a0a0a',
          text: '#1a1a1a',
          muted: '#767676',
          accent: '#905831', // terracotta / warm earthy brown
          surface: '#fafafa',
          // keep some of old colors so things don't break immediately before we get to index.css
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        severity: {
          green: "#16a34a",
          yellow: "#eab308",
          red: "#dc2626",
          critical: "#991b1b",
        },
      }
    },
  },
  plugins: [],
};
