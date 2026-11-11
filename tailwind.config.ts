import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        farm: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#0b381d",
        },
        terracotta: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
        sand: {
          50: "#FAF8F5",
          100: "#F4EFEA",
          200: "#E8DFD5",
          300: "#D6C7B8",
          400: "#B8A38E",
          500: "#9B846D",
          600: "#7D6852",
        },
        momo: {
          wave: "#00A3FF",
          orange: "#FF7900",
          mtn: "#FFCC00",
          moov: "#005DAA",
          cash: "#10B981",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 4px 6px -1px rgba(27, 67, 50, 0.06), 0 2px 4px -2px rgba(27, 67, 50, 0.04)",
        lifted: "0 10px 15px -3px rgba(27, 67, 50, 0.08), 0 4px 6px -4px rgba(27, 67, 50, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
