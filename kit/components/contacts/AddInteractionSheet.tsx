import { useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text as RNText,
} from "react-native";
import { Feather } from "@expo/vector-icons";
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
            backgroundColor: "#fff",
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
              backgroundColor: "#e2e8f0",
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
                  color: "#0f172a",
                }}
              >
                Nouvelle interaction
              </RNText>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              <View>
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Type
                </RNText>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {TYPES.map((type) => {
                    const isActive = selectedType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setSelectedType(type)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 100,
                          backgroundColor: isActive ? "#f0fdf4" : "#f8fafc",
                          borderWidth: 1,
                          borderColor: isActive ? "#10b981" : "#e2e8f0",
                        }}
                      >
                        <Feather
                          name={INTERACTION_ICONS[type] as FeatherName}
                          size={14}
                          color={isActive ? "#10b981" : "#64748b"}
                        />
                        <RNText
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? "600" : "500",
                            color: isActive ? "#10b981" : "#64748b",
                          }}
                        >
                          {INTERACTION_LABELS[type]}
                        </RNText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View>
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#64748b",
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Note (optionnel)
                </RNText>
                <TextInput
                  style={{
                    backgroundColor: "#f8fafc",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: "#0f172a",
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Note optionnelle..."
                  placeholderTextColor="#94a3b8"
                  value={content}
                  onChangeText={setContent}
                  multiline
                />
              </View>
            </View>
          </ScrollView>

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
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e2e8f0",
              }}
            >
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#64748b",
                }}
              >
                Annuler
              </RNText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={loading}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: "#10b981",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                {loading ? "..." : "Enregistrer"}
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
