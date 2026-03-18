import { useState } from "react";
import {
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text as KitText, Avatar, Card, Button, Divider, StatusPill } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { AddInteractionSheet, FollowUpPicker, TagsEditor, PipelineArc, WorkflowTimeline } from "../../../components/contacts";
import { AppointmentSheet } from "../../../components/calendar/AppointmentSheet";
import { useContacts } from "../../../hooks/useContacts";
import { useConversations } from "../../../hooks/useConversations";
import { useInteractions } from "../../../hooks/useInteractions";
import { useAppointments } from "../../../hooks/useAppointments";
import type { Appointment } from "../../../types";
import { useToast } from "../../../lib/ToastContext";
import {
  scheduleFollowUpNotification,
  cancelNotification,
  scheduleFollowUpNotificationInSeconds,
  getReminderTime,
} from "../../../lib/notifications";
import {
  PIPELINE_LABELS,
  PipelineStatus,
  INTERACTION_LABELS,
  INTERACTION_ICONS,
  InteractionType,
  FollowUpRecurrence,
  FOLLOW_UP_RECURRENCE_LABELS,
} from "../../../types";
import { useTheme, STATUS_COLORS, StatusKey } from "../../../lib/theme";
import { useContactGroups } from "../../../hooks/useContactGroups";
import { GroupBadge } from "../../../components/groups/GroupBadge";
import { GroupPicker } from "../../../components/groups/GroupPicker";
import { ContactTasksSection } from "../../../components/contacts/ContactTasksSection";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

const STATUS_VARIANTS: Record<
  PipelineStatus,
  "success" | "info" | "warning" | "neutral" | "danger"
> = {
  new: "neutral",
  contacted: "info",
  interested: "warning",
  follow_up: "danger",
  client: "success",
  inactive: "neutral",
};

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { contacts, deleteContact, updateContact } = useContacts();
  const { conversations } = useConversations();
  const { interactions, addInteraction } = useInteractions(id ?? "");
  const {
    appointments: contactAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments({ contactId: id ?? null });
  const { showToast } = useToast();
  const [showSheet, setShowSheet] = useState(false);
  const [appointmentSheetVisible, setAppointmentSheetVisible] = useState(false);
  const [appointmentSheetMode, setAppointmentSheetMode] = useState<"create" | "edit">("create");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { groups: contactGroups, addToGroup, removeFromGroup } = useContactGroups(id ?? "");
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  // Accordion UI (workflow client): replié par défaut, uniquement pour le rendu.
  const [workflowExpanded, setWorkflowExpanded] = useState(false);

  const contact = contacts.find((c) => c.id === id);
  const conversationWithContact = contact?.email
    ? conversations.find(
        (c) =>
          c.otherParticipant?.email?.toLowerCase() ===
          contact.email?.toLowerCase()
      )
    : null;

  if (!contact) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <Text variant="muted">Contact introuvable.</Text>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      "Supprimer le contact",
      `Supprimer ${contact.full_name} définitivement ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteContact(contact.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
  };

  const handleEmail = () => {
    if (contact.email) Linking.openURL(`mailto:${contact.email}`);
  };

  const handleWhatsApp = () => {
    if (contact.phone) {
      const cleaned = contact.phone.replace(/\s/g, "");
      Linking.openURL(`https://wa.me/${cleaned}`);
    }
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
    } catch (e) {
      Alert.alert("Erreur", "Impossible de planifier le test (Expo Go ? Essaie un build de dev).");
    }
  };

  const handleFollowUpChange = async (date: Date | null) => {
    try {
      if (contact.notification_id) {
        await cancelNotification(contact.notification_id);
      }

      const { hour, minute } = await getReminderTime();

      let notificationId: string | undefined;

      if (date) {
        const notifDate = new Date(date);
        notifDate.setHours(hour, minute, 0, 0);
        notificationId = await scheduleFollowUpNotification(
          contact.full_name,
          contact.id,
          notifDate
        );
      }

      const nextDate = date
        ? (() => {
            const d = new Date(date);
            d.setHours(hour, minute, 0, 0);
            return d.toISOString();
          })()
        : null;
      const result = await updateContact(contact.id, {
        next_follow_up: nextDate,
        notification_id: notificationId ?? null,
      });
      if (!result.ok) {
        Alert.alert("Erreur", result.errorMessage ?? "Impossible d'enregistrer la date de relance.");
      } else {
        showToast("Relance programmée");
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de planifier le rappel.");
    }
  };

  const recurrence =
    (contact.follow_up_recurrence as FollowUpRecurrence) ?? "none";

  const handleRecurrenceChange = async (value: FollowUpRecurrence) => {
    const v = value === "none" ? null : value;
    await updateContact(contact.id, { follow_up_recurrence: v });
  };

  const handleReprogramByRecurrence = async () => {
    if (recurrence === "none") return;
    const { hour, minute } = await getReminderTime();
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (recurrence === "weekly") d.setDate(d.getDate() + 7);
    else if (recurrence === "biweekly") d.setDate(d.getDate() + 14);
    else if (recurrence === "monthly") d.setMonth(d.getMonth() + 1);
    handleFollowUpChange(d);
  };

  const handleMarkAsFollowedUp = async () => {
    if (contact.notification_id) {
      await cancelNotification(contact.notification_id);
    }
    const result = await updateContact(contact.id, {
      next_follow_up: null,
      notification_id: null,
    });
    if (!result.ok) {
      Alert.alert(
        "Erreur",
        result.errorMessage ?? "Impossible de mettre à jour le contact."
      );
      return;
    }
    await addInteraction(contact.id, "note", "Relance effectuée");
    showToast("Marqué comme relancé");
  };

  const statusColors =
    STATUS_COLORS[contact.status as StatusKey] ?? STATUS_COLORS.inactive;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header
        title={contact.full_name}
        showBack
        onBack={() => router.push("/(app)/contacts")}
        rightAction={{
          icon: "edit-2",
          onPress: () => router.push(`/(app)/contacts/${id}/edit`),
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Ligne décorative */}
        <View
          style={{
            height: 1,
            marginHorizontal: 32,
            backgroundColor: theme.primary,
            opacity: 0.25,
          }}
        />

        {/* Hero section */}
        <View
          style={{
            alignItems: "center",
            paddingVertical: 20,
            paddingHorizontal: 16,
            gap: 8,
          }}
        >
          <Avatar
            name={contact.full_name}
            status={contact.status}
            size="lg"
          />
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: theme.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            {contact.full_name}
          </Text>
          <StatusPill
            status={contact.status}
            size="md"
          />
        </View>

        {/* Actions rapides */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 10,
            paddingHorizontal: 16,
            paddingBottom: 14,
          }}
        >
          {[
            {
              icon: "phone",
              label: "Appeler",
              color: theme.primary,
              onPress: handleCall,
              visible: !!contact.phone,
            },
            {
              icon: "message-circle",
              label: "WhatsApp",
              color: theme.primary,
              onPress: handleWhatsApp,
              visible: !!contact.phone,
            },
            {
              icon: "mail",
              label: "Email",
              color: theme.primary,
              onPress: handleEmail,
              visible: !!contact.email,
            },
            {
              icon: "message-square",
              label: "KIT",
              color: theme.primary,
              onPress: () =>
                contact.email &&
                (conversationWithContact
                  ? router.push(`/(app)/messages/${conversationWithContact.id}`)
                  : router.push(
                      `/(app)/messages/new?email=${encodeURIComponent(
                        contact.email!
                      )}`
                    )),
              visible: !!contact.email,
            },
          ]
            .filter((a) => a.visible)
            .map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress}
                style={{ alignItems: "center", gap: 5, flex: 1 }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderColor: `${action.color}25`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={action.icon as FeatherName}
                    size={19}
                    color={action.color}
                  />
                </View>
                <Text
                  style={{ fontSize: 10, color: theme.textMuted }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        <View style={{ gap: 12, paddingBottom: 24 }}>
          {/* Card : Infos contact + Pipeline fusionnés */}
          <Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
            {/* Téléphone */}
            {contact.phone && (
              <TouchableOpacity
                onPress={handleCall}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 6,
                }}
              >
                <Feather name="phone" size={14} color={theme.textHint} />
                <Text style={{ fontSize: 13, color: theme.textPrimary, flex: 1 }}>
                  {contact.phone}
                </Text>
                <Feather name="chevron-right" size={12} color={theme.textHint} />
              </TouchableOpacity>
            )}

            {/* Séparateur téléphone/email */}
            {contact.phone && contact.email && (
              <View style={{ height: 1, backgroundColor: theme.border }} />
            )}

            {/* Email */}
            {contact.email && (
              <TouchableOpacity
                onPress={handleEmail}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 6,
                }}
              >
                <Feather name="mail" size={14} color={theme.textHint} />
                <Text style={{ fontSize: 13, color: theme.textPrimary, flex: 1 }}>
                  {contact.email}
                </Text>
                <Feather name="chevron-right" size={12} color={theme.textHint} />
              </TouchableOpacity>
            )}

            {/* Séparateur avant pipeline */}
            <View
              style={{
                height: 1,
                backgroundColor: theme.border,
                marginVertical: 10,
              }}
            />

            <Text
              style={{
                fontSize: 10,
                color: theme.textHint,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              Pipeline
            </Text>

            <PipelineArc
              status={contact.status as PipelineStatus}
              onChange={async (newStatus) => {
                await updateContact(contact.id, { status: newStatus });
              }}
            />

            {contact.notes && (
              <>
                <View
                  style={{
                    height: 1,
                    backgroundColor: theme.border,
                    marginVertical: 10,
                  }}
                />
                <KitText
                  variant="muted"
                  className="text-xs mb-1 uppercase tracking-wider"
                >
                  Notes
                </KitText>
                <Text
                  style={{
                    fontSize: 13,
                    color: theme.textMuted,
                    lineHeight: 18,
                  }}
                >
                  {contact.notes}
                </Text>
              </>
            )}
          </Card>

          {/* Card : Prochaine relance compacte */}
          <Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: theme.textHint,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  fontWeight: "600",
                }}
              >
                Prochaine relance
              </Text>
              {contact.next_follow_up && (
                <TouchableOpacity onPress={() => handleFollowUpChange(null)}>
                  <Text style={{ fontSize: 11, color: theme.primary }}>Supprimer</Text>
                </TouchableOpacity>
              )}
            </View>

            <FollowUpPicker value={contact.next_follow_up} onChange={handleFollowUpChange} />

            <View style={{ marginTop: 12 }}>
              <KitText variant="muted" className="text-sm font-medium mb-2">
                Répéter
              </KitText>
              <View className="flex-row flex-wrap gap-2">
                {(
                  ["none", "weekly", "biweekly", "monthly"] as FollowUpRecurrence[]
                ).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => handleRecurrenceChange(r)}
                    className={`px-3 py-2 rounded-lg border ${
                      recurrence === r
                        ? "bg-primary border-primary"
                        : "bg-surface dark:bg-surface-dark border-border dark:border-border-dark"
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        recurrence === r
                          ? "text-onPrimary font-medium"
                          : "text-textMuted dark:text-textMuted-dark"
                      }`}
                    >
                      {FOLLOW_UP_RECURRENCE_LABELS[r]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {recurrence !== "none" && (
              <TouchableOpacity
                onPress={handleReprogramByRecurrence}
                className="mt-3 py-2 flex-row items-center gap-2"
              >
                <Feather name="refresh-cw" size={14} color={theme.primary} />
                <Text className="text-primary text-sm font-medium">
                  Reprogrammer selon la récurrence
                </Text>
              </TouchableOpacity>
            )}

            {contact.next_follow_up && (
              <TouchableOpacity
                onPress={handleMarkAsFollowedUp}
                className="mt-3 py-2 flex-row items-center gap-2"
              >
                <Feather name="check-circle" size={14} color={theme.primary} />
                <Text className="text-primary text-sm font-medium">
                  Marquer comme relancé
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleTestNotification} className="mt-3 py-2">
              <KitText variant="muted" className="text-xs">
                Test : rappel dans 1 min →
              </KitText>
            </TouchableOpacity>
          </Card>

          {/* Card : Tâches */}
          <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
            <ContactTasksSection contactId={id ?? ""} />
          </View>

          {/* Row : Groupes + Tags */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginHorizontal: 16,
              marginBottom: 10,
            }}
          >
            {/* Groupes */}
            <View
              style={{
                flex: 1,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 14,
                padding: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.textHint,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontWeight: "600",
                  }}
                >
                  Groupes
                </Text>
                <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
                  <Feather name="plus" size={14} color={theme.primary} />
                </TouchableOpacity>
              </View>

              {contactGroups.length === 0 ? (
                <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
                  <Text style={{ fontSize: 11, color: theme.textHint }}>
                    Ajouter...
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {contactGroups.slice(0, 2).map((group) => (
                    <GroupBadge
                      key={group.id}
                      group={group}
                      size="sm"
                      onRemove={() => removeFromGroup(group.id)}
                    />
                  ))}
                  {contactGroups.length > 2 && (
                    <Text style={{ fontSize: 10, color: theme.textMuted }}>
                      +{contactGroups.length - 2}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Tags */}
            <View
              style={{
                flex: 1,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 14,
                padding: 12,
              }}
            >
              <TagsEditor
                tags={contact.tags ?? []}
                onChange={async (nextTags) => {
                  await updateContact(contact.id, { tags: nextTags });
                }}
                editable
              />
            </View>
          </View>

          {/* Card : Historique interactions */}
          <Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  color: theme.textHint,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  fontWeight: "600",
                }}
              >
                Historique
              </Text>
              <TouchableOpacity onPress={() => setShowSheet(true)}>
                <Text style={{ fontSize: 11, color: theme.primary, fontWeight: "600" }}>
                  + Ajouter
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              {interactions.length === 0 ? (
                <Text style={{ fontSize: 12, color: theme.textMuted }}>
                  Aucune interaction
                </Text>
              ) : (
                interactions.map((item, index) => (
                  <View key={item.id}>
                    <View className="flex-row items-start gap-3">
                      <View className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark items-center justify-center mt-0.5">
                        <Feather
                          name={
                            INTERACTION_ICONS[item.type as InteractionType] as FeatherName
                          }
                          size={14}
                          color={theme.primary}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold">
                            {INTERACTION_LABELS[item.type as InteractionType]}
                          </Text>
                          <KitText variant="muted" className="text-xs">
                            {new Date(item.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </KitText>
                        </View>
                        {item.content && (
                          <KitText variant="muted" className="text-sm mt-0.5 leading-relaxed">
                            {item.content}
                          </KitText>
                        )}
                      </View>
                    </View>
                    {index < interactions.length - 1 && (
                      <View className="h-px bg-border ml-11 mt-3" />
                    )}
                  </View>
                ))
              )}
            </View>
          </Card>

          {/* Card : Workflow client (accordion UI) */}
          {contact.status === "client" && (
            <View style={{ marginHorizontal: 16, marginBottom: 10 }}>
              <WorkflowTimeline
                contactId={contact.id}
                expanded={workflowExpanded}
                onToggle={() => setWorkflowExpanded((v) => !v)}
              />
            </View>
          )}

          {/* Prochains RDV (conservé) */}
          {(() => {
            const now = new Date();
            const upcoming = (contactAppointments as Appointment[]).filter(
              (a) => new Date(a.scheduled_at) >= now
            );
            if (upcoming.length === 0) return null;
            return (
              <Card style={{ marginHorizontal: 16, marginBottom: 10 }}>
                <KitText
                  variant="muted"
                  className="text-xs mb-3 uppercase tracking-wider"
                >
                  Prochains RDV
                </KitText>
                <View className="gap-2">
                  {upcoming.map((a) => {
                    const at = new Date(a.scheduled_at);
                    return (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => {
                          setEditingAppointment(a);
                          setAppointmentSheetMode("edit");
                          setAppointmentSheetVisible(true);
                        }}
                        className="flex-row items-center gap-3 py-2"
                      >
                        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                          <Feather name="calendar" size={14} color={theme.primary} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium">
                            {a.title || "Rendez-vous"}
                          </Text>
                          <KitText variant="muted" className="text-xs">
                            {at.toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            à{" "}
                            {at.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </KitText>
                        </View>
                        <Feather name="chevron-right" size={16} color={theme.textHint} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            );
          })()}

          {/* Boutons bas de page */}
          <View style={{ marginHorizontal: 16, gap: 12, paddingBottom: 8 }}>
            <Button
              label="Prévoir un RDV"
              onPress={() => {
                setAppointmentSheetMode("create");
                setEditingAppointment(null);
                setAppointmentSheetVisible(true);
              }}
              variant="secondary"
            />

            <Button
              label="Supprimer ce contact"
              onPress={handleDelete}
              variant="ghost"
            />
          </View>

          <AddInteractionSheet
            visible={showSheet}
            onClose={() => setShowSheet(false)}
            onAdd={async (type, content) => {
              if (id) await addInteraction(id, type, content);
              showToast("Interaction ajoutée");
            }}
          />

          <AppointmentSheet
            visible={appointmentSheetVisible}
            onClose={() => {
              setAppointmentSheetVisible(false);
              setEditingAppointment(null);
            }}
            mode={appointmentSheetMode}
            contacts={contacts}
            preselectedContactId={id ?? null}
            appointment={editingAppointment}
            onSubmitCreate={async (params) => {
              const created = await createAppointment(params);
              if (created) showToast("Rendez-vous créé");
            }}
            onSubmitEdit={async (appointmentId, params) => {
              const ok = await updateAppointment(appointmentId, params);
              if (ok) showToast("Rendez-vous mis à jour");
              return ok;
            }}
            onDelete={async (appointmentId) => {
              const ok = await deleteAppointment(appointmentId);
              if (ok) {
                showToast("Rendez-vous supprimé");
                setAppointmentSheetVisible(false);
                setEditingAppointment(null);
              }
            }}
          />
        </View>
      </ScrollView>

      <GroupPicker
        visible={showGroupPicker}
        selectedGroups={contactGroups}
        onAdd={addToGroup}
        onRemove={removeFromGroup}
        onClose={() => setShowGroupPicker(false)}
      />
    </SafeAreaView>
  );
}
