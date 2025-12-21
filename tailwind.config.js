/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: "#F4F7FF",
        primary: "#4169E1",
        secondary: "#5BC0EB",
        accent1: "#FFC857",
        accent2: "#F45B69",
        accent3: "#8D7CF6",
        ink: "#0F172A",
        inkMuted: "#55607A",
        line: "#D7DEF2",
        panel: "#FFFFFF",
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
