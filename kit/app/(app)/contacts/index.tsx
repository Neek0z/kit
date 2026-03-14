import { useState, useMemo, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, EmptyState } from "../../../components/ui";
import { ContactCard } from "../../../components/contacts";
import { useContacts } from "../../../hooks/useContacts";
import { useSubscription } from "../../../hooks/useSubscription";
import { PipelineStatus, PIPELINE_LABELS } from "../../../types";

const FILTERS: { label: string; value: PipelineStatus | "all" | "overdue" }[] = [
  { label: "Tous", value: "all" },
  { label: "En retard", value: "overdue" },
  { label: "À relancer", value: "follow_up" },
  { label: "Intéressés", value: "interested" },
  { label: "Clients", value: "client" },
  { label: "Nouveaux", value: "new" },
];

export default function ContactsListScreen() {
  const { contacts, loading, refetch } = useContacts();
  const { checkLimit } = useSubscription();
  const canAddContact = checkLimit("contacts", contacts.length);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    PipelineStatus | "all" | "overdue"
  >("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => (c.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return contacts.filter((c) => {
      const matchSearch =
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "overdue"
            ? !!c.next_follow_up && new Date(c.next_follow_up) < today
            : c.status === activeFilter;
      const matchTag =
        selectedTag === null ||
        (c.tags ?? []).includes(selectedTag);
      return matchSearch && matchFilter && matchTag;
    });
  }, [contacts, search, activeFilter, selectedTag]);

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text variant="h1">Contacts</Text>
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => router.push("/(app)/contacts/import")}
            className="bg-surface dark:bg-surface-dark w-9 h-9 rounded-full items-center justify-center border border-border dark:border-border-dark"
            accessibilityLabel="Importer des contacts"
          >
            <Feather name="download" size={18} color="#6ee7b7" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!canAddContact) {
                router.push("/(app)/subscription");
                return;
              }
              router.push("/(app)/contacts/new");
            }}
            className="bg-primary w-9 h-9 rounded-full items-center justify-center"
            accessibilityLabel="Ajouter un contact"
          >
            <Feather name="plus" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-5 mb-3">
        <View className="flex-row items-center bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 gap-2">
          <Feather name="search" size={16} color="#475569" />
          <TextInput
            className="flex-1 py-3 text-textMain dark:text-textMain-dark text-base"
            placeholder="Rechercher..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View className="mb-2">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.value)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === item.value
                  ? "bg-primary border-primary"
                  : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === item.value
                    ? "text-background"
                    : "text-textMuted dark:text-textMuted-dark"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      {uniqueTags.length > 0 && (
        <View className="mb-2 px-5">
          <Text variant="muted" className="text-xs mb-1.5">Tag</Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity
              onPress={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full border ${
                selectedTag === null
                  ? "bg-primary border-primary"
                  : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
              }`}
            >
              <Text
                className={`text-xs ${
                  selectedTag === null
                    ? "text-background font-medium"
                    : "text-textMuted dark:text-textMuted-dark"
                }`}
              >
                Tous
              </Text>
            </TouchableOpacity>
            {uniqueTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1.5 rounded-full border ${
                  selectedTag === tag
                    ? "bg-primary border-primary"
                    : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
                }`}
              >
                <Text
                  className={`text-xs ${
                    selectedTag === tag
                      ? "text-background font-medium"
                      : "text-textMuted dark:text-textMuted-dark"
                  }`}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6ee7b7" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ContactCard contact={item} />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={["#6ee7b7"]}
              tintColor="#6ee7b7"
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title={search ? "Aucun résultat" : "Aucun contact"}
              description={
                search
                  ? "Essaie un autre terme de recherche."
                  : "Ajoute ton premier contact pour commencer."
              }
              actionLabel={search ? undefined : "Ajouter un contact"}
              onAction={
                search
                  ? undefined
                  : () =>
                      canAddContact
                        ? router.push("/(app)/contacts/new")
                        : router.push("/(app)/subscription")
              }
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
