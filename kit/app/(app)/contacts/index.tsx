import { useState, useMemo, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text as KitText, EmptyState, Card, StatusPill, Avatar } from "../../../components/ui";
import { SwipeMode } from "../../../components/contacts";
import { useContacts } from "../../../hooks/useContacts";
import { useSubscription } from "../../../hooks/useSubscription";
import { PipelineStatus } from "../../../types";
import { useTheme } from "../../../lib/theme";

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
  const [swipeMode, setSwipeMode] = useState(false);
  const theme = useTheme();

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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.isDark
            ? "rgba(110,231,183,0.3)"
            : "rgba(5,150,105,0.25)",
        }}
      />

      {swipeMode ? (
        <SwipeMode
          onClose={() => {
            setSwipeMode(false);
            refetch();
          }}
          onChanged={refetch}
        />
      ) : (
        <>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: theme.textPrimary,
                letterSpacing: -1,
              }}
            >
              Contacts
            </Text>
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  const next = !swipeMode;
                  setSwipeMode(next);
                  if (!next) {
                    refetch();
                  }
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: swipeMode
                    ? theme.primaryBg
                    : theme.surface,
                  borderWidth: 1,
                  borderColor: swipeMode
                    ? theme.primaryBorder
                    : theme.border,
                }}
              >
          <Text
            style={{
              fontSize: 11,
              fontWeight: "600",
              color: swipeMode ? theme.primary : theme.textMuted,
            }}
          >
            {swipeMode ? "Mode swipe" : "Mode liste"}
          </Text>
              </TouchableOpacity>
              {!swipeMode && (
                <TouchableOpacity
                  onPress={() => {
                    if (!canAddContact) {
                      router.push("/(app)/subscription");
                      return;
                    }
                    router.push("/(app)/contacts/new");
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: theme.primaryBg,
                    borderWidth: 1,
                    borderColor: theme.primaryBorder,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  accessibilityLabel="Ajouter un contact"
                >
                  <Feather name="plus" size={16} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Barre de recherche */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.border,
              borderRadius: 14,
              paddingHorizontal: 14,
              marginHorizontal: 20,
              marginBottom: 10,
            }}
          >
            <Feather name="search" size={15} color={theme.textHint} />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 11,
                fontSize: 14,
                color: theme.textPrimary,
              }}
              placeholder="Rechercher..."
              placeholderTextColor={theme.textHint}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={15} color={theme.textHint} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtres pipeline */}
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

          {/* Tags */}
          {uniqueTags.length > 0 && (
        <View className="mb-2 px-5">
        <KitText variant="muted" className="text-xs mb-1.5">Tag</KitText>
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

          {/* Liste */}
          {loading ? (
            <View
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/contacts/${item.id}`)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 11,
                    paddingHorizontal: 20,
                    backgroundColor:
                      item.status === "client"
                        ? "rgba(110,231,183,0.03)"
                        : "transparent",
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  }}
                >
                  <Avatar
                    name={item.full_name}
                    status={item.status}
                    size="md"
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: theme.textPrimary,
                      }}
                    >
                      {item.full_name}
                    </Text>
                    {item.phone && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          marginTop: 1,
                        }}
                      >
                        {item.phone}
                      </Text>
                    )}
                  </View>
                  <StatusPill status={item.status} size="sm" />
                  <Feather
                    name="chevron-right"
                    size={14}
                    color={theme.textHint}
                  />
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={refetch}
                  colors={[theme.primary]}
                  tintColor={theme.primary}
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
        </>
      )}
    </SafeAreaView>
  );
}
