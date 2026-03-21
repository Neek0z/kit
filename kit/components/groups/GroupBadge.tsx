import { View, Text, TouchableOpacity, ViewProps } from "react-native";
import type { Group } from "../../types";

type GroupBadgeSource = Pick<Group, "name" | "emoji" | "color">;

interface GroupBadgeProps extends ViewProps {
  group: GroupBadgeSource;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function GroupBadge({
  group,
  onRemove,
  size = "md",
  style,
  ...props
}: GroupBadgeProps) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          backgroundColor: `${group.color}18`,
          borderWidth: 1,
          borderColor: `${group.color}35`,
          borderRadius: 100,
          paddingHorizontal: size === "sm" ? 8 : 10,
          paddingVertical: size === "sm" ? 3 : 4,
          alignSelf: "flex-start",
        },
        style,
      ]}
      {...props}
    >
      <Text style={{ fontSize: size === "sm" ? 10 : 11 }}>{group.emoji}</Text>
      <Text
        style={{
          fontSize: size === "sm" ? 10 : 11,
          fontWeight: "600",
          color: group.color,
        }}
      >
        {group.name}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={{ marginLeft: 2 }}>
          <Text
            style={{ fontSize: 11, color: group.color, opacity: 0.7 }}
          >
            ×
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

