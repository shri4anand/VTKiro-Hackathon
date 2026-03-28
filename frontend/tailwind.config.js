/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Vibrant Alert Palette
        "primary": "#FF3D00", // Neon Orange / Electric Red
        "on-primary": "#FFFFFF",
        "primary-container": "#FFEDE7",
        "on-primary-container": "#410D00",
        "secondary": "#00E676", // Bright Green for contrast
        "on-secondary": "#00391C",
        "secondary-container": "#D1FFE4",
        "tertiary": "#FFD600", // Bold Yellow for secondary elements
        "on-tertiary": "#322A00",
        "tertiary-container": "#FFF3A1",
        "surface": "#FFFFFF",
        "background": "#FAFAFA",
        "on-surface": "#1A1C1E",
        "on-background": "#1A1C1E",
        "surface-variant": "#F1F0EF",
        "on-surface-variant": "#44474E",
        "outline": "#74777F",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F7F3F2",
        "surface-container": "#F1EDED",
        "surface-container-high": "#EBE7E6",
        "surface-container-highest": "#E5E1E0",
      },
      fontFamily: {
        "headline": ["Public Sans", "sans-serif"],
        "body": ["Public Sans", "sans-serif"],
        "label": ["Public Sans", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem",
      },
    },
  },
  plugins: [],
};
