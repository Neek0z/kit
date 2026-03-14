import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, Card, EmptyState } from "../../components/ui";
import { ContactCard } from "../../components/contacts";
import { PipelineBar } from "../../components/dashboard";
import { useDashboard } from "../../hooks/useDashboard";
import { useActivityStats } from "../../hooks/useActivityStats";
import { useSubscription } from "../../hooks/useSubscription";
import { useAuthContext } from "../../lib/AuthContext";

export default function DashboardScreen() {
  const { user } = useAuthContext();
  const { isPro } = useSubscription();
  const {
    totalContacts,
    toFollowUp,
    byStatus,
    recentContacts,
    overdueFollowUps,
    loading,
    refetch,
  } = useDashboard();
  const {
    countLast7Days,
    countLast30Days,
    contactsContactedThisMonth,
    loading: statsLoading,
  } = useActivityStats();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  const showFullScreenLoading = loading && totalContacts === 0;

  if (showFullScreenLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator color="#6ee7b7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            colors={["#6ee7b7"]}
            tintColor="#6ee7b7"
          />
        }
      >
        <View className="pt-6 pb-5 flex-row items-start justify-between">
          <View>
            <Text variant="muted">Bonjour {firstName} 👋</Text>
            <Text variant="h1" className="mt-1">
              Dashboard
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/contacts/new")}
            className="bg-primary w-10 h-10 rounded-full items-center justify-center mt-1"
            accessibilityLabel="Ajouter un contact"
          >
            <Feather name="plus" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {overdueFollowUps.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/(app)/contacts")}
            className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-4 flex-row items-center gap-3"
          >
            <Feather name="alert-circle" size={18} color="#f87171" />
            <Text className="text-danger text-sm font-semibold flex-1">
              {overdueFollowUps.length} relance
              {overdueFollowUps.length > 1 ? "s" : ""} en retard
            </Text>
            <Feather name="chevron-right" size={16} color="#f87171" />
          </TouchableOpacity>
        )}

        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1">
            <Text variant="muted" className="text-xs mb-1">
              Contacts
            </Text>
            <Text variant="h2" className="text-primary">
              {totalContacts}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text variant="muted" className="text-xs mb-1">
              À relancer
            </Text>
            <Text
              variant="h2"
              className={
                toFollowUp.length > 0 ? "text-yellow-400" : "text-textMain dark:text-textMain-dark"
              }
            >
              {toFollowUp.length}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text variant="muted" className="text-xs mb-1">
              Clients
            </Text>
            <Text variant="h2" className="text-primary">
              {byStatus.client ?? 0}
            </Text>
          </Card>
        </View>

        {!statsLoading && (countLast7Days > 0 || countLast30Days > 0 || contactsContactedThisMonth > 0) && (
          <Card className="mb-4">
            <Text variant="muted" className="text-xs mb-3 uppercase tracking-wider">
              Activité
            </Text>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text variant="h2" className="text-primary">{countLast7Days}</Text>
                <Text variant="muted" className="text-xs">Interactions (7 j)</Text>
              </View>
              <View className="flex-1">
                <Text variant="h2" className="text-primary">{countLast30Days}</Text>
                <Text variant="muted" className="text-xs">Interactions (30 j)</Text>
              </View>
              <View className="flex-1">
                <Text variant="h2" className="text-primary">{contactsContactedThisMonth}</Text>
                <Text variant="muted" className="text-xs">Contactés ce mois</Text>
              </View>
            </View>
          </Card>
        )}

        {!isPro && totalContacts >= 20 && (
          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-4 flex-row items-center gap-3"
          >
            <Feather name="zap" size={16} color="#818cf8" />
            <Text className="text-secondary text-sm flex-1">
              {totalContacts}/25 contacts utilisés · Passe à Pro
            </Text>
            <Feather name="chevron-right" size={14} color="#818cf8" />
          </TouchableOpacity>
        )}

        {totalContacts > 0 && (
          <Card className="mb-4">
            <Text
              variant="muted"
              className="text-xs mb-3 uppercase tracking-wider"
            >
              Pipeline
            </Text>
            <PipelineBar byStatus={byStatus} total={totalContacts} />
          </Card>
        )}

        {toFollowUp.length > 0 && (
          <View className="mb-4">
            <Text variant="h3" className="mb-3">
              À relancer
            </Text>
            <Card padding="sm">
              {toFollowUp.slice(0, 5).map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
              {toFollowUp.length > 5 && (
                <TouchableOpacity
                  onPress={() => router.push("/(app)/contacts")}
                  className="py-3 items-center"
                >
                  <Text className="text-primary text-sm">
                    Voir les {toFollowUp.length - 5} autres →
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        )}

        {recentContacts.length > 0 && (
          <View className="mb-8">
            <Text variant="h3" className="mb-3">
              Récents
            </Text>
            <Card padding="sm">
              {recentContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </Card>
          </View>
        )}

        {totalContacts === 0 && (
          <EmptyState
            icon="🤝"
            title="Commence par ajouter un contact"
            description="KIT t'aide à ne plus jamais oublier de relancer quelqu'un."
            actionLabel="Ajouter un contact"
            onAction={() => router.push("/(app)/contacts/new")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
