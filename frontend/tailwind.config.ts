import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1a6b3c",
        "primary-light": "#e8f5ee",
        accent: "#e85d2f",
      },
    },
  },
  plugins: [],
};

export default config;
