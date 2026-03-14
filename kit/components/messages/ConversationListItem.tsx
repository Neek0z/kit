import { View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text, Avatar } from "../ui";
import type { ConversationWithDetails } from "../../hooks/useConversations";

interface ConversationListItemProps {
  conversation: ConversationWithDetails;
}

function formatLastMessageTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

export function ConversationListItem({ conversation }: ConversationListItemProps) {
  const router = useRouter();
  const other = conversation.otherParticipant;
  const displayName = other?.full_name || other?.email || "Utilisateur";
  const preview = conversation.lastMessage?.content;
  const trimmedPreview =
    preview && preview.length > 45 ? preview.slice(0, 45) + "…" : preview;
  const time = conversation.lastMessage
    ? formatLastMessageTime(conversation.lastMessage.created_at)
    : null;

  const unread = conversation.unread_count ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/messages/${conversation.id}`)}
      className="flex-row items-center gap-3 px-5 py-3.5 bg-background dark:bg-background-dark border-b border-border/50 dark:border-border-dark/50 active:opacity-80"
      activeOpacity={1}
    >
      <View className="relative">
        <Avatar
          name={displayName}
          url={other?.avatar_url}
          size="md"
        />
        {unread > 0 && (
          <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary items-center justify-center px-1">
            <Text className="text-[10px] font-bold text-onPrimary" numberOfLines={1}>
              {unread > 99 ? "99+" : unread}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-1 min-w-0">
        <View className="flex-row items-center justify-between gap-2">
          <Text className={`text-base font-semibold ${unread > 0 ? "text-textMain dark:text-textMain-dark" : "text-textMain dark:text-textMain-dark"}`} numberOfLines={1}>
            {displayName}
          </Text>
          {time && (
            <Text variant="muted" className="text-xs shrink-0">
              {time}
            </Text>
          )}
        </View>
        {trimmedPreview && (
          <Text
            variant="muted"
            className="text-sm mt-0.5"
            numberOfLines={1}
          >
            {trimmedPreview}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
