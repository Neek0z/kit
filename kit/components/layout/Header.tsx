import { View, TouchableOpacity, Text as RNText } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme, screenTitleTextStyle } from "../../lib/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
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
  onBack,
  rightAction,
}: HeaderProps) {
  const theme = useTheme();

  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
      <View className="flex-row items-center gap-3 flex-1">
        {showBack && (
          <TouchableOpacity
            onPress={onBack ?? (() => router.back())}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.primaryBg,
              borderWidth: 1,
              borderColor: theme.primaryBorder,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 2,
            }}
          >
            <Feather name="arrow-left" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <RNText
            style={screenTitleTextStyle(theme)}
            numberOfLines={1}
          >
            {title}
          </RNText>
          {subtitle && (
            <RNText
              style={{
                marginTop: 2,
                fontSize: 13,
                color: theme.textMuted,
                fontWeight: "600",
              }}
              numberOfLines={1}
            >
              {subtitle}
            </RNText>
          )}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity
          onPress={rightAction.onPress}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: theme.primaryBg,
            borderWidth: 1,
            borderColor: theme.primaryBorder,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityRole="button"
          accessibilityLabel={rightAction.accessibilityLabel}
        >
          <Feather name={rightAction.icon} size={18} color={theme.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}
