import { View, Text, Image } from "react-native";

interface AvatarProps {
  name?: string;
  url?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-11 h-11", text: "text-base" },
  lg: { container: "w-16 h-16", text: "text-xl" },
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

export function Avatar({ name, url, size = "md" }: AvatarProps) {
  const { container, text } = sizes[size];

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        className={`${container} rounded-full`}
      />
    );
  }

  return (
    <View
      className={`${container} rounded-full bg-primary/20 items-center justify-center`}
    >
      <Text className={`${text} font-bold text-primary`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
