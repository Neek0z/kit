import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { ContactRelance } from "../../types";
import { FollowUpPicker } from "./FollowUpPicker";

interface AddRelanceSheetProps {
  visible: boolean;
  onClose: () => void;
  editing?: ContactRelance | null;
  onSave: (date: Date, note: string) => Promise<boolean>;
}

export function AddRelanceSheet({
  visible,
  onClose,
  editing,
  onSave,
}: AddRelanceSheetProps) {
  const [pickedIso, setPickedIso] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setPickedIso(editing.scheduled_at);
      setNote(editing.note?.trim() ?? "");
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      setPickedIso(d.toISOString());
      setNote("");
    }
  }, [visible, editing]);

  const handleSave = async () => {
    if (!pickedIso) return;
    setLoading(true);
    try {
      const ok = await onSave(new Date(pickedIso), note);
      if (ok) onClose();
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

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 16,
            }}
          >
            <RNText
              style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}
            >
              {editing ? "Modifier la relance" : "Nouvelle relance"}
            </RNText>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <FollowUpPicker
              value={pickedIso}
              onChange={(d) => setPickedIso(d ? d.toISOString() : null)}
            />

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
                value={note}
                onChangeText={setNote}
                placeholder="Ex. Rappeler pour la démo, envoyer le PDF…"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                style={{
                  minHeight: 88,
                  textAlignVertical: "top",
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
          </View>

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
              onPress={handleSave}
              disabled={!pickedIso || loading}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: "#10b981",
                opacity: !pickedIso || loading ? 0.5 : 1,
              }}
            >
              <RNText
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                {loading
                  ? "..."
                  : editing
                    ? "Enregistrer"
                    : "Planifier"}
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
