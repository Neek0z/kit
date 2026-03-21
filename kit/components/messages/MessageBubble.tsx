import { View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";
import { useTheme } from "../../lib/theme";
import type { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  /** Affiché au-dessus du texte en conversation de groupe (messages des autres). */
  senderLabel?: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  isOwn,
  senderLabel,
}: MessageBubbleProps) {
  const theme = useTheme();
  const isRead = !!message.read_at;

  return (
    <View
      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isOwn
          ? "self-end bg-primary rounded-br-md"
          : "self-start bg-surface border border-border rounded-bl-md"
      }`}
    >
      {!isOwn && senderLabel ? (
        <Text className="text-xs font-semibold text-primary mb-1">
          {senderLabel}
        </Text>
      ) : null}
      <Text
        className={`text-sm ${isOwn ? "text-background" : "text-textMain"}`}
      >
        {message.content}
      </Text>
      <View className="flex-row items-center gap-1.5 mt-1">
        <Text
          className={`text-xs ${isOwn ? "text-background/70" : "text-textMuted"}`}
        >
          {formatTime(message.created_at)}
        </Text>
        {isOwn && (
          <Feather
            name={isRead ? "check-circle" : "check"}
            size={12}
            color={isRead ? theme.textPrimary : theme.textMuted}
          />
        )}
      </View>
    </View>
  );
}
