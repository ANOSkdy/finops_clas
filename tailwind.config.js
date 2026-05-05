/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--base) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        accent1: "rgb(var(--accent1) / <alpha-value>)",
        accent2: "rgb(var(--danger) / <alpha-value>)",
        accent3: "rgb(var(--accent3) / <alpha-value>)",
        ink: "rgb(var(--text) / <alpha-value>)",
        inkMuted: "rgb(var(--text-muted) / <alpha-value>)",
        line: "rgb(var(--border) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        action: "rgb(var(--button) / <alpha-value>)",
        actionPressed: "rgb(var(--button-pressed) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 4px 8px rgba(0,0,0,0.10)",
        softSm: "0 1px 3px rgba(0,0,0,0.08)",
        raised: "0 8px 24px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        lg: "8px",
        xl: "12px",
        "2xl": "12px",
        "3xl": "16px",
      },
    },
  },
  plugins: [],
};
