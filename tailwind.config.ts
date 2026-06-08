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
        canvas: "var(--canvas)",
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
          4: "var(--surface-4)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          focus: "var(--primary-focus)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          muted: "var(--ink-muted)",
          subtle: "var(--ink-subtle)",
          tertiary: "var(--ink-tertiary)",
        },
        hairline: {
          DEFAULT: "var(--hairline)",
          strong: "var(--hairline-strong)",
          tertiary: "var(--hairline-tertiary)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        brand: {
          secure: "#7a7fad",
        },
        status: {
          registered: "#5e6ad2",
          medical: "#0ea5e9",
          lmis: "#a855f7",
          musaned: "#f59e0b",
          enjaz: "#10b981",
          flight: "#27a644",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "-apple-system", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "24px",
      },
    },
  },
  plugins: [],
};
export default config;
