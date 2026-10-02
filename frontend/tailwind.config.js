/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "2xs": "0 1px 1px 0 rgb(0 0 0 / 0.05)",
      },
      colors: {
        // Natural, warm agricultural palette
        primary: {
          50: "#f2f8ec",
          100: "#e1eed0",
          200: "#c5deac",
          300: "#a0c97e",
          400: "#7cb058",
          500: "#5c9438",
          600: "#46752b",
          700: "#375c23",
          800: "#2e4a20",
          900: "#283f1e",
          950: "#14220e",
        },
        earth: {
          50: "#faf6f1",
          100: "#f0e6d8",
          200: "#e0cbaf",
          300: "#cba97d",
          400: "#b8885a",
          500: "#a06f43",
          600: "#835836",
          700: "#68452d",
          800: "#553929",
          900: "#493124",
        },
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#182a1d",
          900: "#121c15",
          950: "#0b130e",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};
