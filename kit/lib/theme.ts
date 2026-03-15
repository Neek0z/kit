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
    bg: isDark ? "#080c12" : "#f4f6f9",
    surface: isDark ? "#0e1420" : "#ffffff",
    surfaceHover: isDark ? "#131b28" : "#f8fafc",
    textPrimary: isDark ? "#f1f5f9" : "#0f172a",
    textMuted: isDark ? "#64748b" : "#94a3b8",
    textHint: isDark ? "#334155" : "#cbd5e1",
    border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    borderAccent: isDark ? "rgba(110,231,183,0.2)" : "rgba(5,150,105,0.2)",
    primary: isDark ? "#6ee7b7" : "#059669",
    primaryBg: isDark ? "rgba(110,231,183,0.12)" : "rgba(5,150,105,0.1)",
    primaryBorder: isDark ? "rgba(110,231,183,0.3)" : "rgba(5,150,105,0.25)",
    accentLine: isDark
      ? "linear-gradient(90deg, transparent, rgba(110,231,183,0.4), transparent)"
      : "linear-gradient(90deg, transparent, rgba(5,150,105,0.35), transparent)",
  };
}

