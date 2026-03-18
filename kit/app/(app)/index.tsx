import { View, ScrollView, TouchableOpacity, Text } from "react-native";
import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme, STATUS_COLORS, StatusKey } from "../../lib/theme";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";
import { Card, StatusPill, Avatar } from "../../components/ui";
import { PipelineBar } from "../../components/dashboard";
import type { Contact } from "../../types";

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const {
    totalContacts,
    toFollowUp,
    byStatus,
    recentContacts,
    overdueFollowUps,
    loading,
    refetch,
  } = useDashboard();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  // Rafraîchir les stats dashboard à chaque retour sur l'écran
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

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
            paddingTop: 20,
            paddingBottom: 8,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 13,
                  color: theme.textMuted,
                  marginBottom: 3,
                }}
              >
                Bonjour {firstName} 👋
              </Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: theme.textPrimary,
                  letterSpacing: -1,
                  lineHeight: 32,
                }}
              >
                Dashboard
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(app)/contacts/new")}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: theme.primaryBg,
                borderWidth: 1,
                borderColor: theme.primaryBorder,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
              }}
              accessibilityLabel="Ajouter un contact"
            >
              <Feather name="plus" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Alerte relances en retard */}
          {overdueFollowUps.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/(app)/contacts")}
              style={{
                backgroundColor: theme.primaryBg,
                borderWidth: 1,
                borderColor: theme.primaryBorder,
                borderRadius: 14,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <Feather name="alert-circle" size={16} color={theme.primary} />
              <Text
                style={{
                  flex: 1,
                  color: theme.primary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {overdueFollowUps.length} relance
                {overdueFollowUps.length > 1 ? "s" : ""} en retard
              </Text>
              <Feather name="chevron-right" size={14} color={theme.primary} />
            </TouchableOpacity>
          )}

          {/* Stats — gros chiffres */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 14,
            }}
          >
            {[
              { label: "Contacts", value: totalContacts, accent: false },
              {
                label: "À relancer",
                value: toFollowUp.length,
                accent: toFollowUp.length > 0,
              },
              {
                label: "Clients",
                value: byStatus.client ?? 0,
                accent: true,
              },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: stat.accent
                    ? theme.borderAccent
                    : theme.border,
                  borderRadius: 14,
                  padding: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.textMuted,
                    marginBottom: 4,
                  }}
                >
                  {stat.label}
                </Text>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "800",
                    color: stat.accent ? theme.primary : theme.textPrimary,
                    lineHeight: 28,
                  }}
                >
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Pipeline */}
          {totalContacts > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 11,
                  letterSpacing: 0.8,
                  color: theme.textHint,
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontWeight: "600",
                }}
              >
                Pipeline
              </Text>
              <PipelineBar byStatus={byStatus} total={totalContacts} />
            </Card>
          )}

          {/* À relancer */}
          {toFollowUp.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: theme.textPrimary,
                  marginBottom: 10,
                  letterSpacing: -0.3,
                }}
              >
                À relancer
              </Text>
              <Card>
                {toFollowUp.slice(0, 5).map((contact, i) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    showDivider={i < toFollowUp.length - 1 && i < 4}
                    theme={theme}
                  />
                ))}
              </Card>
            </View>
          )}

          {/* Récents */}
          {recentContacts.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: theme.textPrimary,
                  marginBottom: 10,
                  letterSpacing: -0.3,
                }}
              >
                Récents
              </Text>
              <Card>
                {recentContacts.map((contact, i) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    showDivider={i < recentContacts.length - 1}
                    theme={theme}
                  />
                ))}
              </Card>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({
  contact,
  showDivider,
  theme,
}: {
  contact: Contact;
  showDivider: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  const statusColors =
    STATUS_COLORS[contact.status as StatusKey] ?? STATUS_COLORS.inactive;

  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 10,
          paddingHorizontal: 4,
          backgroundColor:
            contact.status === "client"
              ? statusColors.bg
              : "transparent",
        }}
        activeOpacity={0.7}
      >
        <Avatar
          name={contact.full_name}
          status={contact.status}
          size="md"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.textPrimary,
            }}
          >
            {contact.full_name}
          </Text>
        </View>
        <StatusPill status={contact.status} size="sm" />
        <Feather name="chevron-right" size={14} color={theme.textHint} />
      </TouchableOpacity>
      {showDivider && (
        <View
          style={{
            height: 1,
            backgroundColor: theme.border,
            marginHorizontal: 4,
          }}
        />
      )}
    </>
  );
}
