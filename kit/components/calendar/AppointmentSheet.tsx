import { useState, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { Text, Button, Input, Avatar } from "../ui";
import type { Appointment, Contact } from "../../types";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

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
  const [contactId, setContactId] = useState<string>(preselectedContactId ?? "");
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
  const canSubmit =
    mode === "edit" ? true : contactId.length > 0;

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
        <View className="flex-1 bg-black/50 justify-end">
          <View
            className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[90%]"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            <View className="w-10 h-1 rounded-full bg-border dark:bg-border-dark self-center mt-3 mb-2" />
            <ScrollView
              className="px-5 pb-8"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text variant="h3" className="mb-4">
                {mode === "create" ? "Nouveau rendez-vous" : "Modifier le rendez-vous"}
              </Text>

              {mode === "create" && (
                <View className="mb-4">
                  <Text variant="muted" className="text-sm font-medium mb-2">
                    Contact
                  </Text>
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
                          className={`px-3 py-2 rounded-lg border ${
                            selected
                              ? "bg-primary border-primary"
                              : "bg-background dark:bg-background-dark border-border dark:border-border-dark"
                          }`}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 8,
                              maxWidth: 180,
                            }}
                          >
                            <Avatar
                              name={c.full_name}
                              url={c.avatar_url}
                              status={c.status}
                              size="sm"
                            />
                            <Text
                              className={`text-sm font-medium flex-1 truncate ${
                                selected
                                  ? "text-onPrimary"
                                  : "text-textMuted dark:text-textMuted-dark"
                              }`}
                              numberOfLines={1}
                            >
                              {c.full_name.split(" ")[0]}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {contacts.length === 0 && (
                    <Text variant="muted" className="text-sm">
                      Aucun contact. Crée un contact d'abord.
                    </Text>
                  )}
                </View>
              )}

              {mode === "edit" && selectedContact && (
                <View className="mb-4 py-2">
                  <Text variant="muted" className="text-xs uppercase tracking-wider mb-1">
                    Contact
                  </Text>
                  <Text className="text-base font-medium">{selectedContact.full_name}</Text>
                </View>
              )}

              <View className="mb-4">
                <Text variant="muted" className="text-sm font-medium mb-2">
                  Date et heure
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center gap-2 bg-background dark:bg-background-dark border border-border dark:border-border-dark rounded-xl px-4 py-3"
                >
                  <Feather name="calendar" size={16} color="#10b981" />
                  <Text className="text-base text-textMain dark:text-textMain-dark">
                    {scheduledAt.toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    à {scheduledAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </TouchableOpacity>
                {Platform.OS === "ios" && showDatePicker && (
                  <View className="mt-3">
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
                      className="mt-2 py-2"
                    >
                      <Text className="text-primary text-sm font-medium">Fermer</Text>
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

              <View className="mb-4">
                <Input
                  label="Titre (optionnel)"
                  placeholder="Ex. Appel découverte"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
              <View className="mb-6">
                <Input
                  label="Notes (optionnel)"
                  placeholder="Notes..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  className="min-h-[80px]"
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 py-4 items-center border border-border dark:border-border-dark rounded-xl"
                >
                  <Text variant="muted">Annuler</Text>
                </TouchableOpacity>
                <View className="flex-1">
                  <Button
                    label={mode === "create" ? "Créer" : "Enregistrer"}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={!canSubmit}
                  />
                </View>
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
                  className="mt-4 py-3 items-center"
                >
                  <Text variant="muted" className="text-sm text-danger">
                    Supprimer ce rendez-vous
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
