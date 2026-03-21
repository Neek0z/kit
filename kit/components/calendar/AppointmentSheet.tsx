import { useState, useEffect, useMemo } from "react";
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
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { Avatar } from "../ui";
import type { Appointment, Contact } from "../../types";
import { useTheme } from "../../lib/theme";

interface AppointmentSheetProps {
  visible: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  contacts: Contact[];
  preselectedContactId?: string | null;
  appointment?: Appointment | null;
  onSubmitCreate: (params: {
    contact_ids: string[];
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
  const theme = useTheme();
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [showContactList, setShowContactList] = useState(false);
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
      setSelectedContactIds([appointment.contact_id]);
      setScheduledAt(new Date(appointment.scheduled_at));
      setTitle(appointment.title ?? "");
      setNotes(appointment.notes ?? "");
    } else {
      setSelectedContactIds(
        preselectedContactId ? [preselectedContactId] : []
      );
      const d = new Date();
      d.setMinutes(d.getMinutes() + 60);
      d.setSeconds(0, 0);
      setScheduledAt(d);
      setTitle("");
      setNotes("");
    }
    setContactSearch("");
    setShowContactList(false);
  }, [visible, mode, appointment, preselectedContactId]);

  const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setScheduledAt(date);
  };

  const openAndroidPicker = async () => {
    try {
      const { action, year, month, day } =
        await DateTimePickerAndroid.open({
          value: scheduledAt,
          mode: "date",
          minimumDate: new Date(),
        });
      if (action === "dismissedAction") return;
      const { action: tAction, hours, minutes } =
        await DateTimePickerAndroid.open({
          value: scheduledAt,
          mode: "time",
          is24Hour: true,
        });
      if (tAction === "dismissedAction") return;
      const d = new Date(year!, month!, day!);
      d.setHours(hours!, minutes!, 0, 0);
      setScheduledAt(d);
    } catch {}
  };

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  const selectedContacts = useMemo(
    () => contacts.filter((c) => selectedContactIds.includes(c.id)),
    [contacts, selectedContactIds]
  );

  const handleSubmit = async () => {
    if (mode === "create") {
      if (selectedContactIds.length === 0) return;
      setLoading(true);
      await onSubmitCreate({
        contact_ids: selectedContactIds,
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

  const canSubmit =
    mode === "edit" ? true : selectedContactIds.length > 0;

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
            nestedScrollEnabled
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
                      color: theme.textMuted,
                      marginBottom: 8,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Contacts ({selectedContactIds.length})
                  </RNText>

                  {/* Selected contacts chips */}
                  {selectedContacts.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      {selectedContacts.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => toggleContact(c.id)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            paddingLeft: 4,
                            paddingRight: 10,
                            paddingVertical: 4,
                            borderRadius: 100,
                            backgroundColor: theme.primaryBg,
                            borderWidth: 1,
                            borderColor: theme.primaryBorder,
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
                              fontWeight: "600",
                              color: theme.primary,
                            }}
                            numberOfLines={1}
                          >
                            {c.full_name.split(" ")[0]}
                          </RNText>
                          <Feather name="x" size={12} color={theme.primary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Search input */}
                  <TouchableOpacity
                    onPress={() => setShowContactList(true)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      backgroundColor: theme.bg,
                      borderWidth: 1,
                      borderColor: showContactList
                        ? theme.primary
                        : theme.border,
                      borderRadius: 12,
                      padding: 12,
                    }}
                    activeOpacity={1}
                  >
                    <Feather name="search" size={16} color={theme.textHint} />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: theme.textPrimary,
                        padding: 0,
                      }}
                      placeholder="Rechercher un contact..."
                      placeholderTextColor={theme.textHint}
                      value={contactSearch}
                      onChangeText={(t) => {
                        setContactSearch(t);
                        if (!showContactList) setShowContactList(true);
                      }}
                      onFocus={() => setShowContactList(true)}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowContactList((v) => !v)
                      }
                    >
                      <Feather
                        name={showContactList ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={theme.textHint}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>

                  {/* Dropdown list */}
                  {showContactList && (
                    <View
                      style={{
                        maxHeight: 180,
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: theme.border,
                        borderRadius: 12,
                        marginTop: 6,
                        overflow: "hidden",
                      }}
                    >
                      {filteredContacts.length === 0 ? (
                        <View
                          style={{
                            padding: 16,
                            alignItems: "center",
                          }}
                        >
                          <RNText
                            style={{
                              fontSize: 13,
                              color: theme.textHint,
                            }}
                          >
                            Aucun contact trouvé
                          </RNText>
                        </View>
                      ) : (
                        <ScrollView
                          nestedScrollEnabled
                          keyboardShouldPersistTaps="handled"
                          showsVerticalScrollIndicator={false}
                        >
                          {filteredContacts.map((c) => {
                            const isSelected =
                              selectedContactIds.includes(c.id);
                            return (
                              <TouchableOpacity
                                key={c.id}
                                onPress={() => toggleContact(c.id)}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 10,
                                  paddingVertical: 10,
                                  paddingHorizontal: 12,
                                  backgroundColor: isSelected
                                    ? theme.primaryBg
                                    : "transparent",
                                }}
                              >
                                <Avatar
                                  name={c.full_name}
                                  url={c.avatar_url}
                                  status={c.status}
                                  size="sm"
                                />
                                <View style={{ flex: 1 }}>
                                  <RNText
                                    style={{
                                      fontSize: 14,
                                      fontWeight: "500",
                                      color: theme.textPrimary,
                                    }}
                                    numberOfLines={1}
                                  >
                                    {c.full_name}
                                  </RNText>
                                  {c.phone && (
                                    <RNText
                                      style={{
                                        fontSize: 12,
                                        color: theme.textHint,
                                        marginTop: 1,
                                      }}
                                    >
                                      {c.phone}
                                    </RNText>
                                  )}
                                </View>
                                <View
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 6,
                                    borderWidth: 1.5,
                                    borderColor: isSelected
                                      ? theme.primary
                                      : theme.border,
                                    backgroundColor: isSelected
                                      ? theme.primary
                                      : "transparent",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  {isSelected && (
                                    <Feather
                                      name="check"
                                      size={13}
                                      color="#fff"
                                    />
                                  )}
                                </View>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>
                  )}

                  {contacts.length === 0 && (
                    <RNText
                      style={{
                        fontSize: 13,
                        color: theme.textHint,
                        marginTop: 4,
                      }}
                    >
                      Aucun contact. Crée un contact d'abord.
                    </RNText>
                  )}
                </View>
              )}

              {mode === "edit" && (
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
                    Contact
                  </RNText>
                  {selectedContacts.length > 0 ? (
                    <RNText
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color: theme.textPrimary,
                      }}
                    >
                      {selectedContacts.map((c) => c.full_name).join(", ")}
                    </RNText>
                  ) : (
                    <RNText
                      style={{
                        fontSize: 15,
                        fontWeight: "500",
                        color: theme.textHint,
                      }}
                    >
                      Contact inconnu
                    </RNText>
                  )}
                </View>
              )}

              {/* Date */}
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
                  Date et heure
                </RNText>
                <TouchableOpacity
                  onPress={() => {
                    if (Platform.OS === "android") {
                      openAndroidPicker();
                    } else {
                      setShowDatePicker(true);
                    }
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <Feather name="calendar" size={16} color={theme.primary} />
                  <RNText style={{ fontSize: 15, color: theme.textPrimary }}>
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
                          color: theme.primary,
                        }}
                      >
                        Fermer
                      </RNText>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Title */}
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
                  Titre (optionnel)
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
                  }}
                  placeholder="Ex. Appel découverte"
                  placeholderTextColor={theme.textHint}
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
                    color: theme.textMuted,
                    marginBottom: 6,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Notes (optionnel)
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
                  placeholder="Notes..."
                  placeholderTextColor={theme.textHint}
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
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: theme.primary,
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
                    ? `Créer${selectedContactIds.length > 1 ? ` (${selectedContactIds.length})` : ""}`
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
                  color: theme.danger,
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
