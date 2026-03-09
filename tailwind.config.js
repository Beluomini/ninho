/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4A7C59",
        "primary-light": "#A8D5BA",
        surface: "#FFFFFF",
        border: "#E0E0E0",
        danger: "#EF4444",
        success: "#22C55E",
        inactive: "#9E9E9E",
      },
    },
  },
  plugins: [],
};
