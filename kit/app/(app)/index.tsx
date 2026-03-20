import { useCallback } from "react";
import { View, ScrollView, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { usePricing } from "../../hooks/usePricing";
import { useStreak } from "../../hooks/useStreak";
import { useUpcomingAppointments } from "../../hooks/useUpcomingAppointments";
import { Card, Avatar } from "../../components/ui";
import { StatusPill } from "../../components/ui/StatusPill";
import { formatRelativeTime } from "../../lib/utils";
import {
  INTERACTION_ICONS,
  INTERACTION_LABELS,
  InteractionType,
  PipelineStatus,
} from "../../types";

const WEEK_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const MLM_QUOTES = [
  "Votre réseau est votre valeur nette.",
  "Contactez 5 personnes aujourd'hui.",
  "Chaque non vous rapproche d'un oui.",
  "La régularité bat le talent.",
  "Un client satisfait vaut 10 prospects.",
  "Votre succès dépend de votre suivi.",
  "Construisez des relations, pas des ventes.",
];

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { isPro, checkLimit } = useSubscription();
  const { isEarlyAdopter, currentPrice, pricing } = usePricing();
  const { currentStreak, weekDays, reload: reloadStreak } = useStreak();
  const { appointments } = useUpcomingAppointments(3);

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

  const canAddContact = checkLimit("contacts", totalContacts);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  useFocusEffect(
    useCallback(() => {
      refetch();
      reloadStreak();
    }, [refetch, reloadStreak])
  );

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const todayContacts = toFollowUp.slice(0, 5);

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
            paddingHorizontal: 16,
            paddingTop: 20,
            paddingBottom: 32,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              paddingBottom: 14,
            }}
          >
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 3 }}>
                Bonjour, {firstName} 👋
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textMuted,
                  marginTop: 5,
                  fontStyle: "italic",
                }}
              >
                "{MLM_QUOTES[new Date().getDay() % MLM_QUOTES.length]}"
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "800",
                  color: theme.textPrimary,
                  letterSpacing: -1,
                  lineHeight: 30,
                }}
              >
                Dashboard
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: theme.textHint,
                  marginTop: 4,
                  textTransform: "capitalize",
                }}
              >
                {today}
              </Text>
            </View>

            {/* Bouton + déplacé en FAB flottant en bas à droite */}
          </View>

          {/* Raccourcis rapides (Sleek) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ paddingHorizontal: 16, paddingBottom: 12 }}
          >
            <View style={{ flexDirection: "row", gap: 8 }}>
              {[
                {
                  label: "Nouveau contact",
                  icon: "user-plus",
                  color: theme.primary,
                  route: "/(app)/contacts/new",
                },
                {
                  label: "Relance",
                  icon: "bell",
                  color: "#f87171",
                  route: "/(app)/contacts",
                },
                {
                  label: "Message",
                  icon: "message-circle",
                  color: "#818cf8",
                  route: "/(app)/messages",
                },
              ].map((btn) => (
                <TouchableOpacity
                  key={btn.label}
                  onPress={() => router.push(btn.route as any)}
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
                    name={btn.icon as any}
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
          <Card style={{ marginBottom: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
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
                <Text style={{ fontSize: 11, color: theme.primary }}>
                  Voir tout →
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 6 }}>
              {(
                [
                  { key: "new", label: "Nouveau", color: "#94a3b8" },
                  {
                    key: "contacted",
                    label: "Contacté",
                    color: "#818cf8",
                  },
                  {
                    key: "interested",
                    label: "Intéressé",
                    color: "#fbbf24",
                  },
                  {
                    key: "follow_up",
                    label: "Relance",
                    color: "#f87171",
                  },
                  { key: "client", label: "Client", color: "#6ee7b7" },
                ] as Array<{ key: PipelineStatus; label: string; color: string }>
              ).map((s) => (
                <TouchableOpacity
                  key={s.key}
                  onPress={() => router.push("/(app)/contacts")}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 10,
                    backgroundColor: `${s.color}10`,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: `${s.color}25`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: s.color,
                      lineHeight: 20,
                    }}
                  >
                    {byStatus[s.key] ?? 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: 9,
                      color: theme.textHint,
                      marginTop: 3,
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {s.label}
                  </Text>
                  <View
                    style={{
                      width: "60%",
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: s.color,
                      marginTop: 5,
                      opacity: 0.6,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Section Performance (Sleek) */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginHorizontal: 0,
              marginBottom: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Card style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: theme.primaryBg,
                      borderWidth: 1,
                      borderColor: theme.primaryBorder,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="users" size={15} color={theme.primary} />
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: theme.textPrimary,
                    }}
                  >
                    {weeklyNewContacts}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>
                  CONTACTS AJOUTÉS
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.primary,
                    marginTop: 2,
                    fontWeight: "600",
                  }}
                >
                  ↑ Cette semaine
                </Text>
              </Card>
            </View>

            <View style={{ flex: 1 }}>
              <Card style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: "rgba(110,231,183,0.12)",
                      borderWidth: 1,
                      borderColor: "rgba(110,231,183,0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather
                      name="star"
                      size={15}
                      color="#6ee7b7"
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "800",
                      color: theme.textPrimary,
                    }}
                  >
                    {monthlyNewClients}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: theme.textMuted }}>
                  NOUVEAUX CLIENTS
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    color: "#6ee7b7",
                    marginTop: 2,
                    fontWeight: "600",
                  }}
                >
                  ↑ Ce mois
                </Text>
              </Card>
            </View>
          </View>

          {/* Streak + Stats */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {/* Streak */}
            <View
              style={{
                flex: 1.2,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: "rgba(251,191,36,0.25)",
                borderRadius: 16,
                padding: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: "#334155",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  fontWeight: "600",
                  marginBottom: 6,
                }}
              >
                Streak
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#fbbf24", lineHeight: 30 }}>
                  {currentStreak}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>jours</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 3 }}>
                {WEEK_LABELS.map((label, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 100,
                      backgroundColor: weekDays[i] ? "#fbbf24" : "rgba(251,191,36,0.1)",
                      borderWidth: weekDays[i] ? 0 : 1,
                      borderColor: "rgba(251,191,36,0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: "700",
                        color: weekDays[i] ? "#0f172a" : "#fbbf24",
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stats mini */}
            <View style={{ flex: 1, gap: 8 }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 14,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.textHint,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontWeight: "600",
                    marginBottom: 3,
                  }}
                >
                  Contacts
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: theme.primary,
                    lineHeight: 26,
                  }}
                >
                  {totalContacts}
                </Text>
              </View>
              <View
                style={{
                  flex: 1,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.borderAccent,
                  borderRadius: 14,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.textHint,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontWeight: "600",
                    marginBottom: 3,
                  }}
                >
                  Clients
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "800",
                    color: theme.primary,
                    lineHeight: 26,
                  }}
                >
                  {byStatus.client ?? 0}
                </Text>
              </View>
            </View>
          </View>

          {/* Aujourd'hui */}
          {todayContacts.length > 0 && (
            <View
              style={{
                backgroundColor: "rgba(248,113,113,0.04)",
                borderWidth: 1,
                borderColor: "rgba(248,113,113,0.2)",
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 10, color: "#f87171", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
                    Aujourd'hui
                  </Text>
                  <View style={{ backgroundColor: "rgba(248,113,113,0.15)", borderWidth: 1, borderColor: "rgba(248,113,113,0.3)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#f87171" }}>{todayContacts.length}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push("/(app)/contacts")}>
                  <Text style={{ fontSize: 11, color: "#f87171" }}>Voir tout →</Text>
                </TouchableOpacity>
              </View>

              {todayContacts.map((contact, i) => {
                const isLate = !!contact.next_follow_up && new Date(contact.next_follow_up) < new Date();
                const subText = isLate
                  ? `En retard · prévu le ${new Date(contact.next_follow_up as string).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                  : "Aujourd'hui";
                return (
                  <View key={contact.id}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}
                      activeOpacity={0.7}
                    >
                      <Avatar name={contact.full_name} status={contact.status} size="md" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textPrimary }}>
                          {contact.full_name}
                        </Text>
                        <Text style={{ fontSize: 11, color: isLate ? "#f87171" : theme.textMuted, marginTop: 1 }}>
                          {subText}
                        </Text>
                      </View>
                      <StatusPill status={contact.status} size="sm" />
                    </TouchableOpacity>
                    {i < todayContacts.length - 1 && <View style={{ height: 1, backgroundColor: "rgba(248,113,113,0.1)" }} />}
                  </View>
                );
              })}
            </View>
          )}

          {/* RDV à venir */}
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
                RDV à venir
              </Text>
              <TouchableOpacity onPress={() => router.push("/(app)/calendar")}>
                <Text style={{ fontSize: 11, color: theme.primary }}>+ RDV</Text>
              </TouchableOpacity>
            </View>

            {appointments.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/(app)/calendar")}
                style={{ paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, color: theme.textHint }}>Aucun RDV · tap pour en ajouter</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {appointments.map((apt, i) => {
                  const date = new Date(apt.start_date);
                  const isNext = i === 0;
                  return (
                    <TouchableOpacity
                      key={apt.id}
                      onPress={() => router.push("/(app)/calendar")}
                      style={{
                        flex: 1,
                        backgroundColor: isNext ? theme.primaryBg : theme.bg,
                        borderWidth: 1,
                        borderColor: isNext ? theme.primaryBorder : theme.border,
                        borderRadius: 12,
                        padding: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 10, color: isNext ? theme.primary : theme.textHint, fontWeight: "600", marginBottom: 3, textTransform: "uppercase" }}>
                        {date.toLocaleDateString("fr-FR", { month: "short" })}
                      </Text>
                      <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary, lineHeight: 24 }}>
                        {date.getDate()}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
                        {apt.contact_name ?? apt.title}
                      </Text>
                      <Text style={{ fontSize: 10, color: isNext ? theme.primary : theme.textHint, marginTop: 2 }}>
                        {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Raccourcis rapides */}
          <Card>
            <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 10 }}>
              Raccourcis
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {(
                [
                  { label: "Nouveau contact", icon: "user-plus", color: theme.primary, route: "/(app)/contacts/new" },
                  { label: "Interaction", icon: "message-circle", color: "#818cf8", route: "/(app)/contacts" },
                  { label: "Nouveau RDV", icon: "calendar", color: "#fbbf24", route: "/(app)/calendar" },
                  { label: "Message KIT", icon: "message-square", color: "#22c55e", route: "/(app)/messages" },
                ] as const
              ).map((shortcut) => (
                <TouchableOpacity
                  key={shortcut.label}
                  onPress={() => router.push(shortcut.route)}
                  style={{
                    width: "47%",
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: `${shortcut.color}20`,
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: `${shortcut.color}15`, alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Feather name={shortcut.icon as any} size={15} color={shortcut.color} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: shortcut.color, flex: 1 }} numberOfLines={2}>
                    {shortcut.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Activité récente */}
          <View style={{ marginHorizontal: 20, marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: theme.textPrimary,
                marginBottom: 10,
              }}
            >
              Activité récente
            </Text>

            <Card padding="sm">
              {recentActivity.length === 0 ? (
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Aucune activité récente
                </Text>
              ) : (
                recentActivity.slice(0, 4).map((item, i) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(app)/contacts/${item.contact_id}`)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingVertical: 9,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 50,
                          backgroundColor: theme.primaryBg,
                          borderWidth: 1,
                          borderColor: theme.primaryBorder,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather
                          name={
                            INTERACTION_ICONS[item.type as InteractionType] as any
                          }
                          size={13}
                          color={theme.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            color: theme.textPrimary,
                            fontWeight: "500",
                          }}
                          numberOfLines={2}
                        >
                          {item.content ?? INTERACTION_LABELS[item.type]}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: theme.textMuted,
                            marginTop: 1,
                          }}
                        >
                          {formatRelativeTime(item.created_at)}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {i < 3 && (
                      <View
                        style={{
                          height: 1,
                          backgroundColor: theme.border,
                          marginLeft: 72,
                        }}
                      />
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
      {/* FAB flottant pour ajouter un contact */}
      <TouchableOpacity
        onPress={() =>
          canAddContact
            ? router.push("/(app)/contacts/new")
            : router.push("/(app)/subscription")
        }
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
        accessibilityLabel="Ajouter un contact"
      >
        <Feather
          name="plus"
          size={24}
          color={theme.isDark ? "#0f172a" : "#ffffff"}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
