import { useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme, STATUS_COLORS, StatusKey } from "../../lib/theme";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { usePricing } from "../../hooks/usePricing";
import { Card, Avatar } from "../../components/ui";
import { formatRelativeTime } from "../../lib/utils";
import {
  INTERACTION_ICONS,
  INTERACTION_LABELS,
  InteractionType,
  PipelineStatus,
  type FeatherIconName,
  type AppRoute,
} from "../../types";

const FR_QUOTES = [
  "Votre réseau est votre valeur nette.",
  "Contactez 5 personnes aujourd'hui.",
  "La régularité bat le talent.",
  "Construisez des relations, pas des ventes.",
];

const STATUS_PROGRESS: Record<PipelineStatus, number> = {
  new: 0,
  contacted: 1,
  interested: 2,
  follow_up: 3,
  client: 4,
  inactive: 0,
};

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
  const overdueCount = toFollowUp.filter((c) => {
    if (!c.next_follow_up) return false;
    return new Date(c.next_follow_up) < todayStart;
  }).length;

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
        {/* Ligne décorative haut d'écran */}
        <View
          style={{
            height: 1,
            marginHorizontal: 32,
            backgroundColor: theme.primary,
            opacity: 0.25,
          }}
        />

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 40,
            gap: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              paddingBottom: 16,
            }}
          >
            <View>
              <Text style={{ fontSize: 16, color: theme.textMuted, marginBottom: 6 }}>
                Bonjour, {firstName}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textMuted,
                  marginTop: 5,
                  fontStyle: "italic",
                }}
              >
                "{FR_QUOTES[new Date().getDay() % FR_QUOTES.length]}"
              </Text>
            </View>

            {/* Bouton + déplacé en FAB flottant en bas à droite */}
          </View>

          {/* Raccourcis rapides (Sleek) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 0, paddingBottom: 0 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {([
                {
                  label: "Nouveau contact",
                  icon: "user-plus" as FeatherIconName,
                  color: theme.primary,
                  route: "/(app)/contacts/new" as AppRoute,
                },
                {
                  label: "Relance",
                  icon: "bell" as FeatherIconName,
                  color: "#f87171",
                  route: "/(app)/contacts" as AppRoute,
                },
                {
                  label: "Message",
                  icon: "message-circle" as FeatherIconName,
                  color: "#818cf8",
                  route: "/(app)/messages" as AppRoute,
                },
              ]).map((btn) => (
                <TouchableOpacity
                  key={btn.label}
                  onPress={() => router.push(btn.route)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: `${btn.color}12`,
                    borderWidth: 1,
                    borderColor: `${btn.color}25`,
                    borderRadius: 100,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Feather
                    name={btn.icon}
                    size={13}
                    color={btn.color}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: btn.color,
                    }}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Pipeline avec chiffres (Sleek) */}
          <View style={{ marginBottom: 0 }}>
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
                  fontSize: 11,
                  color: theme.textHint,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  fontWeight: "600",
                }}
              >
                Pipeline
              </Text>
              <TouchableOpacity onPress={() => router.push("/(app)/contacts")}>
                <Text style={{ fontSize: 12, color: theme.primary }}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 6 }}>
              {(
                [
                  { key: "new", label: "NOUVEAU", color: STATUS_COLORS.new.text },
                  {
                    key: "contacted",
                    label: "CONTACTÉ",
                    color: STATUS_COLORS.contacted.text,
                  },
                  {
                    key: "interested",
                    label: "INTÉRESSÉ",
                    color: STATUS_COLORS.interested.text,
                  },
                  {
                    key: "follow_up",
                    label: "RELANCE",
                    color: STATUS_COLORS.follow_up.text,
                  },
                  { key: "client", label: "CLIENT", color: STATUS_COLORS.client.text },
                ] as Array<{ key: PipelineStatus; label: string; color: string }>
              ).map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => router.push("/(app)/contacts")}
                  style={{
                    flex: 1,
                    backgroundColor: theme.bg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: theme.border,
                    padding: 10,
                    alignItems: "flex-start",
                    gap: 6,
                  }}
                >
                  {/* Point coloré en haut */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: s.color,
                    }}
                  />

                  {/* Chiffre grand */}
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: theme.textPrimary,
                      lineHeight: 24,
                    }}
                  >
                    {byStatus[s.key] ?? 0}
                  </Text>

                  {/* Label */}
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

                  {/* Barre couleur en bas */}
                  <View
                    style={{
                      height: 2,
                      width: "100%",
                      backgroundColor: s.color,
                      borderRadius: 1,
                      opacity: 0.5,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section Performance */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            {(
              [
                {
                  label: "CONTACTS AJOUTÉS",
                  value: weeklyNewContacts,
                  icon: "users",
                  color: theme.primary,
                  sub: "↑ Cette semaine",
                },
                {
                  label: "NOUVEAUX CLIENTS",
                  value: monthlyNewClients,
                  icon: "star",
                  color: "#6ee7b7",
                  sub: "↑ Ce mois",
                },
              ] as const
            ).map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 18,
                  padding: 16,
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
                  <Feather name={stat.icon} size={18} color={stat.color} />
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

                <Text style={{ fontSize: 11, color: stat.color, fontWeight: "600" }}>
                  {stat.sub}
                </Text>
              </View>
            ))}
          </View>

          {/* Today's Focus */}
          {todayContacts.length > 0 && (
            <View>
              {/* Header section */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: theme.textPrimary,
                    }}
                  >
                    Focus du jour
                  </Text>

                  {overdueCount > 0 && (
                    <View
                      style={{
                        backgroundColor: "rgba(248,113,113,0.12)",
                        borderWidth: 1,
                        borderColor: "rgba(248,113,113,0.3)",
                        borderRadius: 100,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: "700", color: "#f87171" }}>
                        {overdueCount} URGENT
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity onPress={() => router.push("/(app)/contacts")}>
                  <Text style={{ fontSize: 12, color: theme.textMuted }}>Voir tout →</Text>
                </TouchableOpacity>
              </View>

              {/* Liste contacts */}
              {todayContacts.map((contact) => {
                const overdue =
                  !!contact.next_follow_up && new Date(contact.next_follow_up) < todayStart;
                const statusKey = contact.status as StatusKey;
                const leftColor =
                  STATUS_COLORS[statusKey]?.text ?? theme.primary;
                const progressValue =
                  STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0;
                const progressPct = (progressValue / 4) * 100;

                return (
                  <TouchableOpacity
                    key={contact.id}
                    onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 12,
                      paddingLeft: 12,
                      paddingRight: 10,
                      backgroundColor: theme.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderLeftWidth: 3,
                      borderLeftColor: leftColor,
                      marginBottom: 8,
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
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.textPrimary,
                        }}
                        numberOfLines={1}
                      >
                        {contact.full_name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          marginTop: 2,
                          color: overdue ? "#f87171" : theme.textMuted,
                        }}
                        numberOfLines={1}
                      >
                        {overdue
                          ? `En retard · prévu le ${new Date(contact.next_follow_up as string).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}`
                          : "Aujourd'hui"}
                      </Text>

                      {/* Barre de progression pipeline */}
                      <View
                        style={{
                          height: 3,
                          backgroundColor: theme.border,
                          borderRadius: 2,
                          marginTop: 7,
                          overflow: "hidden",
                        }}
                      >
                        <View
                          style={{
                            height: 3,
                            width: `${progressPct}%`,
                            backgroundColor: leftColor,
                            borderRadius: 2,
                          }}
                        />
                      </View>
                    </View>

                    {overdue && (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: "rgba(248,113,113,0.1)",
                          borderWidth: 1,
                          borderColor: "rgba(248,113,113,0.3)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="alert-circle" size={14} color="#f87171" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Recent Activity */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: theme.textPrimary,
                marginBottom: 12,
              }}
            >
              Activité récente
            </Text>

            <Card>
              {recentActivity.length === 0 ? (
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Aucune activité récente
                </Text>
              ) : (
                recentActivity.slice(0, 4).map((item, i) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(app)/contacts/${item.contact_id}`)}
                      style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: theme.primaryBg,
                          borderWidth: 1,
                          borderColor: theme.primaryBorder,
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Feather
                          name={
                            INTERACTION_ICONS[item.type as InteractionType] as FeatherIconName
                          }
                          size={15}
                          color={theme.primary}
                        />
                      </View>
                      <View style={{ flex: 1, paddingTop: 2 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: theme.textPrimary,
                            fontWeight: "600",
                            lineHeight: 20,
                          }}
                        >
                          {item.content ?? INTERACTION_LABELS[item.type]}
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

                    {i < Math.min(recentActivity.length, 4) - 1 && (
                      <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 50 }} />
                    )}
                  </View>
                ))
              )}
            </Card>
          </View>

          {/* Bannière Early Adopter -> Pro (conservée) */}
          {!isPro && totalContacts >= 20 && (
            <TouchableOpacity
              onPress={() => router.push("/(app)/subscription")}
              style={{
                marginTop: 10,
                backgroundColor: isEarlyAdopter ? theme.primaryBg : theme.surface,
                borderWidth: 1,
                borderColor: isEarlyAdopter ? theme.primaryBorder : theme.border,
                borderRadius: 14,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 16 }}>{isEarlyAdopter ? "⚡" : "✨"}</Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: "500",
                  color: isEarlyAdopter ? theme.primary : theme.textPrimary,
                }}
              >
                {isEarlyAdopter
                  ? `${pricing?.spots_left ?? 0} places Early Adopter restantes — ${currentPrice.toFixed(2).replace(".", ",")}€/mois`
                  : `${totalContacts}/25 contacts · Passe à Pro`}
              </Text>
              <Feather name="chevron-right" size={14} color={isEarlyAdopter ? theme.primary : theme.textHint} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
