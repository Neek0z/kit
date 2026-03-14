import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, Avatar, Badge } from "../ui";
import { Contact, PIPELINE_LABELS, PipelineStatus } from "../../types";

const STATUS_VARIANTS: Record<
  PipelineStatus,
  "success" | "info" | "warning" | "neutral" | "danger"
> = {
  new: "neutral",
  contacted: "info",
  interested: "warning",
  follow_up: "danger",
  client: "success",
  inactive: "neutral",
};

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-3 py-3 px-5 border-b border-border">
        <Avatar name={contact.full_name} size="md" />
        <View className="flex-1">
          <Text variant="h3" className="text-base">
            {contact.full_name}
          </Text>
          {contact.phone && (
            <Text variant="muted" className="text-xs mt-0.5">
              {contact.phone}
            </Text>
          )}
          {(contact.tags?.length ?? 0) > 0 && (
            <View className="flex-row flex-wrap gap-1 mt-1">
              {(contact.tags ?? []).slice(0, 3).map((tag) => (
                <View
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-border dark:bg-border-dark"
                >
                  <Text variant="muted" className="text-[10px]">{tag}</Text>
                </View>
              ))}
              {(contact.tags?.length ?? 0) > 3 && (
                <View className="px-2 py-0.5">
                  <Text variant="muted" className="text-[10px]">
                    +{(contact.tags?.length ?? 0) - 3}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View className="items-end gap-1">
          <Badge
            label={
              PIPELINE_LABELS[contact.status as PipelineStatus] ?? contact.status
            }
            variant={
              STATUS_VARIANTS[contact.status as PipelineStatus] ?? "neutral"
            }
          />
          {contact.next_follow_up && (
            <Text variant="muted" className="text-xs">
              {new Date(contact.next_follow_up).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={16} color="#475569" />
      </View>
    </TouchableOpacity>
  );
}
