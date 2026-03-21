import { useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGroups } from "../../hooks/useGroups";
import { Group, MLM_GROUP_PRESETS } from "../../types";
import { useTheme } from "../../lib/theme";

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
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
          onPress={onClose}
          activeOpacity={1}
        />

        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Platform.OS === "ios" ? 34 : 24,
            maxHeight: "90%",
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 4,
            }}
          />

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 16,
            }}
          >
            <RNText
              style={{ fontSize: 18, fontWeight: "700", color: theme.textPrimary }}
            >
              Ajouter à un groupe
            </RNText>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
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
                      paddingVertical: 14,
                      paddingHorizontal: 4,
                      gap: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isSelected
                          ? theme.primaryBg
                          : theme.bg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <RNText style={{ fontSize: 18 }}>
                        {group.emoji}
                      </RNText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <RNText
                        style={{
                          fontSize: 15,
                          color: theme.textPrimary,
                          fontWeight: "500",
                        }}
                      >
                        {group.name}
                      </RNText>
                      {group.description && (
                        <RNText
                          style={{
                            fontSize: 12,
                            color: theme.textHint,
                            marginTop: 1,
                          }}
                        >
                          {group.description}
                        </RNText>
                      )}
                    </View>
                    {isSelected && (
                      <Feather name="check" size={18} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Create a new group */}
            {!creating ? (
              <TouchableOpacity
                onPress={() => setCreating(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 14,
                  paddingHorizontal: 4,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: theme.primaryBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="plus" size={16} color={theme.primary} />
                </View>
                <RNText
                  style={{
                    fontSize: 15,
                    color: theme.primary,
                    fontWeight: "500",
                  }}
                >
                  Créer un groupe
                </RNText>
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
                  marginBottom: 8,
                }}
              >
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
                      <RNText style={{ fontSize: 18 }}>{e}</RNText>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nom du groupe..."
                  placeholderTextColor={theme.textHint}
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: theme.textPrimary,
                  }}
                />

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

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setCreating(false)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: theme.border,
                      alignItems: "center",
                      backgroundColor: theme.bg,
                    }}
                  >
                    <RNText
                      style={{
                        color: theme.textMuted,
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      Annuler
                    </RNText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 14,
                      backgroundColor: theme.primary,
                      alignItems: "center",
                    }}
                  >
                    <RNText
                      style={{
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: "600",
                      }}
                    >
                      Créer
                    </RNText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {groups.length === 0 && !creating && (
              <View style={{ marginTop: 16 }}>
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.textMuted,
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Suggestions MLM
                </RNText>
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
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: theme.primaryBg,
                        borderWidth: 1,
                        borderColor: theme.primaryBorder,
                      }}
                    >
                      <RNText style={{ fontSize: 13 }}>
                        {preset.emoji}
                      </RNText>
                      <RNText
                        style={{
                          fontSize: 13,
                          color: theme.primary,
                          fontWeight: "600",
                        }}
                      >
                        {preset.name}
                      </RNText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: theme.primary,
              }}
            >
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                Confirmer
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
