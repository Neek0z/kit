import { useState } from "react";
import {
  View,
  Text as RNText,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { useContactRelances } from "../../hooks/useContactRelances";
import type { CreateContactInput } from "../../hooks/useContacts";
import type { Contact, ContactRelance, FollowUpRecurrence } from "../../types";
import { FOLLOW_UP_RECURRENCE_LABELS } from "../../types";
import { AddRelanceSheet } from "./AddRelanceSheet";
import {
  scheduleFollowUpNotificationInSeconds,
} from "../../lib/notifications";

interface ContactRelancesSectionProps {
  contact: Contact;
  updateContact: (
    id: string,
    data: Partial<CreateContactInput>
  ) => Promise<{ ok: boolean; errorMessage?: string }>;
  addInteraction: (
    contactId: string,
    type: "note",
    content: string
  ) => Promise<unknown>;
  refetchContacts: () => Promise<void>;
}

function RelanceRow({
  r,
  theme,
  onDone,
  onEdit,
  onDelete,
}: {
  r: ContactRelance;
  theme: ReturnType<typeof useTheme>;
  onDone: () => void | Promise<void>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const at = new Date(r.scheduled_at);
  const isLate = at < new Date() && !r.done_at;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        backgroundColor: theme.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: isLate ? "rgba(248,113,113,0.35)" : theme.border,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: 4,
          backgroundColor: isLate ? "#f87171" : theme.primary,
        }}
      />
      <View style={{ flex: 1, padding: 14, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <RNText
              style={{
                fontSize: 15,
                fontWeight: "800",
                color: isLate ? "#f87171" : theme.textPrimary,
              }}
            >
              {at.toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}{" "}
              ·{" "}
              {at.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </RNText>
            {r.note ? (
              <RNText
                style={{ fontSize: 13, color: theme.textMuted, marginTop: 4, lineHeight: 18 }}
                numberOfLines={4}
              >
                {r.note}
              </RNText>
            ) : (
              <RNText style={{ fontSize: 12, color: theme.textHint, marginTop: 2, fontStyle: "italic" }}>
                Sans note
              </RNText>
            )}
          </View>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity
              onPress={() => void onDone()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: theme.primaryBg,
                borderWidth: 1,
                borderColor: theme.primaryBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel="Marquer comme fait"
            >
              <Feather name="check" size={18} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onEdit}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: theme.bg,
                borderWidth: 1,
                borderColor: theme.border,
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel="Modifier"
            >
              <Feather name="edit-2" size={16} color={theme.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(248,113,113,0.08)",
                borderWidth: 1,
                borderColor: "rgba(248,113,113,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
              accessibilityLabel="Supprimer"
            >
              <Feather name="trash-2" size={16} color="#f87171" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export function ContactRelancesSection({
  contact,
  updateContact,
  addInteraction,
  refetchContacts,
}: ContactRelancesSectionProps) {
  const theme = useTheme();
  const {
    pendingRelances,
    doneRelances,
    pendingCount,
    loading,
    createRelance,
    updateRelance,
    deleteRelance,
    completeRelance,
    completeEarliest,
    reprogramEarliestByRecurrence,
  } = useContactRelances(contact.id, {
    contactName: contact.full_name,
    legacyNextFollowUp: contact.next_follow_up,
    legacyNotificationId: contact.notification_id,
    onContactsSynced: refetchContacts,
  });

  const recurrence =
    (contact.follow_up_recurrence as FollowUpRecurrence) ?? "none";

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRelance | null>(null);
  const [showDone, setShowDone] = useState(false);

  const handleRecurrenceChange = async (value: FollowUpRecurrence) => {
    const v = value === "none" ? null : value;
    await updateContact(contact.id, { follow_up_recurrence: v });
    await refetchContacts();
  };

  const handleTestNotification = async () => {
    try {
      await scheduleFollowUpNotificationInSeconds(
        contact.full_name,
        contact.id,
        60
      );
      Alert.alert(
        "Test rappel",
        "Un rappel est programmé dans 1 minute. Mets l’app en arrière-plan ou verrouille l’écran pour voir la notification."
      );
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible de planifier le test (Expo Go ? Essaie un build de dev)."
      );
    }
  };

  const confirmDelete = (r: ContactRelance) => {
    Alert.alert(
      "Supprimer cette relance ?",
      "Le rappel associé sera annulé.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteRelance(r.id),
        },
      ]
    );
  };

  const onSaveSheet = async (date: Date, note: string) => {
    if (editing) {
      return updateRelance(editing.id, { scheduled_at: date, note });
    }
    return createRelance(date, note);
  };

  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <RNText
            style={{
              fontSize: 10,
              color: theme.textHint,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              fontWeight: "700",
            }}
          >
            Relances prévues
          </RNText>
          <RNText style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
            Plusieurs dates, chacune avec une note optionnelle.
          </RNText>
        </View>
        <TouchableOpacity
          onPress={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 100,
            backgroundColor: theme.primary,
          }}
        >
          <Feather name="plus" size={18} color={theme.isDark ? "#0f172a" : "#ffffff"} />
          <RNText
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: theme.isDark ? "#0f172a" : "#ffffff",
            }}
          >
            Ajouter
          </RNText>
        </TouchableOpacity>
      </View>

      {loading && pendingRelances.length === 0 && doneRelances.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : null}

      {pendingRelances.length === 0 && !loading ? (
        <TouchableOpacity
          onPress={() => {
            setEditing(null);
            setSheetOpen(true);
          }}
          style={{
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 16,
            padding: 18,
            alignItems: "center",
            gap: 8,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.primaryBg,
              borderWidth: 1,
              borderColor: theme.primaryBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="bell" size={22} color={theme.primary} />
          </View>
          <RNText style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>
            Aucune relance planifiée
          </RNText>
          <RNText style={{ fontSize: 13, color: theme.textMuted, textAlign: "center" }}>
            Touche pour ajouter une date de relance et une note.
          </RNText>
        </TouchableOpacity>
      ) : (
        <View style={{ gap: 10 }}>
          {pendingRelances.map((r) => (
            <RelanceRow
              key={r.id}
              r={r}
              theme={theme}
              onDone={async () => {
                await completeRelance(r.id);
                await addInteraction(contact.id, "note", "Relance effectuée");
              }}
              onEdit={() => {
                setEditing(r);
                setSheetOpen(true);
              }}
              onDelete={() => confirmDelete(r)}
            />
          ))}
        </View>
      )}

      {pendingCount > 0 && (
        <TouchableOpacity
          onPress={async () => {
            await completeEarliest();
            await addInteraction(contact.id, "note", "Relance effectuée");
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 10,
          }}
        >
          <Feather name="check-circle" size={18} color={theme.primary} />
          <RNText style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>
            Marquer la prochaine relance comme faite
          </RNText>
        </TouchableOpacity>
      )}

      {/* Récurrence */}
      <View
        style={{
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 16,
          padding: 14,
        }}
      >
        <RNText
          style={{
            fontSize: 10,
            color: theme.textHint,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontWeight: "700",
            marginBottom: 10,
          }}
        >
          Répéter (prochaine relance)
        </RNText>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(["none", "weekly", "biweekly", "monthly"] as FollowUpRecurrence[]).map(
            (r) => (
              <TouchableOpacity
                key={r}
                onPress={() => handleRecurrenceChange(r)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: recurrence === r ? theme.primary : theme.border,
                  backgroundColor:
                    recurrence === r ? theme.primaryBg : theme.bg,
                }}
              >
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: recurrence === r ? theme.primary : theme.textMuted,
                  }}
                >
                  {FOLLOW_UP_RECURRENCE_LABELS[r]}
                </RNText>
              </TouchableOpacity>
            )
          )}
        </View>
        {recurrence !== "none" && pendingCount > 0 && (
          <TouchableOpacity
            onPress={() => reprogramEarliestByRecurrence(recurrence)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            <Feather name="refresh-cw" size={16} color={theme.primary} />
            <RNText style={{ fontSize: 13, fontWeight: "600", color: theme.primary }}>
              Reprogrammer la prochaine relance selon la récurrence
            </RNText>
          </TouchableOpacity>
        )}
      </View>

      {doneRelances.length > 0 && (
        <View>
          <TouchableOpacity
            onPress={() => setShowDone(!showDone)}
            style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 }}
          >
            <Feather
              name={showDone ? "chevron-up" : "chevron-down"}
              size={16}
              color={theme.textHint}
            />
            <RNText style={{ fontSize: 13, color: theme.textHint, fontWeight: "600" }}>
              {doneRelances.length} terminée{doneRelances.length > 1 ? "s" : ""}
            </RNText>
          </TouchableOpacity>
          {showDone && (
            <View style={{ gap: 8, marginTop: 6 }}>
              {doneRelances.map((r) => (
                <View
                  key={r.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: theme.border,
                    opacity: 0.85,
                  }}
                >
                  <RNText style={{ fontSize: 12, color: theme.textMuted }}>
                    {new Date(r.scheduled_at).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {r.done_at
                      ? ` · fait le ${new Date(r.done_at).toLocaleDateString("fr-FR")}`
                      : ""}
                  </RNText>
                  {r.note ? (
                    <RNText style={{ fontSize: 13, color: theme.textPrimary, marginTop: 4 }}>
                      {r.note}
                    </RNText>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <TouchableOpacity onPress={handleTestNotification} style={{ paddingVertical: 6 }}>
        <RNText style={{ fontSize: 12, color: theme.textHint }}>
          Test : rappel dans 1 min →
        </RNText>
      </TouchableOpacity>

      <AddRelanceSheet
        visible={sheetOpen}
        editing={editing}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
        }}
        onSave={onSaveSheet}
      />
    </View>
  );
}
