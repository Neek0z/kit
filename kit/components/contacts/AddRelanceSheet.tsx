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
import { useTheme } from "../../lib/theme";
import type { ContactRelance } from "../../types";
import { FollowUpPicker } from "./FollowUpPicker";
import { Button } from "../ui";

interface AddRelanceSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Si défini : mode édition */
  editing?: ContactRelance | null;
  onSave: (date: Date, note: string) => Promise<boolean>;
}

export function AddRelanceSheet({
  visible,
  onClose,
  editing,
  onSave,
}: AddRelanceSheetProps) {
  const theme = useTheme();
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            gap: 14,
            maxHeight: "88%",
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              alignSelf: "center",
            }}
          />
          <RNText
            style={{ fontSize: 17, fontWeight: "800", color: theme.textPrimary }}
          >
            {editing ? "Modifier la relance" : "Nouvelle relance"}
          </RNText>

          <FollowUpPicker
            value={pickedIso}
            onChange={(d) => setPickedIso(d ? d.toISOString() : null)}
          />

          <View>
            <RNText
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: theme.textMuted,
                marginBottom: 6,
              }}
            >
              Note (optionnel)
            </RNText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ex. Rappeler pour la démo, envoyer le PDF…"
              placeholderTextColor={theme.textHint}
              multiline
              numberOfLines={3}
              style={{
                minHeight: 88,
                textAlignVertical: "top",
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 14,
                padding: 12,
                fontSize: 14,
                color: theme.textPrimary,
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 14,
                alignItems: "center",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <RNText style={{ fontSize: 15, fontWeight: "600", color: theme.textMuted }}>
                Annuler
              </RNText>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Button
                label={editing ? "Enregistrer" : "Planifier"}
                onPress={handleSave}
                loading={loading}
                disabled={!pickedIso}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
