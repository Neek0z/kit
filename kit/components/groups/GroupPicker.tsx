import { useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from "react-native";
import { Button, Text as KitText } from "../ui";
import { GroupBadge } from "./GroupBadge";
import { useGroups } from "../../hooks/useGroups";
import { Group, MLM_GROUP_PRESETS } from "../../types";
import { useTheme } from "../../lib/theme";

const COLORS = [
  "#6ee7b7",
  "#fbbf24",
  "#818cf8",
  "#f87171",
  "#22c55e",
  "#38bdf8",
  "#e879f9",
  "#fb923c",
];
const EMOJIS = ["👥", "🔥", "⭐", "📚", "💼", "🎯", "💡", "🏆", "🤝", "📞"];

interface GroupPickerProps {
  visible: boolean;
  selectedGroups: Group[];
  onAdd: (groupId: string) => void;
  onRemove: (groupId: string) => void;
  onClose: () => void;
}

export function GroupPicker({
  visible,
  selectedGroups,
  onAdd,
  onRemove,
  onClose,
}: GroupPickerProps) {
  const theme = useTheme();
  const { groups, createGroup } = useGroups("contact");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newEmoji, setNewEmoji] = useState(EMOJIS[0]);

  const selectedIds = new Set(selectedGroups.map((g) => g.id));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createGroup({
      name: newName.trim(),
      color: newColor,
      emoji: newEmoji,
      type: "contact",
    });
    setNewName("");
    setCreating(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
          {/* Handle */}
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

          <KitText variant="h3" style={{ marginBottom: 16 }}>
            Groupes
          </KitText>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Groupes existants */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              {groups.map((group) => {
                const isSelected = selectedIds.has(group.id);
                return (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() =>
                      isSelected ? onRemove(group.id) : onAdd(group.id)
                    }
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: isSelected ? `${group.color}12` : theme.bg,
                      borderWidth: 1,
                      borderColor: isSelected
                        ? `${group.color}35`
                        : theme.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{group.emoji}</Text>
                      <View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.textPrimary,
                          }}
                        >
                          {group.name}
                        </Text>
                        {group.description && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.textMuted,
                            }}
                          >
                            {group.description}
                          </Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: group.color,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: theme.textPrimary,
                            fontSize: 13,
                            fontWeight: "800",
                          }}
                        >
                          ✓
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Créer un nouveau groupe */}
            {!creating ? (
              <TouchableOpacity
                onPress={() => setCreating(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderStyle: "dashed",
                }}
              >
                <Text style={{ fontSize: 20 }}>+</Text>
                <Text
                  style={{ fontSize: 14, color: theme.textMuted }}
                >
                  Créer un groupe
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={{
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: theme.bg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  gap: 12,
                }}
              >
                {/* Emoji picker */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setNewEmoji(e)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor:
                          newEmoji === e ? `${newColor}20` : "transparent",
                        borderWidth: newEmoji === e ? 1 : 0,
                        borderColor: newColor,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Nom */}
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nom du groupe..."
                  placeholderTextColor={theme.textHint}
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 10,
                    padding: 10,
                    fontSize: 14,
                    color: theme.textPrimary,
                  }}
                />

                {/* Couleur picker */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setNewColor(c)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: c,
                        borderWidth: newColor === c ? 2 : 0,
                        borderColor: "#fff",
                      }}
                    />
                  ))}
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setCreating(false)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: theme.border,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: theme.textMuted,
                        fontSize: 13,
                      }}
                    >
                      Annuler
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 10,
                      backgroundColor: `${newColor}20`,
                      borderWidth: 1,
                      borderColor: `${newColor}40`,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: newColor,
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      Créer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Suggestions MLM si aucun groupe */}
            {groups.length === 0 && !creating && (
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: theme.textMuted,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Suggestions MLM
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {MLM_GROUP_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      onPress={() =>
                        createGroup({ ...preset, type: "contact" })
                      }
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
                      <Text style={{ fontSize: 13 }}>{preset.emoji}</Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: preset.color,
                          fontWeight: "500",
                        }}
                      >
                        {preset.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.border,
              alignItems: "center",
            }}
          >
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

