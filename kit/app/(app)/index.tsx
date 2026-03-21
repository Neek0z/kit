import { useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme, STATUS_COLORS, StatusKey } from "../../lib/theme";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { usePricing } from "../../hooks/usePricing";
import { Avatar } from "../../components/ui";
import { formatRelativeTime } from "../../lib/utils";
import {
  INTERACTION_ICONS,
  INTERACTION_LABELS,
  InteractionType,
  PipelineStatus,
  type FeatherIconName,
  type AppRoute,
} from "../../types";

const QUOTES = [
  "Votre réseau est votre valeur nette. Contactez 5 personnes aujourd'hui.",
  "La régularité bat le talent. Relancez aujourd'hui.",
  "Construisez des relations, pas des ventes.",
  "Chaque connexion est une opportunité.",
];

const STATUS_PROGRESS: Record<PipelineStatus, number> = {
  new: 0,
  contacted: 1,
  interested: 2,
  follow_up: 3,
  client: 4,
  inactive: 0,
};

const PIPELINE_STATUSES: Array<{
  key: PipelineStatus;
  label: string;
  color: string;
}> = [
  { key: "new", label: "NOUVEAU", color: STATUS_COLORS.new.text },
  { key: "contacted", label: "CONTACTÉ", color: STATUS_COLORS.contacted.text },
  { key: "interested", label: "INTÉRESSÉ", color: STATUS_COLORS.interested.text },
  { key: "follow_up", label: "RELANCE", color: STATUS_COLORS.follow_up.text },
  { key: "client", label: "CLIENT", color: STATUS_COLORS.client.text },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { isPro } = useSubscription();
  const { isEarlyAdopter, currentPrice, pricing } = usePricing();

  const {
    totalContacts,
    toFollowUp,
    byStatus,
    loading,
    refetch,
    weeklyNewContacts,
    monthlyNewClients,
    recentActivity,
  } = useDashboard();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const todayContacts = toFollowUp.slice(0, 3);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const overdueCount = useMemo(
    () =>
      toFollowUp.filter(
        (c) => c.next_follow_up && new Date(c.next_follow_up) < new Date()
      ).length,
    [toFollowUp]
  );

  const todayQuote = QUOTES[new Date().getDay() % QUOTES.length];

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#f8f9fb",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fb" }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 8,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 13,
                color: theme.textMuted,
                marginBottom: 4,
              }}
            >
              {getGreeting()}, {firstName}
            </Text>
            <Text
              style={{
                fontSize: 30,
                fontWeight: "800",
                color: theme.textPrimary,
                letterSpacing: -1,
              }}
            >
              Tableau de bord
            </Text>
          </View>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: "#10b981",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}
            >
              {firstName?.[0]?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Motivational quote */}
        <Text
          style={{
            fontSize: 13,
            color: theme.textMuted,
            fontStyle: "italic",
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          "{todayQuote}"
        </Text>

        {/* Quick action pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            paddingBottom: 20,
          }}
        >
          {[
            {
              label: "Nouveau contact",
              icon: "user-plus" as FeatherIconName,
              bg: "#10b981",
              fg: "#fff",
              route: "/(app)/contacts/new" as AppRoute,
            },
            {
              label: "Relance",
              icon: "bell" as FeatherIconName,
              bg: "#fef3c7",
              fg: "#92400e",
              route: "/(app)/contacts" as AppRoute,
            },
            {
              label: "Message",
              icon: "message-circle" as FeatherIconName,
              bg: "#ede9fe",
              fg: "#5b21b6",
              route: "/(app)/messages" as AppRoute,
            },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.label}
              onPress={() => router.push(btn.route)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 7,
                backgroundColor: btn.bg,
                borderRadius: 100,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Feather name={btn.icon} size={14} color={btn.fg} />
              <Text
                style={{ fontSize: 13, fontWeight: "600", color: btn.fg }}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pipeline */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: theme.textPrimary,
              }}
            >
              Pipeline
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(app)/contacts" as AppRoute)}
            >
              <Text
                style={{ fontSize: 13, color: "#10b981", fontWeight: "600" }}
              >
                Voir tout ›
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PIPELINE_STATUSES.map((s) => (
              <TouchableOpacity
                key={s.key}
                onPress={() => router.push("/(app)/contacts" as AppRoute)}
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  padding: 10,
                  alignItems: "flex-start",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: s.color,
                    marginBottom: 8,
                  }}
                />
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: theme.textPrimary,
                    lineHeight: 24,
                    marginBottom: 4,
                  }}
                >
                  {byStatus[s.key] ?? 0}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "600",
                    color: theme.textHint,
                    letterSpacing: 0.5,
                  }}
                  numberOfLines={1}
                >
                  {s.label}
                </Text>
                <View
                  style={{
                    height: 2,
                    width: "100%",
                    backgroundColor: s.color,
                    borderRadius: 1,
                    marginTop: 8,
                    opacity: 0.6,
                  }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Focus */}
        {todayContacts.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: theme.textPrimary,
                  }}
                >
                  Focus du jour
                </Text>
                {overdueCount > 0 && (
                  <View
                    style={{
                      backgroundColor: "#fef2f2",
                      borderRadius: 100,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: "#ef4444",
                      }}
                    >
                      {overdueCount} URGENT
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(app)/contacts" as AppRoute)}
              >
                <Text
                  style={{ fontSize: 13, color: theme.textMuted }}
                >
                  Voir tout ›
                </Text>
              </TouchableOpacity>
            </View>

            {todayContacts.map((contact) => {
              const statusColor =
                STATUS_COLORS[contact.status as StatusKey]?.text ?? "#10b981";
              const isOverdue =
                !!contact.next_follow_up &&
                new Date(contact.next_follow_up) < new Date();
              const progressValue =
                STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0;

              return (
                <TouchableOpacity
                  key={contact.id}
                  onPress={() =>
                    router.push(
                      `/(app)/contacts/${contact.id}` as AppRoute
                    )
                  }
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    borderLeftWidth: 3,
                    borderLeftColor: statusColor,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Avatar
                      name={contact.full_name}
                      status={contact.status}
                      size="md"
                      url={contact.avatar_url}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          color: theme.textPrimary,
                          marginBottom: 2,
                        }}
                      >
                        {contact.full_name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: isOverdue ? "#ef4444" : theme.textMuted,
                        }}
                      >
                        {isOverdue
                          ? `En retard · ${new Date(
                              contact.next_follow_up as string
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}`
                          : "Aujourd'hui"}
                      </Text>
                      {/* Multi-segment progress bar */}
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 3,
                          marginTop: 8,
                        }}
                      >
                        {[0, 1, 2, 3, 4].map((i) => (
                          <View
                            key={i}
                            style={{
                              flex: 1,
                              height: 3,
                              borderRadius: 2,
                              backgroundColor:
                                i <= progressValue
                                  ? statusColor
                                  : "#e2e8f0",
                            }}
                          />
                        ))}
                      </View>
                    </View>
                    {contact.phone && (
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(`tel:${contact.phone}`)
                        }
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: "#f0fdf4",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather
                          name="phone"
                          size={15}
                          color="#10b981"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Performance */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: theme.textPrimary,
              marginBottom: 14,
            }}
          >
            Performance
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              {
                label: "CONTACTS AJOUTÉS",
                value: weeklyNewContacts,
                icon: "users" as FeatherIconName,
                color: "#10b981",
                sub: "↑ Cette semaine",
              },
              {
                label: "NOUVEAUX CLIENTS",
                value: monthlyNewClients,
                icon: "star" as FeatherIconName,
                color: "#818cf8",
                sub: "↑ Ce mois",
              },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: `${stat.color}15`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Feather
                    name={stat.icon}
                    size={18}
                    color={stat.color}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: theme.textPrimary,
                    lineHeight: 30,
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.textHint,
                    fontWeight: "600",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  {stat.label}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: stat.color,
                    fontWeight: "600",
                  }}
                >
                  {stat.sub}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "700",
              color: theme.textPrimary,
              marginBottom: 14,
            }}
          >
            Activité récente
          </Text>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {recentActivity.length === 0 ? (
              <View style={{ padding: 14 }}>
                <Text
                  style={{ fontSize: 13, color: theme.textMuted }}
                >
                  Aucune activité récente
                </Text>
              </View>
            ) : (
              recentActivity.slice(0, 4).map((item, i) => (
                <View key={item.id}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `/(app)/contacts/${item.contact_id}` as AppRoute
                      )
                    }
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: 12,
                      padding: 14,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: "#f0fdf4",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Feather
                        name={
                          INTERACTION_ICONS[
                            item.type as InteractionType
                          ] as FeatherIconName
                        }
                        size={15}
                        color="#10b981"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          color: theme.textPrimary,
                          lineHeight: 20,
                        }}
                      >
                        {item.content ??
                          INTERACTION_LABELS[
                            item.type as InteractionType
                          ]}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          marginTop: 3,
                        }}
                      >
                        {formatRelativeTime(item.created_at)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {i <
                    Math.min(recentActivity.length, 4) - 1 && (
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "#f1f5f9",
                        marginLeft: 62,
                      }}
                    />
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Early Adopter / Pro banner */}
        {!isPro && totalContacts >= 20 && (
          <TouchableOpacity
            onPress={() =>
              router.push("/(app)/subscription" as AppRoute)
            }
            style={{
              marginHorizontal: 20,
              marginBottom: 24,
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 16 }}>
              {isEarlyAdopter ? "⚡" : "✨"}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: "500",
                color: isEarlyAdopter
                  ? "#10b981"
                  : theme.textPrimary,
              }}
            >
              {isEarlyAdopter
                ? `${pricing?.spots_left ?? 0} places Early Adopter restantes — ${currentPrice.toFixed(2).replace(".", ",")}€/mois`
                : `${totalContacts}/25 contacts · Passe à Pro`}
            </Text>
            <Feather
              name="chevron-right"
              size={14}
              color={isEarlyAdopter ? "#10b981" : theme.textHint}
            />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
