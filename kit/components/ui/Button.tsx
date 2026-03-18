import { TouchableOpacity, Text as RNText, ActivityIndicator } from "react-native";
import { useTheme } from "../../lib/theme";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false
}: ButtonProps) {
  const theme = useTheme();

  const baseStyle = {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
  };

  const variants = {
    primary: {
      backgroundColor: theme.primaryBg,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
    },
    secondary: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    ghost: {
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "transparent",
    },
  } as const;

  const textColors = {
    primary: {
      color: theme.primary,
      fontWeight: "700" as const,
      fontSize: 15,
    },
    secondary: {
      color: theme.textPrimary,
      fontWeight: "700" as const,
      fontSize: 15,
    },
    ghost: {
      color: theme.primary,
      fontWeight: "700" as const,
      fontSize: 15,
    },
  } as const;

  return (
    <TouchableOpacity
      style={[
        baseStyle,
        variants[variant],
        disabled || loading ? { opacity: 0.5 } : null,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? theme.textPrimary : theme.primary}
        />
      ) : (
        <RNText style={textColors[variant]}>{label}</RNText>
      )}
    </TouchableOpacity>
  );
}
