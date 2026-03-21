import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { Header } from "../../../components/layout";
import {
  Card,
  Text as KitText,
} from "../../../components/ui";
import { Text as RNText } from "react-native";
import { GroupBadge } from "../../../components/groups/GroupBadge";
import { useGroups } from "../../../hooks/useGroups";
import { useTheme } from "../../../lib/theme";
import { useToast } from "../../../lib/ToastContext";
import { Group, GroupType, MLM_GROUP_PRESETS } from "../../../types";

const COLORS = [
  "#10b981",
  "#fbbf24",
  "#818cf8",
  "#f87171",
  "#22c55e",
  "#38bdf8",
  "#e879f9",
  "#fb923c",
];

const EMOJIS = ["👥", "🔥", "⭐", "📚", "💼", "🎯", "💡", "🏆", "🤝", "📞"];

type ModalMode = "create" | "edit";

type DraftGroup = {
  name: string;
  description: string;
  color: string;
  emoji: string;
};

export default function GroupsScreen() {
  const theme = useTheme();
  const { showToast } = useToast();

  const {
    groups,
    loading,
    refetch,
    createGroup,
    updateGroup,
    deleteGroup,
  } = useGroups("contact" satisfies GroupType);

  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [draft, setDraft] = useState<DraftGroup>({
    name: "",
    description: "",
    color: COLORS[0],
    emoji: EMOJIS[0],
  });

  useEffect(() => {
    // Refresh when returning to the screen
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setMode("create");
    setEditingGroup(null);
    setDraft({
      name: "",
      description: "",
      color: COLORS[0],
      emoji: EMOJIS[0],
    });
    setModalVisible(true);
  };

  const openEdit = (group: Group) => {
    setMode("edit");
    setEditingGroup(group);
    setDraft({
      name: group.name,
      description: group.description ?? "",
      color: group.color,
      emoji: group.emoji,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    if (!name) return;

    if (mode === "create") {
      const created = await createGroup({
        name,
        description: draft.description.trim() || undefined,
        color: draft.color,
        emoji: draft.emoji,
        type: "contact",
      });

      if (created) {
        showToast("Groupe créé");
        setModalVisible(false);
      } else {
        showToast("Impossible de créer le groupe");
      }
      return;
    }

    if (!editingGroup) return;

    const ok = await updateGroup(editingGroup.id, {
      name,
      description: draft.description.trim() || undefined,
      color: draft.color,
      emoji: draft.emoji,
      type: "contact",
    });

    if (ok) {
      showToast("Groupe mis à jour");
      setModalVisible(false);
    } else {
      showToast("Impossible de mettre à jour le groupe");
    }
  };

  const handleDelete = (group: Group) => {
    Alert.alert(
      "Supprimer le groupe",
      `Supprimer "${group.name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            const ok = await deleteGroup(group.id);
            if (ok) {
              showToast("Groupe supprimé");
            } else {
              showToast("Suppression impossible");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const showSuggestions = groups.length === 0;

  const suggestions = useMemo(() => MLM_GROUP_PRESETS, []);

  const renderGroupItem = useCallback(
    ({ item }: { item: Group }) => (
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <TouchableOpacity
            onPress={() => router.push(`/(app)/groups/${item.id}`)}
            activeOpacity={0.7}
            style={{ flex: 1 }}
            accessibilityLabel={`Ouvrir le groupe ${item.name}`}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}>
                <GroupBadge group={item} />
                {item.description ? (
                  <KitText variant="muted" className="mt-1">
                    {item.description}
                  </KitText>
                ) : null}
                {typeof item.member_count === "number" ? (
                  <KitText variant="muted" className="mt-1">
                    {item.member_count} membre{item.member_count > 1 ? "s" : ""}
                  </KitText>
                ) : null}
              </View>
              <View style={{ paddingTop: 8 }}>
                <Feather name="chevron-right" size={18} color={theme.textHint} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => openEdit(item)}
              style={{
                padding: 10,
                borderRadius: 14,
                backgroundColor: `${theme.primaryBg}66`,
                borderWidth: 1,
                borderColor: theme.primaryBorder,
              }}
              accessibilityLabel="Modifier le groupe"
            >
              <Feather name="edit-2" size={16} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={{
                padding: 10,
                borderRadius: 14,
                backgroundColor: `${theme.bg}`,
                borderWidth: 1,
                borderColor: theme.border,
              }}
              accessibilityLabel="Supprimer le groupe"
            >
              <Feather name="trash-2" size={16} color={theme.textHint} />
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    ),
    [theme, openEdit, handleDelete]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header
        title="Groupes"
        showBack
        onBack={() => router.back()}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 36, gap: 12 }}
          ListHeaderComponent={
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <KitText variant="muted" className="text-xs uppercase tracking-wider">
                  Gestion
                </KitText>
                <TouchableOpacity
                  onPress={openCreate}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 14,
                    backgroundColor: theme.primaryBg,
                    borderWidth: 1,
                    borderColor: theme.primaryBorder,
                  }}
                >
                  <Feather name="plus" size={14} color={theme.primary} />
                  <KitText style={{ color: theme.primary, fontWeight: "700", fontSize: 13 }}>
                    Créer
                  </KitText>
                </TouchableOpacity>
              </View>
              {groups.length === 0 ? (
                <Card>
                  <KitText variant="muted" className="text-xs uppercase tracking-wider">
                    Aucun groupe
                  </KitText>
                  <KitText className="mt-2" style={{ color: theme.textMuted, fontSize: 13 }}>
                    Crée tes premiers groupes (ex: équipe, prospects chauds, VIP...).
                  </KitText>
                </Card>
              ) : null}
              {showSuggestions ? (
                <Card>
                  <KitText variant="muted" className="text-xs uppercase tracking-wider">
                    Suggestions MLM
                  </KitText>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                    {suggestions.map((preset) => (
                      <TouchableOpacity
                        key={preset.name}
                        onPress={async () => {
                          const created = await createGroup({
                            name: preset.name,
                            description: preset.description,
                            color: preset.color,
                            emoji: preset.emoji,
                            type: "contact",
                          });
                          if (created) showToast("Groupe créé");
                          else showToast("Impossible de créer le groupe");
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 100,
                          backgroundColor: `${preset.color}15`,
                          borderWidth: 1,
                          borderColor: `${preset.color}30`,
                        }}
                      >
                        <KitText style={{ fontSize: 13 }}>{preset.emoji}</KitText>
                        <KitText style={{ fontSize: 12, color: preset.color, fontWeight: "500" }}>
                          {preset.name}
                        </KitText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>
              ) : null}
            </View>
          }
          renderItem={renderGroupItem}
          ListEmptyComponent={null}
          windowSize={10}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          removeClippedSubviews={true}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)" }}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          />
          <View
            style={{
              backgroundColor: "#fff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: Platform.OS === "ios" ? 34 : 24,
              maxHeight: "90%",
            }}
          >
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0", alignSelf: "center", marginTop: 12, marginBottom: 4 }} />

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
                <RNText style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
                  {mode === "create" ? "Créer un groupe" : "Modifier le groupe"}
                </RNText>
              </View>

              <View style={{ paddingHorizontal: 20, gap: 16 }}>
                <View>
                  <RNText style={{ fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Emoji
                  </RNText>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {EMOJIS.map((e) => (
                      <TouchableOpacity
                        key={e}
                        onPress={() => setDraft((d) => ({ ...d, emoji: e }))}
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: draft.emoji === e ? `${draft.color}20` : "transparent",
                          borderWidth: draft.emoji === e ? 1 : 0,
                          borderColor: draft.color,
                        }}
                      >
                        <RNText style={{ fontSize: 18 }}>{e}</RNText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <RNText style={{ fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Couleur
                  </RNText>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setDraft((d) => ({ ...d, color: c }))}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 16,
                          backgroundColor: c,
                          borderWidth: draft.color === c ? 2 : 0,
                          borderColor: "#fff",
                        }}
                      />
                    ))}
                  </View>
                </View>

                <View>
                  <RNText style={{ fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Nom
                  </RNText>
                  <TextInput
                    value={draft.name}
                    onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                    placeholder="Nom du groupe..."
                    placeholderTextColor="#94a3b8"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 15,
                      color: "#0f172a",
                    }}
                  />
                </View>

                <View>
                  <RNText style={{ fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Description
                  </RNText>
                  <TextInput
                    value={draft.description}
                    onChangeText={(v) => setDraft((d) => ({ ...d, description: v }))}
                    placeholder="Optionnel"
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={3}
                    style={{
                      backgroundColor: "#f8fafc",
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 15,
                      color: "#0f172a",
                      textAlignVertical: "top",
                    }}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingTop: 16 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" }}
              >
                <RNText style={{ fontSize: 15, fontWeight: "600", color: "#64748b" }}>Annuler</RNText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!draft.name.trim()}
                style={{ flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center", backgroundColor: "#10b981", opacity: !draft.name.trim() ? 0.5 : 1 }}
              >
                <RNText style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>
                  {mode === "create" ? "Créer" : "Enregistrer"}
                </RNText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

