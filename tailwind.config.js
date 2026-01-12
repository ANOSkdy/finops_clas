/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Core tokens
        base: "rgb(var(--base) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",

        // Accents
        accent1: "rgb(var(--accent1) / <alpha-value>)",
        accent2: "rgb(var(--danger) / <alpha-value>)", // Accent-2 (#F25F5C)
        accent3: "rgb(var(--accent3) / <alpha-value>)",

        // Text & UI
        ink: "rgb(var(--text) / <alpha-value>)",
        inkMuted: "rgb(var(--text-muted) / <alpha-value>)",
        line: "rgb(var(--border) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",

        // Button-only color (exclude bottom nav)
        action: "rgb(var(--button) / <alpha-value>)",
        actionPressed: "rgb(var(--button-pressed) / <alpha-value>)",

        // Optional alias (safe)
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      boxShadow: {
        soft: "0 20px 48px rgba(15,23,42,0.12)",
        softSm: "0 10px 28px rgba(15,23,42,0.10)",
      },
      borderRadius: { xl: "16px", "2xl": "20px" },
    },
  },
  plugins: [],
};
