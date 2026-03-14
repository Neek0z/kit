import { View, Text } from "react-native";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, { container: string; text: string }> = {
  success: { container: "bg-primary/10", text: "text-primary" },
  warning: { container: "bg-yellow-400/10", text: "text-yellow-400" },
  danger: { container: "bg-danger/10", text: "text-danger" },
  info: { container: "bg-secondary/10", text: "text-secondary" },
  neutral: { container: "bg-border dark:bg-border-dark", text: "text-textMuted dark:text-textMuted-dark" },
};

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <View
      className={`px-2.5 py-1 rounded-full self-start ${styles[variant].container}`}
    >
      <Text className={`text-xs font-semibold ${styles[variant].text}`}>
        {label}
      </Text>
    </View>
  );
}
