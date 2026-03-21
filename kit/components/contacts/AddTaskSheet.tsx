import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import type { TaskPriority } from "../../types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../../types";
import { useTheme } from "../../lib/theme";

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    title: string,
    dueDate?: string,
    priority?: TaskPriority
  ) => Promise<void>;
}

const PRIORITIES: TaskPriority[] = ["normal", "high", "low"];

const QUICK_TASKS = [
  "Envoyer la présentation",
  "Rappeler dans la semaine",
  "Envoyer un message WhatsApp",
  "Préparer le RDV",
  "Envoyer les ressources",
  "Faire un suivi",
];

export function AddTaskSheet({
  visible,
  onClose,
  onAdd,
}: AddTaskSheetProps) {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [loading, setLoading] = useState(false);

  const suggestions = useMemo(() => QUICK_TASKS, []);

  const handleAdd = async (taskTitle?: string) => {
    const finalTitle = (taskTitle ?? title).trim();
    if (!finalTitle) return;

    setLoading(true);
    try {
      await onAdd(finalTitle, undefined, priority);
      setTitle("");
      setPriority("normal");
      onClose();
    } finally {
      setLoading(false);
    }
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
              }}
            >
              <RNText
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.textPrimary,
                }}
              >
                Nouvelle tâche
              </RNText>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              {/* Quick suggestions */}
              <View>
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
                  Suggestions
                </RNText>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {suggestions.map((qt) => (
                    <TouchableOpacity
                      key={qt}
                      onPress={() => handleAdd(qt)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: theme.bg,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <RNText
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: theme.textMuted,
                        }}
                      >
                        {qt}
                      </RNText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.border,
                }}
              />

              {/* Custom input */}
              <View>
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: theme.textMuted,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Tâche personnalisée
                </RNText>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Ou écris ta propre tâche..."
                  placeholderTextColor={theme.textHint}
                  style={{
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: theme.textPrimary,
                  }}
                />
              </View>

              {/* Priority */}
              <View>
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
                  Priorité
                </RNText>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {PRIORITIES.map((p) => {
                    const isActive = priority === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setPriority(p)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 100,
                          alignItems: "center",
                          backgroundColor: isActive
                            ? `${PRIORITY_COLORS[p]}15`
                            : theme.bg,
                          borderWidth: 1,
                          borderColor: isActive
                            ? PRIORITY_COLORS[p]
                            : theme.border,
                        }}
                      >
                        <RNText
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? "600" : "500",
                            color: isActive
                              ? PRIORITY_COLORS[p]
                              : theme.textMuted,
                          }}
                        >
                          {PRIORITY_LABELS[p]}
                        </RNText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Buttons */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              paddingHorizontal: 20,
              paddingTop: 16,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: theme.textMuted,
                }}
              >
                Annuler
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAdd()}
              disabled={!title.trim() || loading}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: theme.primary,
                opacity: !title.trim() || loading ? 0.5 : 1,
              }}
            >
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                {loading ? "..." : "Ajouter la tâche"}
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
