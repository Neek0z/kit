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
  sm: { container: 32, text: 12 },
  md: { container: 44, text: 15 },
  lg: { container: 64, text: 22 },
};

const STATUS_BG_COLORS: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#818cf8",
  interested: "#fbbf24",
  follow_up: "#f87171",
  client: "#10b981",
  inactive: "#475569",
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
  const bgColor = status ? (STATUS_BG_COLORS[status] ?? "#475569") : "#10b981";

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
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: "#ffffff",
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
