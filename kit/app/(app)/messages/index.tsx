import { useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, EmptyState } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { ConversationListItem } from "../../../components/messages";
import { useConversations } from "../../../hooks/useConversations";
import { useTheme } from "../../../lib/theme";

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations, loading, error, refetch } = useConversations();
  const [search, setSearch] = useState("");
  const theme = useTheme();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const name = c.otherParticipant?.full_name?.toLowerCase() ?? "";
      const email = c.otherParticipant?.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
    });
  }, [conversations, search]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const showFullScreenLoading = loading && conversations.length === 0;

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
      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />
      <Header
        title="Messages"
        rightAction={{
          icon: "plus",
          onPress: () => router.push("/(app)/messages/new"),
          accessibilityLabel: "Nouvelle conversation",
        }}
      />
      {error && (
        <View className="px-5 py-2">
          <Text variant="muted" className="text-center text-danger">
            {error}
          </Text>
        </View>
      )}
      {conversations.length > 0 && (
        <View className="mx-5 mt-2 mb-1 flex-row items-center bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 gap-2">
          <Feather name="search" size={16} color={theme.textMuted} />
          <TextInput
            className="flex-1 py-2.5 text-textMain dark:text-textMain-dark text-base"
            placeholder="Rechercher par nom ou email..."
            placeholderTextColor={theme.textHint}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      )}
      {conversations.length === 0 ? (
        <EmptyState
          title="Aucune conversation"
          description="Démarre une conversation avec un autre utilisateur KIT en entrant son email."
          actionLabel="Nouvelle conversation"
          onAction={() => router.push("/(app)/messages/new")}
        />
      ) : filtered.length === 0 ? (
        <View className="px-5 py-8">
          <Text variant="muted" className="text-center">
            Aucune conversation ne correspond à « {search} »
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationListItem conversation={item} />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <View className="px-5 py-2">
              <Text variant="muted" className="text-sm">
                {filtered.length} conversation
                {filtered.length > 1 ? "s" : ""}
                {search ? " (recherche)" : ""}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
