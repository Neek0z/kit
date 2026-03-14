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

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations, loading, error, refetch } = useConversations();
  const [search, setSearch] = useState("");

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
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator color="#6ee7b7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
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
          <Feather name="search" size={16} color="#64748b" />
          <TextInput
            className="flex-1 py-2.5 text-textMain dark:text-textMain-dark text-base"
            placeholder="Rechercher par nom ou email..."
            placeholderTextColor="#64748b"
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
              colors={["#6ee7b7"]}
              tintColor="#6ee7b7"
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
