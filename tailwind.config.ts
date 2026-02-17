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
        accent: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
          dark: "#991B1B",
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#DC2626",
          600: "#B91C1C",
          700: "#991B1B",
        },
        surface: {
          primary: "#FFFFFF",
          secondary: "#F9FAFB",
          tertiary: "#F3F4F6",
          elevated: "rgba(255, 255, 255, 0.8)",
        },
        label: {
          primary: "#1C1C1E",
          secondary: "#6B7280",
          tertiary: "#9CA3AF",
          quaternary: "#D1D5DB",
        },
        separator: {
          DEFAULT: "#E5E7EB",
          opaque: "#F3F4F6",
        },
        gold: {
          DEFAULT: "#D4A843",
          light: "#F5E6C8",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', '"SF Pro Text"', 'system-ui', '-apple-system', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
        mono: ['"SF Mono"', '"Inter"', 'monospace'],
      },
      fontSize: {
        'title-lg': ['34px', { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.01em' }],
        'title': ['28px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'title-sm': ['22px', { lineHeight: '1.25', fontWeight: '600', letterSpacing: '-0.005em' }],
        'headline': ['17px', { lineHeight: '1.35', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.47', fontWeight: '400' }],
        'callout': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
        'subhead': ['13px', { lineHeight: '1.38', fontWeight: '400' }],
        'footnote': ['12px', { lineHeight: '1.33', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '1.27', fontWeight: '400' }],
      },
      borderRadius: {
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
      },
      boxShadow: {
        'apple': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'apple-md': '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'apple-lg': '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
        'apple-inset': 'inset 0 1px 2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
