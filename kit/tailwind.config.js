module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // === NOUVEAU THÈME (tokens) ===
        dark: {
          bg: "#080c12",
          surface: "#0e1420",
          border: "rgba(255,255,255,0.07)",
          muted: "#334155",
        },

        light: {
          bg: "#f4f6f9",
          surface: "#ffffff",
          border: "rgba(0,0,0,0.07)",
          muted: "#94a3b8",
        },

        // === COULEURS SÉMANTIQUES (identiques dark/light) ===
        primary: "#6ee7b7",
        "primary-light": "#059669",
        status: {
          new: {
            color: "#94a3b8",
            bg: "rgba(148,163,184,0.1)",
            border: "rgba(148,163,184,0.2)",
          },
          contacted: {
            color: "#818cf8",
            bg: "rgba(129,140,248,0.1)",
            border: "rgba(129,140,248,0.2)",
          },
          interested: {
            color: "#fbbf24",
            bg: "rgba(251,191,36,0.1)",
            border: "rgba(251,191,36,0.2)",
          },
          follow_up: {
            color: "#f87171",
            bg: "rgba(248,113,113,0.1)",
            border: "rgba(248,113,113,0.2)",
          },
          client: {
            color: "#6ee7b7",
            bg: "rgba(110,231,183,0.1)",
            border: "rgba(110,231,183,0.2)",
          },
          inactive: {
            color: "#475569",
            bg: "rgba(71,85,105,0.1)",
            border: "rgba(71,85,105,0.2)",
          },
        },

        // === ALIAS POUR L'ANCIEN DESIGN (compatibilité) ===
        background: {
          DEFAULT: "#f4f6f9",
          dark: "#080c12",
        },
        surface: {
          DEFAULT: "#ffffff",
          dark: "#0e1420",
        },
        border: {
          DEFAULT: "rgba(0,0,0,0.07)",
          dark: "rgba(255,255,255,0.07)",
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
        secondary: "#818cf8",
        danger: "#f87171",
      },
    },
  },
  plugins: [],
};
