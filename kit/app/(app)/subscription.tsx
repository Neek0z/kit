import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Card } from "../../components/ui";
import { Header } from "../../components/layout";
import { useSubscription } from "../../hooks/useSubscription";
import { usePricing } from "../../hooks/usePricing";
import { useTheme } from "../../lib/theme";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const PRO_FEATURES = [
  { icon: "users", label: "Contacts illimités", desc: "Fini la limite des 25 contacts" },
  { icon: "activity", label: "Historique illimité", desc: "Toutes tes interactions conservées" },
  { icon: "bell", label: "Rappels illimités", desc: "Autant de relances que tu veux" },
  { icon: "grid", label: "Widget écran d'accueil", desc: "Tes relances du jour en un coup d'oeil" },
  { icon: "instagram", label: "Bibliothèque de prompts IA", desc: "Contenu Instagram prêt à l'emploi" },
  { icon: "download", label: "Export de tes données", desc: "CSV de tous tes contacts" },
];

export default function SubscriptionScreen() {
  const { isPro, subscription, startCheckout, loading } = useSubscription();
  const { pricing, isEarlyAdopter, currentPrice } = usePricing();
  const theme = useTheme();
  const spotsLeft = pricing?.spots_left ?? 0;
  const spotsPercent = pricing
    ? Math.round((pricing.early_adopter_count / pricing.early_adopter_limit) * 100)
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header title="Abonnement" showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>
          {isPro && (
            <Card accent>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 11, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 4 }}>
                    Plan actuel
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: theme.primary, letterSpacing: -0.5 }}>
                    Pro ✨
                  </Text>
                  {subscription?.is_early_adopter && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Feather name="star" size={11} color={theme.primary} />
                      <Text style={{ fontSize: 11, color: theme.primary, fontWeight: "600" }}>
                        Early Adopter — {subscription.early_adopter_price ?? currentPrice}€/mois à vie
                      </Text>
                    </View>
                  )}
                </View>
                {subscription?.current_period_end && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Renouvellement</Text>
                    <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: "500", marginTop: 2 }}>
                      {new Date(subscription.current_period_end).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {!isPro && (
            <>
              {isEarlyAdopter && (
                <View
                  style={{
                    backgroundColor: theme.primaryBg,
                    borderWidth: 1,
                    borderColor: theme.primaryBorder,
                    borderRadius: 14,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 10,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: theme.primary, marginBottom: 3 }}>
                      Offre Early Adopter
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 17 }}>
                      Bloque ton prix à {pricing?.early_adopter_price ?? currentPrice}€/mois pour toujours.
                    </Text>
                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>
                          {pricing?.early_adopter_count ?? 0}/{pricing?.early_adopter_limit ?? 100} places prises
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.primary, fontWeight: "600" }}>
                          {spotsLeft} restante{spotsLeft > 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={{ height: 5, backgroundColor: theme.border, borderRadius: 3 }}>
                        <View
                          style={{
                            height: 5,
                            backgroundColor: theme.primary,
                            borderRadius: 3,
                            width: `${Math.max(0, Math.min(100, spotsPercent))}%`,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <Card>
                <View style={{ alignItems: "center", paddingVertical: 8 }}>
                  {isEarlyAdopter && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 18, color: theme.textHint, textDecorationLine: "line-through" }}>
                        7,99€
                      </Text>
                    </View>
                  )}
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                    <Text style={{ fontSize: 48, fontWeight: "800", color: theme.primary, letterSpacing: -2, lineHeight: 52 }}>
                      {currentPrice.toFixed(2).replace(".", ",")}€
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.textMuted, marginBottom: 8 }}>/mois</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    {isEarlyAdopter ? "Prix garanti à vie · Sans engagement" : "Sans engagement · Résilie quand tu veux"}
                  </Text>
                </View>
              </Card>

              <Card>
                <Text style={{ fontSize: 11, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 12 }}>
                  Tout ce qui est inclus
                </Text>
                <View style={{ gap: 12 }}>
                  {PRO_FEATURES.map((feature, i) => (
                    <View key={feature.label}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.primaryBg, borderWidth: 1, borderColor: theme.primaryBorder, alignItems: "center", justifyContent: "center" }}>
                          <Feather name={feature.icon as FeatherName} size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>{feature.label}</Text>
                          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{feature.desc}</Text>
                        </View>
                        <Feather name="check" size={15} color={theme.primary} />
                      </View>
                      {i < PRO_FEATURES.length - 1 && (
                        <View style={{ height: 1, backgroundColor: theme.border, marginTop: 12 }} />
                      )}
                    </View>
                  ))}
                </View>
              </Card>

              <TouchableOpacity
                onPress={startCheckout}
                disabled={loading}
                style={{
                  backgroundColor: theme.primaryBg,
                  borderWidth: 1,
                  borderColor: theme.primaryBorder,
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: theme.primary, letterSpacing: -0.3 }}>
                      {isEarlyAdopter
                        ? `Bloquer mon prix à ${currentPrice.toFixed(2).replace(".", ",")}€/mois ->`
                        : `Passer à Pro — ${currentPrice.toFixed(2).replace(".", ",")}€/mois ->`}
                    </Text>
                    <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>
                      Paiement sécurisé par Stripe
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textPrimary }}>
                    Annuel — 59€/an
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    = 4,90€/mois · Économise 2 mois
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {isPro && (
            <View style={{ alignItems: "center", paddingVertical: 20, gap: 10 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.primaryBg, borderWidth: 1, borderColor: theme.primaryBorder, alignItems: "center", justifyContent: "center" }}>
                <Feather name="check" size={28} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.textPrimary }}>
                Tu es Pro !
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: "center" }}>
                Toutes les fonctionnalités sont débloquées.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
