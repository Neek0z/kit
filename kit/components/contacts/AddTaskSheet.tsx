import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import type { TaskPriority } from "../../types";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "../../types";

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, dueDate?: string, priority?: TaskPriority) => Promise<void>;
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

export function AddTaskSheet({ visible, onClose, onAdd }: AddTaskSheetProps) {
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
            gap: 16,
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
            }}
          />

          <RNText style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary }}>
            Nouvelle tâche
          </RNText>

          {/* Suggestions */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {suggestions.map((qt) => (
              <TouchableOpacity
                key={qt}
                onPress={() => handleAdd(qt)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: theme.bg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <RNText style={{ fontSize: 11, color: theme.textMuted }}>{qt}</RNText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Separator */}
          <View style={{ height: 1, backgroundColor: theme.border }} />

          {/* Custom input */}
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
              padding: 12,
              fontSize: 14,
              color: theme.textPrimary,
            }}
          />

          {/* Priority */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: priority === p ? `${PRIORITY_COLORS[p]}18` : theme.bg,
                  borderWidth: 1,
                  borderColor: priority === p ? `${PRIORITY_COLORS[p]}40` : theme.border,
                }}
              >
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: priority === p ? PRIORITY_COLORS[p] : theme.textMuted,
                  }}
                >
                  {PRIORITY_LABELS[p]}
                </RNText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Buttons */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <RNText style={{ color: theme.textMuted, fontSize: 14 }}>Annuler</RNText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAdd()}
              disabled={!title.trim() || loading}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: title.trim() ? theme.primaryBg : theme.bg,
                borderWidth: 1,
                borderColor: title.trim() ? theme.primaryBorder : theme.border,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RNText
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: title.trim() ? theme.primary : theme.textMuted,
                }}
              >
                Ajouter la tâche
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

