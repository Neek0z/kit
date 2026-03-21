import React from "react";
import { View, TouchableOpacity, Text, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Avatar } from "../ui";
import { Contact, PipelineStatus } from "../../types";
import { useTheme, STATUS_COLORS, StatusKey } from "../../lib/theme";

const STATUS_PROGRESS: Record<PipelineStatus, number> = {
  new: 0,
  contacted: 1,
  interested: 2,
  follow_up: 3,
  client: 4,
  inactive: 0,
};

interface ContactCardProps {
  contact: Contact;
  pendingCount?: number;
  onPress?: () => void;
}

const ContactCard = React.memo(function ContactCard({
  contact,
  pendingCount = 0,
  onPress,
}: ContactCardProps) {
  const theme = useTheme();
  const statusColor =
    STATUS_COLORS[contact.status as StatusKey]?.text ?? "#10b981";
  const isOverdue =
    contact.next_follow_up && new Date(contact.next_follow_up) < new Date();
  const progressValue =
    STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/(app)/contacts/${contact.id}`);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 10,
        ...(theme.isDark
          ? {}
          : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }),
        borderWidth: theme.isDark ? 1 : 0,
        borderColor: theme.isDark ? theme.border : "transparent",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar
          name={contact.full_name}
          status={contact.status}
          size="md"
          url={contact.avatar_url}
        />

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: theme.textPrimary,
              }}
            >
              {contact.full_name}
            </Text>
            {pendingCount > 0 && (
              <View
                style={{
                  backgroundColor: theme.primaryBg,
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: theme.primary,
                  }}
                >
                  {pendingCount}
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{
              fontSize: 12,
              color: isOverdue ? theme.danger : theme.textMuted,
              marginBottom: 8,
            }}
          >
            {isOverdue
              ? `En retard · ${new Date(
                  contact.next_follow_up!
                ).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}`
              : contact.phone ?? "Aucun numéro"}
          </Text>

          {/* Multi-segment progress bar */}
          <View style={{ flexDirection: "row", gap: 3 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  backgroundColor:
                    i <= progressValue ? statusColor : theme.border,
                }}
              />
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: "column", gap: 8 }}>
          {contact.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: theme.primaryBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="phone" size={13} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handlePress}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="chevron-right" size={13} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export { ContactCard };
