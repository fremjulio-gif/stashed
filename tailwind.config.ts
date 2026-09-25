import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        studio: {
          950: "#060709",
          900: "#0a0c10",
          850: "#0f1218",
          800: "#151922",
          700: "#1e2430",
          600: "#2d3545",
          500: "#444e64",
          400: "#6e7b95",
          300: "#9da9c0",
          200: "#cbd5e1",
          100: "#f1f5f9",
        },
        accent: {
          cyan: "#00ffd5",
          amber: "#ff9f1c",
          violet: "#a855f7",
          emerald: "#10b981",
          rose: "#f43f5e",
          blue: "#38bdf8",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.35)",
        "glass-lg": "0 16px 48px 0 rgba(0, 0, 0, 0.6)",
        "glow-cyan": "0 0 24px -4px rgba(0, 255, 213, 0.4)",
        "glow-amber": "0 0 24px -4px rgba(255, 159, 28, 0.4)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
        "glass-highlight":
          "linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
