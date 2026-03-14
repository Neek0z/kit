import { View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: React.ComponentProps<typeof Feather>["name"];
    onPress: () => void;
    accessibilityLabel?: string;
  };
}

export function Header({
  title,
  subtitle,
  showBack = false,
  rightAction,
}: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
      <View className="flex-row items-center gap-3 flex-1">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} className="mr-1">
            <Feather name="arrow-left" size={22} color="#f1f5f9" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text variant="h2">{title}</Text>
          {subtitle && (
            <Text variant="muted" className="mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          className="p-1"
          accessibilityRole="button"
          accessibilityLabel={rightAction.accessibilityLabel}
        >
          <Feather name={rightAction.icon} size={22} color="#6ee7b7" />
        </TouchableOpacity>
      )}
    </View>
  );
}
