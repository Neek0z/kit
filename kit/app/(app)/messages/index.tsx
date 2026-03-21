import { useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, EmptyState } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { ConversationListItem } from "../../../components/messages";
import { useConversations, type ConversationWithDetails } from "../../../hooks/useConversations";
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
      if (c.kind === "group") {
        const name = c.groupPreview?.name?.toLowerCase() ?? "";
        return name.includes(q);
      }
      const name = c.otherParticipant?.full_name?.toLowerCase() ?? "";
      const email = c.otherParticipant?.email?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q);
    });
  }, [conversations, search]);

  const openNewConversationMenu = () => {
    const goDirect = () => router.push("/(app)/messages/new");
    const goGroup = () => router.push("/(app)/messages/group-pick");
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Annuler", "Conversation 1-1", "Groupe de contacts"],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) goDirect();
          if (i === 2) goGroup();
        }
      );
    } else {
      Alert.alert("Nouveau", "Type de conversation", [
        { text: "Annuler", style: "cancel" },
        { text: "Conversation 1-1", onPress: goDirect },
        { text: "Groupe de contacts", onPress: goGroup },
      ]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const renderConversation = useCallback(
    ({ item }: { item: ConversationWithDetails }) => (
      <ConversationListItem conversation={item} />
    ),
    []
  );

  const ListHeader = useCallback(
    () => (
      <View className="px-5 py-2">
        <Text variant="muted" className="text-sm">
          {filtered.length} conversation
          {filtered.length > 1 ? "s" : ""}
          {search ? " (recherche)" : ""}
        </Text>
      </View>
    ),
    [filtered.length, search]
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
      <Header
        title="Messages"
        rightAction={{
          icon: "plus",
          onPress: openNewConversationMenu,
          accessibilityLabel: "Nouvelle conversation ou groupe",
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
              <Feather name="x" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}
      {conversations.length === 0 ? (
        <EmptyState
          title="Aucune conversation"
          description="Écris en 1-1 avec l’email d’un utilisateur KIT, ou ouvre une messagerie de groupe depuis tes groupes de contacts."
          actionLabel="Nouvelle conversation"
          onAction={openNewConversationMenu}
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
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={ListHeader}
          windowSize={10}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}
