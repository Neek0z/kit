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
          borderWidth: 1,
          borderColor: accent ? theme.borderAccent : theme.border,
          borderRadius: 18,
          padding: PADDINGS[padding],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

