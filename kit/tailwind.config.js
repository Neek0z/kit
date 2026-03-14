module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#6ee7b7",
        secondary: "#818cf8",
        danger: "#f87171",
        // Light (default) / Dark (when .dark on ancestor)
        background: {
          DEFAULT: "#f1f5f9",
          dark: "#0f172a",
        },
        surface: {
          DEFAULT: "#e2e8f0",
          dark: "#1e293b",
        },
        border: {
          DEFAULT: "#cbd5e1",
          dark: "#334155",
        },
        textMain: {
          DEFAULT: "#0f172a",
          dark: "#f1f5f9",
        },
        textMuted: {
          DEFAULT: "#64748b",
          dark: "#94a3b8",
        },
        onPrimary: "#0f172a",
      },
    },
  },
  plugins: [],
};
