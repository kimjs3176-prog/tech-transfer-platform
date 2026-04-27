import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        "primary-light": "#eff6ff",
        "primary-dark": "#1d4ed8",
        accent: "#f97316",
        "accent-light": "#fff7ed",
        sidebar: "#ffffff",
        "card-bg": "#ffffff",
        "page-bg": "#f8fafc",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        purple: "#8b5cf6",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.10)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
    },
  },
  plugins: [],
};

export default config;
