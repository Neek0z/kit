import { Text as RNText, TextProps, StyleProp, TextStyle } from "react-native";
import { useTheme } from "../../lib/theme";

interface KitTextProps extends TextProps {
  variant?: "h1" | "h2" | "h3" | "body" | "small" | "muted";
}

export function Text({
  variant = "body",
  className = "",
  style,
  ...props
}: KitTextProps & { className?: string }) {
  const theme = useTheme();

  const variantStyles: Record<NonNullable<typeof variant>, TextStyle> = {
    h1: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -1,
      color: theme.textPrimary,
    },
    h2: {
      fontSize: 20,
      fontWeight: "700",
      letterSpacing: -0.5,
      color: theme.textPrimary,
    },
    h3: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.textPrimary,
    },
    body: {
      fontSize: 16,
      fontWeight: "400",
      color: theme.textPrimary,
      lineHeight: 22,
    },
    small: {
      fontSize: 14,
      color: theme.textPrimary,
    },
    muted: {
      fontSize: 14,
      color: theme.textMuted,
    },
  };

  const combinedStyle = [variantStyles[variant], style] as StyleProp<TextStyle>;

  return (
    <RNText
      {...props}
      style={combinedStyle}
      className={className}
    />
  );
}
