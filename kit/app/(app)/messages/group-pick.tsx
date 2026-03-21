import { useState, useCallback } from "react";
import {
  FlatList,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Header } from "../../../components/layout";
import { Text, EmptyState } from "../../../components/ui";
import { GroupBadge } from "../../../components/groups/GroupBadge";
import { useGroups } from "../../../hooks/useGroups";
import { useStartGroupConversation } from "../../../hooks/useStartGroupConversation";
import { useTheme } from "../../../lib/theme";
import type { Group } from "../../../types";

export default function MessageGroupPickScreen() {
  const theme = useTheme();
  const { groups, loading, refetch } = useGroups("contact");
  const { startGroupChatFromContactGroup } = useStartGroupConversation();
  const [startingId, setStartingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const openChat = async (group: Group) => {
    setStartingId(group.id);
    try {
      const res = await startGroupChatFromContactGroup(group.id);
      if (res.error) {
        Alert.alert("Messagerie de groupe", res.error);
        return;
      }
      if (res.conversationId) {
        if (res.skipped && res.skipped.length > 0) {
          const msg = res.skipped.slice(0, 6).join("\n");
          Alert.alert(
            "Conversation ouverte",
            `Non inclus (email manquant ou pas de compte KIT) :\n${msg}${
              res.skipped.length > 6 ? "\n…" : ""
            }`
          );
        }
        router.replace(`/(app)/messages/${res.conversationId}`);
      }
    } finally {
      setStartingId(null);
    }
  };

  const showHelp = () => {
    Alert.alert(
      "Messagerie de groupe",
      "Une seule conversation existe par groupe. Les membres avec un email renseigné et un compte KIT reçoivent les messages. Rouvrir cette page (ou le bouton sur la fiche groupe) met à jour les participants."
    );
  };

  const showFullScreenLoading = loading && groups.length === 0;

  if (showFullScreenLoading) {
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
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />
      <Header
        title="Message à un groupe"
        showBack
        rightAction={{
          icon: "help-circle",
          onPress: showHelp,
          accessibilityLabel: "Aide messagerie de groupe",
        }}
      />

      <View className="px-5 pt-2 pb-3 flex-row items-start gap-2">
        <Text variant="muted" className="text-sm flex-1 leading-relaxed">
          Choisis un groupe de contacts : une conversation avec tous les membres
          ayant un compte KIT (email du contact) sera créée ou rouverte.
        </Text>
      </View>

      {groups.length === 0 ? (
        <EmptyState
          title="Aucun groupe de contacts"
          description="Crée des groupes dans l’app pour envoyer un message à toute l’équipe en une fois."
          actionLabel="Mes groupes"
          onAction={() => router.push("/(app)/groups")}
        />
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item }) => {
            const busy = startingId === item.id;
            return (
              <TouchableOpacity
                onPress={() => openChat(item)}
                disabled={busy}
                className="mx-5 mb-3 p-4 rounded-2xl border border-border dark:border-border-dark bg-surface dark:bg-surface-dark active:opacity-90"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <GroupBadge group={item} />
                    {item.description ? (
                      <Text variant="muted" className="text-xs mt-2" numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                  {busy ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : (
                    <Feather name="chevron-right" size={20} color={theme.textMuted} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
