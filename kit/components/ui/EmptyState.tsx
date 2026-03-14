import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      {icon && <Text className="text-5xl">{icon}</Text>}
      <Text variant="h3" className="text-center">
        {title}
      </Text>
      {description && (
        <Text variant="muted" className="text-center leading-relaxed">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-2 w-full">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}
