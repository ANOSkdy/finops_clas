/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "#FAFAFC",
        primary: "#4169E1",
        secondary: "#50E3C2",
        accent1: "#FFD166",
        accent2: "#F25F5C",
        accent3: "#9D59EC",
        ink: "#1E293B",
        inkMuted: "#64748B",
        line: "#E2E8F0",
        panel: "#FFFFFF",
      },
      boxShadow: {
        soft: "0 14px 40px rgba(30,41,59,0.10)",
        softSm: "0 8px 24px rgba(30,41,59,0.10)",
      },
      borderRadius: { xl: "16px", "2xl": "20px" },
    },
  },
  plugins: [],
};