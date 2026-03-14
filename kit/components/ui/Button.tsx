import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

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
  const base = "rounded-xl px-6 py-4 items-center justify-center";
  const variants = {
    primary: "bg-primary",
    secondary: "bg-surface dark:bg-surface-dark border border-border dark:border-border-dark",
    ghost: "bg-transparent",
  } as const;
  const textColors = {
    primary: "text-onPrimary font-bold",
    secondary: "text-textMain dark:text-textMain-dark",
    ghost: "text-primary",
  } as const;

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${
        disabled || loading ? "opacity-50" : ""
      }`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#0f172a" : "#6ee7b7"}
        />
      ) : (
        <Text className={textColors[variant]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
