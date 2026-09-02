import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        mist: "#f5f7f4",
        leaf: "#2f7d63",
        coral: "#d8644a",
        sun: "#e3aa38",
        sky: "#4f7fbf",
        border: "var(--border)",
        input: "var(--input)",
        "input-bg": "var(--input-bg)",
        ring: "var(--ring)",
        background: "var(--background)",
        "background-dark": "var(--background-dark)",
        foreground: "var(--foreground)",
        overlay: "var(--overlay)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
          pressed: "var(--primary-pressed)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 33, 31, 0.08)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
