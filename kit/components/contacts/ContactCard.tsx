import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, Avatar, StatusPill } from "../ui";
import { Contact, PipelineStatus } from "../../types";
import { usePendingRelancesCount } from "../../hooks/useContactRelances";
import { useTheme, STATUS_COLORS, StatusKey } from "../../lib/theme";

const STATUS_PROGRESS: Record<PipelineStatus, number> = {
  new: 0,
  contacted: 1,
  interested: 2,
  follow_up: 3,
  client: 4,
  inactive: 0,
};

const TOTAL_STEPS = 4;

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const { pendingCount } = usePendingRelancesCount(contact.id);
  const theme = useTheme();
  const progress = STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0;
  const progressPercent = (progress / TOTAL_STEPS) * 100;
  const statusColors =
    STATUS_COLORS[contact.status as StatusKey] ?? STATUS_COLORS.inactive;

  return (
    <View>
      <TouchableOpacity
        onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-3 py-3 px-5">
          <Avatar
            name={contact.full_name}
            size="md"
            url={contact.avatar_url}
            status={contact.status}
          />
          <View className="flex-1">
            <Text variant="h3" className="text-base">
              {contact.full_name}
            </Text>
            {contact.phone && (
              <Text variant="muted" className="text-xs mt-0.5">
                {contact.phone}
              </Text>
            )}

            {/* Barre de progression pipeline */}
            <View
              style={{
                marginTop: 6,
                height: 3,
                backgroundColor: theme.border,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 3,
                  width: `${progressPercent}%`,
                  backgroundColor: statusColors.text,
                  borderRadius: 2,
                }}
              />
            </View>

            {(contact.tags?.length ?? 0) > 0 && (
              <View className="flex-row flex-wrap gap-1 mt-1">
                {(contact.tags ?? []).slice(0, 3).map((tag) => (
                  <View
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-border dark:bg-border-dark"
                  >
                    <Text variant="muted" className="text-[10px]">
                      {tag}
                    </Text>
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
            <StatusPill status={contact.status} size="sm" />
            {pendingCount > 0 && (
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: theme.primaryBg,
                  borderWidth: 1,
                  borderColor: theme.primaryBorder,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "700",
                    color: theme.primary,
                  }}
                >
                  {pendingCount}
                </Text>
              </View>
            )}
            {contact.next_follow_up && (
              <Text variant="muted" className="text-xs">
                {new Date(contact.next_follow_up).toLocaleDateString(
                  "fr-FR",
                  {
                    day: "numeric",
                    month: "short",
                  }
                )}
              </Text>
            )}
          </View>
          <Feather name="chevron-right" size={16} color={theme.textHint} />
        </View>
      </TouchableOpacity>
      {/* Séparateur indenté */}
      <View
        style={{
          height: 1,
          backgroundColor: theme.border,
          marginLeft: 72,
        }}
      />
    </View>
  );
}
