import { View, Text, ViewProps } from "react-native";
import { STATUS_COLORS, StatusKey } from "../../lib/theme";
import { PIPELINE_LABELS } from "../../types";

interface StatusPillProps extends ViewProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "md", style, ...props }: StatusPillProps) {
  const colors = STATUS_COLORS[status as StatusKey] ?? STATUS_COLORS.inactive;
  const label = PIPELINE_LABELS[status as StatusKey] ?? status;

  return (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 999,
          paddingHorizontal: size === "sm" ? 8 : 10,
          paddingVertical: size === "sm" ? 2 : 3,
          alignSelf: "flex-start",
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: size === "sm" ? 10 : 11,
          fontWeight: "600",
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

