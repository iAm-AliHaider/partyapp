import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        pakistan: {
          green: "#01411C",
          "green-light": "#026B2E",
          "green-dark": "#012E14",
          white: "#FFFFFF",
        },
        party: {
          red: "#DC2626",
          "red-dark": "#B91C1C",
          "red-light": "#EF4444",
          gold: "#EAB308",
          "gold-dark": "#CA8A04",
          primary: "#DC2626",
          secondary: "#01411C",
          accent: "#EAB308",
          danger: "#DC2626",
          success: "#16A34A",
        },
      },
      fontFamily: {
        urdu: ['"Noto Nastaliq Urdu"', "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
