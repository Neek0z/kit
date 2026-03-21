import { useCallback } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Text as RNText,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  useNotificationCenter,
  type NotificationItem,
} from "../../hooks/useNotificationCenter";
import { useTheme } from "../../lib/theme";

const NOTIF_CONFIG = {
  follow_up: {
    icon: "bell" as const,
    color: "#f87171",
    bg: "#fef2f2",
  },
  task: {
    icon: "check-square" as const,
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  workflow: {
    icon: "git-branch" as const,
    color: "#818cf8",
    bg: "#f5f3ff",
  },
  message: {
    icon: "message-circle" as const,
    color: "#10b981",
    bg: "#f0fdf4",
  },
  appointment: {
    icon: "calendar" as const,
    color: "#0ea5e9",
    bg: "#f0f9ff",
  },
};

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const theme = useTheme();
  const config = NOTIF_CONFIG[item.type];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 20,
      }}
      activeOpacity={0.7}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: config.bg,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Feather name={config.icon} size={18} color={config.color} />
      </View>

      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginBottom: 3,
          }}
        >
          <RNText
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.textPrimary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.title}
          </RNText>
          {item.isUrgent && (
            <View
              style={{
                backgroundColor: "#fef2f2",
                borderRadius: 100,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <RNText
                style={{ fontSize: 9, fontWeight: "700", color: "#ef4444" }}
              >
                URGENT
              </RNText>
            </View>
          )}
        </View>
        <RNText
          style={{ fontSize: 12, color: theme.textMuted }}
          numberOfLines={1}
        >
          {item.subtitle}
        </RNText>
      </View>

      <Feather name="chevron-right" size={16} color={theme.textHint} />
    </TouchableOpacity>
  );
}

const GROUPS = [
  { key: "follow_up", label: "Relances" },
  { key: "task", label: "Tâches" },
  { key: "workflow", label: "Workflow" },
  { key: "appointment", label: "RDV du jour" },
  { key: "message", label: "Messages" },
] as const;

export default function NotificationsScreen() {
  const theme = useTheme();
  const { notifications, loading, urgentCount, refetch } =
    useNotificationCenter();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fb" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Feather name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <RNText
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: theme.textPrimary,
          }}
        >
          Notifications
        </RNText>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color="#10b981" />
        </View>
      ) : notifications.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#f0fdf4",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="bell" size={28} color="#10b981" />
          </View>
          <RNText
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: theme.textPrimary,
            }}
          >
            Tout est à jour !
          </RNText>
          <RNText
            style={{
              fontSize: 14,
              color: theme.textMuted,
              textAlign: "center",
              paddingHorizontal: 40,
            }}
          >
            Aucune notification en attente.
          </RNText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor="#10b981"
            />
          }
        >
          {urgentCount > 0 && (
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 16,
                backgroundColor: "#fef2f2",
                borderRadius: 16,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Feather name="alert-circle" size={20} color="#ef4444" />
              <RNText
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: "600",
                  color: "#ef4444",
                }}
              >
                {urgentCount} action{urgentCount > 1 ? "s" : ""} urgente
                {urgentCount > 1 ? "s" : ""} à traiter
              </RNText>
            </View>
          )}

          {GROUPS.map((group) => {
            const groupItems = notifications.filter(
              (n) => n.type === group.key
            );
            if (groupItems.length === 0) return null;

            return (
              <View key={group.key} style={{ marginBottom: 8 }}>
                <RNText
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color: theme.textHint,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    paddingHorizontal: 20,
                    paddingVertical: 8,
                  }}
                >
                  {group.label} ({groupItems.length})
                </RNText>

                <View
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    marginHorizontal: 20,
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  {groupItems.map((item, i) => (
                    <View key={item.id}>
                      <NotificationRow
                        item={item}
                        onPress={() => router.push(item.route as any)}
                      />
                      {i < groupItems.length - 1 && (
                        <View
                          style={{
                            height: 1,
                            backgroundColor: "#f1f5f9",
                            marginLeft: 78,
                          }}
                        />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
