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
import { useTheme } from "../../lib/theme";

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
  const theme = useTheme();
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
                Nouvelle interaction
              </RNText>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 16 }}>
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
                          backgroundColor: isActive ? theme.primaryBg : theme.bg,
                          borderWidth: 1,
                          borderColor: isActive ? theme.primaryBorder : theme.border,
                        }}
                      >
                        <Feather
                          name={INTERACTION_ICONS[type] as FeatherName}
                          size={14}
                          color={isActive ? theme.primary : theme.textMuted}
                        />
                        <RNText
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? "600" : "500",
                            color: isActive ? theme.primary : theme.textMuted,
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
                    color: theme.textMuted,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Note (optionnel)
                </RNText>
                <TextInput
                  style={{
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    padding: 14,
                    fontSize: 15,
                    color: theme.textPrimary,
                    minHeight: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Note optionnelle..."
                  placeholderTextColor={theme.textHint}
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
              onPress={handleAdd}
              disabled={loading}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: theme.primary,
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
