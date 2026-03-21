import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { STATUS_COLORS, StatusKey } from "../../lib/theme";

const PLACEHOLDER_BLURHASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface AvatarProps {
  name?: string;
  url?: string | null;
  status?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { container: 32, text: 12, border: 1 },
  md: { container: 40, text: 14, border: 1.5 },
  lg: { container: 60, text: 20, border: 2 },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const Avatar = React.memo(function Avatar({ name, url, status, size = "md" }: AvatarProps) {
  const s = SIZES[size];
  const colors = status
    ? STATUS_COLORS[status as StatusKey] ?? STATUS_COLORS.inactive
    : {
        text: "#6ee7b7",
        bg: "rgba(110,231,183,0.1)",
        border: "rgba(110,231,183,0.25)",
      };

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        placeholder={{ blurhash: PLACEHOLDER_BLURHASH }}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        style={{
          width: s.container,
          height: s.container,
          borderRadius: s.container / 2,
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: s.container,
        height: s.container,
        borderRadius: s.container / 2,
        backgroundColor: colors.bg,
        borderWidth: s.border,
        borderColor: colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: s.text,
          fontWeight: "700",
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
});

export { Avatar };

