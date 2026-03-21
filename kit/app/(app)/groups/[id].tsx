import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Header } from "../../../components/layout";
import {
  Avatar,
  Card,
  StatusPill,
  Text as KitText,
  Button,
} from "../../../components/ui";
import { GroupBadge } from "../../../components/groups/GroupBadge";
import { useTheme } from "../../../lib/theme";
import { useToast } from "../../../lib/ToastContext";
import type { GroupType } from "../../../types";
import { useContacts } from "../../../hooks/useContacts";
import { useGroupMembers } from "../../../hooks/useGroupMembers";
import { useGroups } from "../../../hooks/useGroups";
import { useStartGroupConversation } from "../../../hooks/useStartGroupConversation";

function RenameGroupModal({
  visible,
  groupName,
  onClose,
  onSave,
}: {
  visible: boolean;
  groupName: string;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const theme = useTheme();
  const [name, setName] = useState(groupName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setName(groupName);
  }, [visible, groupName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await onSave(trimmed);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: "80%",
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />

          <KitText variant="h3" style={{ marginBottom: 12 }}>
            Renommer le groupe
          </KitText>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nom du groupe..."
              placeholderTextColor={theme.textHint}
              style={{
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: theme.textPrimary,
              }}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  alignItems: "center",
                }}
              >
                <KitText style={{ color: theme.textMuted, fontSize: 13 }}>Annuler</KitText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={loading || !name.trim()}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: name.trim() ? theme.primaryBorder : theme.border,
                  backgroundColor: name.trim() ? theme.primaryBg : theme.bg,
                  alignItems: "center",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <KitText style={{ color: name.trim() ? theme.primary : theme.textMuted, fontSize: 13, fontWeight: "700" }}>
                  {loading ? "..." : "Enregistrer"}
                </KitText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function GroupMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { showToast } = useToast();

  const groupId = id ?? "";

  const {
    groups,
    updateGroup,
    deleteGroup,
    loading: groupsLoading,
    refetch: refetchGroups,
  } = useGroups("contact" satisfies GroupType);

  const group = useMemo(() => groups.find((g) => g.id === groupId) ?? null, [groups, groupId]);

  const {
    members,
    memberIds,
    loading: membersLoading,
    addContactToGroup,
    removeContactFromGroup,
  } = useGroupMembers(groupId);

  const { contacts, loading: contactsLoading, refetch: refetchContacts } = useContacts();

  const [search, setSearch] = useState("");
  const [renameVisible, setRenameVisible] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  const { startGroupChatFromContactGroup } = useStartGroupConversation();

  useEffect(() => {
    refetchGroups();
    refetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredAddContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = (contacts ?? []).filter((c) => !memberIds.has(c.id));
    if (!q) return base;
    return base.filter((c) => {
      const inName = (c.full_name ?? "").toLowerCase().includes(q);
      const inPhone = (c.phone ?? "").toLowerCase().includes(q);
      const inEmail = (c.email ?? "").toLowerCase().includes(q);
      return inName || inPhone || inEmail;
    });
  }, [contacts, memberIds, search]);

  const openGroupInbox = async () => {
    if (!group) return;
    setOpeningChat(true);
    try {
      const res = await startGroupChatFromContactGroup(group.id);
      if (res.error) {
        Alert.alert("Messagerie de groupe", res.error);
        return;
      }
      if (res.conversationId) {
        if (res.skipped && res.skipped.length > 0) {
          showToast(
            `${res.skipped.length} contact(s) sans compte KIT ou sans email`
          );
        }
        router.push(`/(app)/messages/${res.conversationId}`);
      }
    } finally {
      setOpeningChat(false);
    }
  };

  const handleDelete = () => {
    if (!group) return;
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
            if (ok) router.replace("/(app)/groups");
            else showToast("Suppression impossible");
          },
        },
      ],
      { cancelable: true }
    );
  };

  const loading = groupsLoading || membersLoading || contactsLoading;

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
        title={group?.name ?? "Groupe"}
        showBack
        onBack={() => router.back()}
      />

      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
        {group ? (
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <GroupBadge group={group} size="md" />
                {typeof group.member_count === "number" ? (
                  <KitText variant="muted" className="mt-1">
                    {group.member_count} membre{group.member_count > 1 ? "s" : ""}
                  </KitText>
                ) : null}
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setRenameVisible(true)}
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: `${theme.primaryBg}66`,
                    borderWidth: 1,
                    borderColor: theme.primaryBorder,
                  }}
                  accessibilityLabel="Renommer le groupe"
                >
                  <Feather name="edit-2" size={16} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={{
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: theme.bg,
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
        ) : null}

        {group ? (
          <Card style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={openGroupInbox}
              disabled={openingChat}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                opacity: openingChat ? 0.7 : 1,
              }}
              accessibilityLabel="Ouvrir la messagerie du groupe"
            >
              {openingChat ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: theme.primaryBg,
                    borderWidth: 1,
                    borderColor: theme.primaryBorder,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="message-circle" size={20} color={theme.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <KitText
                  style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: theme.textPrimary,
                  }}
                >
                  Messagerie du groupe
                </KitText>
                <KitText variant="muted" className="text-xs mt-1 leading-relaxed">
                  Conversation avec tous les membres qui ont un compte KIT (email du
                  contact).
                </KitText>
              </View>
              {!openingChat && (
                <Feather name="chevron-right" size={20} color={theme.textMuted} />
              )}
            </TouchableOpacity>
          </Card>
        ) : null}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Members */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <KitText variant="muted" className="text-xs uppercase tracking-wider">
                Membres
              </KitText>
              <KitText variant="muted" className="text-xs">
                {members.length} membre{members.length > 1 ? "s" : ""}
              </KitText>
            </View>

            {members.length === 0 ? (
              <Card>
                <KitText variant="muted">Aucun membre pour ce groupe</KitText>
              </Card>
            ) : (
              <View style={{ gap: 10 }}>
                {members.map((item) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 11,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Avatar name={item.full_name} status={item.status} size="sm" />
                    <View style={{ flex: 1 }}>
                      <KitText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.textPrimary,
                        }}
                      >
                        {item.full_name}
                      </KitText>
                      {item.phone ? (
                        <KitText
                          variant="muted"
                          className="mt-1"
                          style={{ fontSize: 12 }}
                        >
                          {item.phone}
                        </KitText>
                      ) : null}
                    </View>
                    <StatusPill status={item.status} size="sm" />

                    <TouchableOpacity
                      onPress={async () => {
                        const ok = await removeContactFromGroup(item.id);
                        if (ok) showToast("Retiré du groupe");
                        else showToast("Impossible de retirer");
                      }}
                      style={{
                        padding: 8,
                        borderRadius: 12,
                        backgroundColor: theme.bg,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                      accessibilityLabel="Retirer du groupe"
                    >
                      <Feather name="x" size={16} color={theme.textHint} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Add */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <KitText variant="muted" className="text-xs uppercase tracking-wider">
                Ajouter un membre
              </KitText>
            </View>

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
                marginBottom: 10,
              }}
            >
              <Feather name="search" size={15} color={theme.textHint} />
              <TextInput
                style={{ flex: 1, paddingVertical: 11, fontSize: 14, color: theme.textPrimary }}
                placeholder="Rechercher..."
                placeholderTextColor={theme.textHint}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
              {search.length > 0 ? (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x" size={15} color={theme.textHint} />
                </TouchableOpacity>
              ) : null}
            </View>

            {filteredAddContacts.length === 0 ? (
              <Card>
                <KitText variant="muted">
                  {search.trim() ? "Aucun contact correspondant" : "Ajoute un contact depuis la recherche"}
                </KitText>
              </Card>
            ) : (
              <FlatList
                data={filteredAddContacts.slice(0, 30)}
                keyExtractor={(c) => c.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ gap: 10, paddingBottom: 36 }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 11,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                  >
                    <Avatar name={item.full_name} status={item.status} size="sm" />
                    <View style={{ flex: 1 }}>
                      <KitText style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>
                        {item.full_name}
                      </KitText>
                      {item.phone ? (
                        <KitText variant="muted" className="mt-1" style={{ fontSize: 12 }}>
                          {item.phone}
                        </KitText>
                      ) : null}
                    </View>
                    <StatusPill status={item.status} size="sm" />

                    <TouchableOpacity
                      onPress={async () => {
                        const ok = await addContactToGroup(item.id);
                        if (ok) showToast("Ajouté au groupe");
                        else showToast("Impossible d'ajouter");
                      }}
                      style={{
                        padding: 8,
                        borderRadius: 12,
                        backgroundColor: `${theme.primaryBg}`,
                        borderWidth: 1,
                        borderColor: theme.primaryBorder,
                      }}
                      accessibilityLabel="Ajouter au groupe"
                    >
                      <Feather name="plus" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      )}

      <RenameGroupModal
        visible={renameVisible}
        groupName={group?.name ?? ""}
        onClose={() => setRenameVisible(false)}
        onSave={async (name) => {
          if (!group) return;
          const ok = await updateGroup(group.id, { name });
          if (ok) showToast("Groupe renommé");
          else showToast("Impossible de renommer");
        }}
      />
    </SafeAreaView>
  );
}

