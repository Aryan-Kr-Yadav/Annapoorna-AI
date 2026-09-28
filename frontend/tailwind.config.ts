import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm, agriculture-inspired palette — deliberately not a generic
        // blue/purple SaaS gradient theme.
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
      },
      borderRadius: {
        xl: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;
