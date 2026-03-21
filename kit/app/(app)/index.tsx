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
import {
  useTheme,
  STATUS_COLORS,
  StatusKey,
  screenTitleTextStyle,
} from "../../lib/theme";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { usePricing } from "../../hooks/usePricing";
import { useNotificationCenter } from "../../hooks/useNotificationCenter";
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
  const { totalCount, urgentCount, hasUnread } = useNotificationCenter();

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
          backgroundColor: theme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
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
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 13,
                color: theme.textMuted,
                marginBottom: 4,
              }}
            >
              {getGreeting()}, {firstName}
            </Text>
            <Text style={screenTitleTextStyle(theme)}>
              Tableau de bord
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              marginTop: 4,
            }}
          >
            {/* Bell */}
            <TouchableOpacity
              onPress={() =>
                router.push("/(app)/notifications" as AppRoute)
              }
              style={{
                position: "relative",
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: theme.surface,
                alignItems: "center",
                justifyContent: "center",
                ...(theme.isDark ? {} : {
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }),
                borderWidth: theme.isDark ? 1 : 0,
                borderColor: theme.isDark ? theme.border : "transparent",
              }}
            >
              <Feather
                name="bell"
                size={20}
                color={
                  urgentCount > 0 ? theme.danger : theme.textMuted
                }
              />
              {hasUnread && (
                <View
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -2,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor:
                      urgentCount > 0 ? theme.danger : theme.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                    borderWidth: 2,
                    borderColor: theme.bg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "800",
                      color: "#fff",
                    }}
                  >
                    {totalCount > 99 ? "99+" : totalCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Avatar */}
            <TouchableOpacity
              onPress={() =>
                router.push("/(app)/profile" as AppRoute)
              }
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#fff",
                }}
              >
                {firstName?.[0]?.toUpperCase()}
              </Text>
            </TouchableOpacity>
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
              bg: theme.primary,
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
                style={{ fontSize: 13, color: theme.primary, fontWeight: "600" }}
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
                  backgroundColor: theme.surface,
                  borderRadius: 14,
                  padding: 10,
                  alignItems: "flex-start",
                  ...(theme.isDark ? {} : {
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
                      backgroundColor: theme.dangerBg,
                      borderRadius: 100,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: theme.danger,
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
                STATUS_COLORS[contact.status as StatusKey]?.text ?? theme.primary;
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
                    backgroundColor: theme.surface,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    ...(theme.isDark ? {} : {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                    }),
                    borderWidth: theme.isDark ? 1 : 0,
                    borderColor: theme.isDark ? theme.border : "transparent",
                    borderLeftWidth: 3,
                    borderLeftColor: statusColor,
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
                          color: isOverdue ? theme.danger : theme.textMuted,
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
                                  : theme.border,
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
                          backgroundColor: theme.primaryBg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather
                          name="phone"
                          size={15}
                          color={theme.primary}
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
                color: theme.primary,
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
                  backgroundColor: theme.surface,
                  borderRadius: 16,
                  padding: 16,
                  ...(theme.isDark ? {} : {
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
              backgroundColor: theme.surface,
              borderRadius: 16,
              overflow: "hidden",
              ...(theme.isDark ? {} : {
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
                        backgroundColor: theme.primaryBg,
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
                        color={theme.primary}
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
                        backgroundColor: theme.border,
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
              backgroundColor: theme.surface,
              borderRadius: 16,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              ...(theme.isDark ? {} : {
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
            <Text style={{ fontSize: 16 }}>
              {isEarlyAdopter ? "⚡" : "✨"}
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                fontWeight: "500",
                color: isEarlyAdopter
                  ? theme.primary
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
              color={isEarlyAdopter ? theme.primary : theme.textHint}
            />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
