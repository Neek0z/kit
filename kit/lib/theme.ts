import { useColorScheme } from "react-native";

export const STATUS_COLORS = {
  new: {
    text: "#94a3b8",
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.25)",
  },
  contacted: {
    text: "#818cf8",
    bg: "rgba(129,140,248,0.1)",
    border: "rgba(129,140,248,0.25)",
  },
  interested: {
    text: "#fbbf24",
    bg: "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.25)",
  },
  follow_up: {
    text: "#f87171",
    bg: "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.25)",
  },
  client: {
    text: "#6ee7b7",
    bg: "rgba(110,231,183,0.1)",
    border: "rgba(110,231,183,0.25)",
  },
  inactive: {
    text: "#475569",
    bg: "rgba(71,85,105,0.1)",
    border: "rgba(71,85,105,0.2)",
  },
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return {
    isDark,
    bg: isDark ? "#080c12" : "#f8f9fb",
    surface: isDark ? "#0e1420" : "#ffffff",
    surfaceAlt: isDark ? "#0e1420" : "#f1f4f8",
    surfaceHover: isDark ? "#131b28" : "#f8fafc",
    textPrimary: isDark ? "#f1f5f9" : "#0f172a",
    textMuted: isDark ? "#64748b" : "#64748b",
    textHint: isDark ? "#334155" : "#94a3b8",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    borderAccent: isDark ? "rgba(110,231,183,0.2)" : "rgba(15,118,110,0.2)",
    primary: isDark ? "#6ee7b7" : "#0d9488",
    primaryBg: isDark ? "rgba(110,231,183,0.12)" : "rgba(13,148,136,0.08)",
    primaryBorder: isDark ? "rgba(110,231,183,0.3)" : "rgba(13,148,136,0.2)",
    accentLine: isDark
      ? "linear-gradient(90deg, transparent, rgba(110,231,183,0.4), transparent)"
      : "linear-gradient(90deg, transparent, rgba(5,150,105,0.35), transparent)",

    danger: "#f87171",
    dangerBg: "rgba(248,113,113,0.1)",
    dangerBorder: "rgba(248,113,113,0.25)",
    warning: "#fbbf24",
    warningBg: "rgba(251,191,36,0.1)",
    warningBorder: "rgba(251,191,36,0.25)",
    accent: "#818cf8",
    accentBg: "rgba(129,140,248,0.1)",
    accentBorder: "rgba(129,140,248,0.25)",
    success: "#22c55e",
    successBg: "rgba(34,197,94,0.1)",
    successBorder: "rgba(34,197,94,0.25)",

    spacing: {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 22,
      title: 26,
      hero: 28,
    },
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 18,
      full: 100,
    },
  };
}

