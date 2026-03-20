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
          borderWidth: theme.isDark ? 1 : 0.5,
          borderColor: accent
            ? theme.isDark
              ? theme.borderAccent
              : "rgba(13,148,136,0.14)"
            : theme.isDark
              ? theme.border
              : "rgba(0,0,0,0.06)",
          borderRadius: 18,
          padding: PADDINGS[padding],
          ...(theme.isDark
            ? {}
            : {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
              }),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

