import { View, ViewProps } from "react-native";
import { useTheme } from "../../lib/theme";

interface CardProps extends ViewProps {
  padding?: "sm" | "md" | "lg";
  accent?: boolean;
}

const PADDINGS = { sm: 10, md: 14, lg: 20 };

export function Card({
  padding = "md",
  accent = false,
  style,
  children,
  ...props
}: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderWidth: theme.isDark ? 1 : 0,
          borderColor: accent
            ? theme.isDark
              ? theme.borderAccent
              : "rgba(16,185,129,0.14)"
            : theme.isDark
              ? theme.border
              : "transparent",
          borderRadius: 16,
          padding: PADDINGS[padding],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: theme.isDark ? 0 : 0.06,
          shadowRadius: 8,
          elevation: theme.isDark ? 0 : 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
