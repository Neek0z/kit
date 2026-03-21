import { useState, useMemo, useCallback } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Text,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { EmptyState, Avatar } from "../../../components/ui";
import { useContacts } from "../../../hooks/useContacts";
import { useSubscription } from "../../../hooks/useSubscription";
import { PipelineStatus, type Contact } from "../../../types";
import {
  useTheme,
  STATUS_COLORS,
  StatusKey,
  screenTitleTextStyle,
} from "../../../lib/theme";

const STATUS_PROGRESS: Record<PipelineStatus, number> = {
  new: 0,
  contacted: 1,
  interested: 2,
  follow_up: 3,
  client: 4,
  inactive: 0,
};

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
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return contacts.filter((c) => {
      const matchSearch =
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        (c.tags ?? []).some((t) =>
          t.toLowerCase().includes(search.toLowerCase())
        );
      const matchFilter =
        activeFilter === "all"
          ? true
          : activeFilter === "overdue"
            ? !!c.next_follow_up && new Date(c.next_follow_up) < today
            : c.status === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [contacts, search, activeFilter]);

  const renderContactItem = useCallback(
    ({ item }: { item: Contact }) => {
      const statusColor =
        STATUS_COLORS[item.status as StatusKey]?.text ?? "#10b981";
      const isOverdue =
        item.next_follow_up && new Date(item.next_follow_up) < new Date();
      const progressValue =
        STATUS_PROGRESS[item.status as PipelineStatus] ?? 0;

      return (
        <TouchableOpacity
          onPress={() => router.push(`/(app)/contacts/${item.id}`)}
          activeOpacity={0.7}
          style={{
            backgroundColor: theme.surface,
            borderRadius: 12,
            paddingVertical: 8,
            paddingHorizontal: 10,
            marginHorizontal: 20,
            marginBottom: 6,
            ...(theme.isDark ? {} : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 6,
              elevation: 1,
            }),
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.isDark ? theme.border : "transparent",
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Avatar
              name={item.full_name}
              status={item.status}
              url={item.avatar_url}
              size="sm"
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: theme.textPrimary,
                  marginBottom: 1,
                }}
                numberOfLines={1}
              >
                {item.full_name}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: isOverdue ? theme.danger : theme.textMuted,
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {isOverdue
                  ? `En retard · ${new Date(
                      item.next_follow_up!
                    ).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}`
                  : item.next_follow_up
                    ? `Dernier contact ${new Date(
                        item.next_follow_up
                      ).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}`
                    : item.phone ?? "Aucun numéro"}
              </Text>
              <View style={{ flexDirection: "row", gap: 2 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      height: 2,
                      borderRadius: 1,
                      backgroundColor:
                        i <= progressValue ? statusColor : theme.border,
                    }}
                  />
                ))}
              </View>
            </View>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              {item.phone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.primaryBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="phone" size={12} color={theme.primary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  router.push(`/(app)/contacts/${item.id}`)
                }
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                    backgroundColor: theme.bg,
                    alignItems: "center",
                    justifyContent: "center",
                }}
              >
                <Feather
                  name="chevron-right"
                  size={12}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [theme]
  );

  const ListEmpty = useCallback(
    () => (
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
    ),
    [search, canAddContact]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 8,
        }}
      >
        <Text style={screenTitleTextStyle(theme)}>Contacts</Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/groups")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.surface,
            alignItems: "center",
            justifyContent: "center",
            ...(theme.isDark ? {} : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            }),
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.isDark ? theme.border : "transparent",
          }}
          accessibilityLabel="Gérer les groupes"
        >
          <Feather name="filter" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            backgroundColor: theme.surface,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 12,
            ...(theme.isDark ? {} : {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            }),
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.isDark ? theme.border : "transparent",
          }}
        >
          <Feather name="search" size={16} color={theme.textMuted} />
          <TextInput
            placeholder="Rechercher par nom, tag ou statut..."
            placeholderTextColor={theme.textHint}
            style={{
              flex: 1,
              fontSize: 14,
              color: theme.textPrimary,
            }}
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
      </View>

      {/* Filter tabs */}
      <View style={{ marginBottom: 12 }}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.value)}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 100,
                backgroundColor:
                  activeFilter === item.value ? theme.primary : theme.surface,
                ...(theme.isDark ? {} : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 1,
                }),
                borderWidth: theme.isDark ? 1 : 0,
                borderColor: theme.isDark ? theme.border : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color:
                    activeFilter === item.value
                      ? "#fff"
                      : theme.textMuted,
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Contact list */}
      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderContactItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          ListEmptyComponent={ListEmpty}
          showsVerticalScrollIndicator={false}
          windowSize={10}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 80 }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() =>
          canAddContact
            ? router.push("/(app)/contacts/new")
            : router.push("/(app)/subscription")
        }
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            ...(theme.isDark ? {} : {
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 12,
              elevation: 8,
            }),
            borderWidth: theme.isDark ? 1 : 0,
            borderColor: theme.isDark ? theme.border : "transparent",
        }}
        accessibilityLabel="Ajouter un contact"
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
