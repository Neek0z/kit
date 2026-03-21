import { useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text, Button } from "../ui";
import {
  InteractionType,
  INTERACTION_LABELS,
  INTERACTION_ICONS,
} from "../../types";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const TYPES: InteractionType[] = [
  "call",
  "message",
  "email",
  "meeting",
  "note",
];

interface AddInteractionSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (type: InteractionType, content?: string) => Promise<void>;
}

export function AddInteractionSheet({
  visible,
  onClose,
  onAdd,
}: AddInteractionSheetProps) {
  const [selectedType, setSelectedType] = useState<InteractionType>("call");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await onAdd(selectedType, content.trim() || undefined);
    setContent("");
    setLoading(false);
    onClose();
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
        className="flex-1 justify-end"
      >
        <View
          className="bg-surface rounded-t-3xl p-6 gap-5"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 20,
          }}
        >
          <View className="w-10 h-1 rounded-full bg-border self-center -mt-1 mb-1" />

          <Text variant="h3">Ajouter une interaction</Text>

          <View className="flex-row gap-2 flex-wrap">
            {TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
                  selectedType === type
                    ? "bg-primary/10 border-primary"
                    : "bg-background border-border"
                }`}
              >
                <Feather
                  name={INTERACTION_ICONS[type] as FeatherName}
                  size={14}
                  color={selectedType === type ? "#10b981" : "#475569"}
                />
                <Text
                  className={`text-sm ${
                    selectedType === type
                      ? "text-primary font-semibold"
                      : "text-textMuted"
                  }`}
                >
                  {INTERACTION_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            className="bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 text-textMain dark:text-textMain-dark text-sm min-h-[80px]"
            placeholder="Note optionnelle..."
            placeholderTextColor="#475569"
            value={content}
            onChangeText={setContent}
            multiline
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 items-center border border-border rounded-xl"
            >
              <Text variant="muted">Annuler</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Button label="Enregistrer" onPress={handleAdd} loading={loading} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
