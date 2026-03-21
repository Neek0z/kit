import { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  Text as RNText,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "../ui";
import type { Appointment, Contact } from "../../types";

interface AppointmentSheetProps {
  visible: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  contacts: Contact[];
  preselectedContactId?: string | null;
  appointment?: Appointment | null;
  onSubmitCreate: (params: {
    contact_id: string;
    scheduled_at: string;
    title?: string;
    notes?: string;
  }) => Promise<unknown>;
  onSubmitEdit: (
    id: string,
    params: { scheduled_at: string; title?: string; notes?: string }
  ) => Promise<boolean>;
  onDelete?: (id: string) => Promise<void>;
}

export function AppointmentSheet({
  visible,
  onClose,
  mode,
  contacts,
  preselectedContactId,
  appointment,
  onSubmitCreate,
  onSubmitEdit,
  onDelete,
}: AppointmentSheetProps) {
  const [contactId, setContactId] = useState<string>(
    preselectedContactId ?? ""
  );
  const [scheduledAt, setScheduledAt] = useState<Date>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 60);
    d.setSeconds(0, 0);
    return d;
  });
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (mode === "edit" && appointment) {
      setContactId(appointment.contact_id);
      setScheduledAt(new Date(appointment.scheduled_at));
      setTitle(appointment.title ?? "");
      setNotes(appointment.notes ?? "");
    } else {
      setContactId(preselectedContactId ?? "");
      const d = new Date();
      d.setMinutes(d.getMinutes() + 60);
      d.setSeconds(0, 0);
      setScheduledAt(d);
      setTitle("");
      setNotes("");
    }
  }, [visible, mode, appointment, preselectedContactId]);

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setScheduledAt(date);
  };

  const handleSubmit = async () => {
    if (mode === "create") {
      if (!contactId.trim()) return;
      setLoading(true);
      await onSubmitCreate({
        contact_id: contactId,
        scheduled_at: scheduledAt.toISOString(),
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setLoading(false);
      onClose();
    } else if (appointment) {
      setLoading(true);
      await onSubmitEdit(appointment.id, {
        scheduled_at: scheduledAt.toISOString(),
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setLoading(false);
      onClose();
    }
  };

  const selectedContact = contacts.find((c) => c.id === contactId);
  const canSubmit = mode === "edit" ? true : contactId.length > 0;

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
                {mode === "create"
                  ? "Nouveau rendez-vous"
                  : "Modifier le rendez-vous"}
              </RNText>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              {/* Contact selector */}
              {mode === "create" && (
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
                    Contact
                  </RNText>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {contacts.map((c) => {
                      const selected = contactId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => setContactId(c.id)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 100,
                            maxWidth: 180,
                            backgroundColor: selected
                              ? "#f0fdf4"
                              : "#f8fafc",
                            borderWidth: 1,
                            borderColor: selected
                              ? "#10b981"
                              : "#e2e8f0",
                          }}
                        >
                          <Avatar
                            name={c.full_name}
                            url={c.avatar_url}
                            status={c.status}
                            size="sm"
                          />
                          <RNText
                            style={{
                              fontSize: 13,
                              fontWeight: selected ? "600" : "500",
                              color: selected ? "#10b981" : "#64748b",
                              flexShrink: 1,
                            }}
                            numberOfLines={1}
                          >
                            {c.full_name.split(" ")[0]}
                          </RNText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {contacts.length === 0 && (
                    <RNText
                      style={{
                        fontSize: 13,
                        color: "#94a3b8",
                        marginTop: 4,
                      }}
                    >
                      Aucun contact. Crée un contact d'abord.
                    </RNText>
                  )}
                </View>
              )}

              {mode === "edit" && selectedContact && (
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
                    Contact
                  </RNText>
                  <RNText
                    style={{
                      fontSize: 15,
                      fontWeight: "500",
                      color: "#0f172a",
                    }}
                  >
                    {selectedContact.full_name}
                  </RNText>
                </View>
              )}

              {/* Date */}
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
                  Date et heure
                </RNText>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: "#f8fafc",
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <Feather name="calendar" size={16} color="#10b981" />
                  <RNText
                    style={{
                      fontSize: 15,
                      color: "#0f172a",
                    }}
                  >
                    {scheduledAt.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    à{" "}
                    {scheduledAt.toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </RNText>
                </TouchableOpacity>
                {Platform.OS === "ios" && showDatePicker && (
                  <View style={{ marginTop: 12 }}>
                    <DateTimePicker
                      value={scheduledAt}
                      mode="datetime"
                      display="spinner"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                      locale="fr-FR"
                    />
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      style={{ marginTop: 8, paddingVertical: 6 }}
                    >
                      <RNText
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: "#10b981",
                        }}
                      >
                        Fermer
                      </RNText>
                    </TouchableOpacity>
                  </View>
                )}
                {Platform.OS === "android" && showDatePicker && (
                  <DateTimePicker
                    value={scheduledAt}
                    mode="datetime"
                    display="default"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              {/* Title */}
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
                  Titre (optionnel)
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
                  }}
                  placeholder="Ex. Appel découverte"
                  placeholderTextColor="#94a3b8"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Notes */}
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
                  Notes (optionnel)
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
                  placeholder="Notes..."
                  placeholderTextColor="#94a3b8"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
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
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: "#10b981",
                opacity: !canSubmit || loading ? 0.5 : 1,
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
                  : mode === "create"
                    ? "Créer"
                    : "Enregistrer"}
              </RNText>
            </TouchableOpacity>
          </View>

          {mode === "edit" && appointment && onDelete && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Supprimer le rendez-vous",
                  "Ce rendez-vous sera supprimé.",
                  [
                    { text: "Annuler", style: "cancel" },
                    {
                      text: "Supprimer",
                      style: "destructive",
                      onPress: () => onDelete(appointment.id),
                    },
                  ]
                )
              }
              style={{
                marginTop: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <RNText
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#ef4444",
                }}
              >
                Supprimer ce rendez-vous
              </RNText>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
