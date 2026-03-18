import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Button, Card } from "../../components/ui";
import { Header } from "../../components/layout";
import { useSubscription } from "../../hooks/useSubscription";
import { useTheme } from "../../lib/theme";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const PRO_FEATURES = [
  { icon: "users" as const, label: "Contacts illimités" },
  { icon: "activity" as const, label: "Historique illimité" },
  { icon: "bell" as const, label: "Rappels illimités" },
  { icon: "grid" as const, label: "Widget écran d'accueil" },
  { icon: "download" as const, label: "Export des données" },
  { icon: "zap" as const, label: "Priorité support" },
];

export default function SubscriptionScreen() {
  const { isPro, subscription, startCheckout, loading } = useSubscription();
  const theme = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />
      <Header title="Mon abonnement" showBack />

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        <Card className="mb-6 mt-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="muted" className="text-xs mb-1">
                Plan actuel
              </Text>
              <Text
                variant="h2"
                className={isPro ? "text-primary" : "text-textMain dark:text-textMain-dark"}
              >
                {isPro ? "Pro ✨" : "Free"}
              </Text>
            </View>
            {isPro && subscription?.current_period_end && (
              <View className="items-end">
                <Text variant="muted" className="text-xs">
                  Renouvellement
                </Text>
                <Text className="text-sm mt-0.5">
                  {new Date(
                    subscription.current_period_end
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {!isPro && (
          <>
            <View className="items-center py-6 mb-6">
              <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                <Feather name="zap" size={32} color={theme.primary} />
              </View>
              <Text variant="h2" className="text-center mb-2">
                Passe à Pro
              </Text>
              <Text variant="muted" className="text-center leading-relaxed">
                Débloques toutes les fonctionnalités et développe ton réseau sans
                limite.
              </Text>
            </View>

            <Card className="mb-6 items-center">
              <View className="flex-row items-end gap-1 mb-1">
                <Text className="text-4xl font-bold text-primary">9€</Text>
                <Text variant="muted" className="mb-1.5">
                  /mois
                </Text>
              </View>
              <Text variant="muted" className="text-xs">
                Sans engagement · Résilie quand tu veux
              </Text>
            </Card>

            <View className="gap-3 mb-8">
              {PRO_FEATURES.map((feature) => (
                <View
                  key={feature.label}
                  className="flex-row items-center gap-3"
                >
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                    <Feather
                      name={feature.icon as FeatherName}
                      size={15}
                      color="#6ee7b7"
                    />
                  </View>
                  <Text className="text-sm">{feature.label}</Text>
                </View>
              ))}
            </View>

            <Button
              label="Commencer Pro — 9€/mois"
              onPress={startCheckout}
            />

            <Text variant="muted" className="text-xs text-center mt-3 mb-8">
              Paiement sécurisé par Stripe. Tu seras redirigé vers une page web.
            </Text>
          </>
        )}

        {isPro && (
          <View className="items-center py-8 gap-3">
              <Feather name="check-circle" size={48} color={theme.primary} />
            <Text variant="h3" className="text-center">
              Tu es Pro !
            </Text>
            <Text variant="muted" className="text-center">
              Toutes les fonctionnalités sont débloquées.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
