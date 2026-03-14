import { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  Text,
  Avatar,
  Badge,
  Card,
  Button,
  Divider,
} from "../../../components/ui";
import { Header } from "../../../components/layout";
import { AddInteractionSheet, FollowUpPicker, TagsEditor } from "../../../components/contacts";
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

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <Header
        title={contact.full_name}
        showBack
        rightAction={{
          icon: "edit-2",
          onPress: () => router.push(`/(app)/contacts/${id}/edit`),
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center py-6 gap-3">
          <Avatar name={contact.full_name} size="lg" />
          <Badge
            label={
              PIPELINE_LABELS[contact.status as PipelineStatus] ?? contact.status
            }
            variant={
              STATUS_VARIANTS[contact.status as PipelineStatus] ?? "neutral"
            }
          />
        </View>

        <View className="flex-row justify-center gap-4 px-5 mb-6">
          {contact.phone && (
            <TouchableOpacity
              onPress={handleCall}
              className="items-center gap-1"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Feather name="phone" size={20} color="#6ee7b7" />
              </View>
              <Text variant="muted" className="text-xs">
                Appeler
              </Text>
            </TouchableOpacity>
          )}
          {contact.phone && (
            <TouchableOpacity
              onPress={handleWhatsApp}
              className="items-center gap-1"
            >
              <View className="w-12 h-12 rounded-full bg-green-500/10 items-center justify-center">
                <Feather name="message-circle" size={20} color="#22c55e" />
              </View>
              <Text variant="muted" className="text-xs">
                WhatsApp
              </Text>
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              onPress={handleEmail}
              className="items-center gap-1"
            >
              <View className="w-12 h-12 rounded-full bg-secondary/10 items-center justify-center">
                <Feather name="mail" size={20} color="#818cf8" />
              </View>
              <Text variant="muted" className="text-xs">
                Email
              </Text>
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              onPress={() =>
                conversationWithContact
                  ? router.push(`/(app)/messages/${conversationWithContact.id}`)
                  : router.push(
                      `/(app)/messages/new?email=${encodeURIComponent(contact.email!)}`
                    )
              }
              className="items-center gap-1"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Feather name="message-circle" size={20} color="#6ee7b7" />
              </View>
              <Text variant="muted" className="text-xs">
                {conversationWithContact ? "Ouvrir la conversation" : "Message KIT"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="px-5 gap-3 pb-8">
          <Card>
            {contact.phone && (
              <>
                <View className="flex-row items-center gap-3 py-2">
                  <Feather name="phone" size={15} color="#475569" />
                  <Text className="text-sm">{contact.phone}</Text>
                </View>
                <Divider />
              </>
            )}
            {contact.email && (
              <View className="flex-row items-center gap-3 py-2">
                <Feather name="mail" size={15} color="#475569" />
                <Text className="text-sm">{contact.email}</Text>
              </View>
            )}
          </Card>

          <Card>
            <TagsEditor
              tags={contact.tags ?? []}
              onChange={async (nextTags) => {
                await updateContact(contact.id, { tags: nextTags });
              }}
              editable
            />
          </Card>

          {contact.notes && (
            <Card>
              <Text
                variant="muted"
                className="text-xs mb-2 uppercase tracking-wider"
              >
                Notes
              </Text>
              <Text className="text-sm leading-relaxed">{contact.notes}</Text>
            </Card>
          )}

          <Card>
            <FollowUpPicker
              value={contact.next_follow_up}
              onChange={handleFollowUpChange}
            />
            <View className="mt-3">
              <Text variant="muted" className="text-sm font-medium mb-2">
                Répéter
              </Text>
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
                <Feather name="refresh-cw" size={14} color="#6ee7b7" />
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
                <Feather name="check-circle" size={14} color="#6ee7b7" />
                <Text className="text-primary text-sm font-medium">
                  Marquer comme relancé
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleTestNotification}
              className="mt-3 py-2"
            >
              <Text variant="muted" className="text-xs">
                Test : rappel dans 1 min →
              </Text>
            </TouchableOpacity>
          </Card>

          <Button
            label="+ Ajouter une interaction"
            onPress={() => setShowSheet(true)}
            variant="secondary"
          />

          <Button
            label="📅 Prévoir un RDV"
            onPress={() => {
              setAppointmentSheetMode("create");
              setEditingAppointment(null);
              setAppointmentSheetVisible(true);
            }}
            variant="secondary"
          />

          {(() => {
            const now = new Date();
            const upcoming = (contactAppointments as Appointment[]).filter(
              (a) => new Date(a.scheduled_at) >= now
            );
            if (upcoming.length === 0) return null;
            return (
              <Card>
                <Text
                  variant="muted"
                  className="text-xs mb-3 uppercase tracking-wider"
                >
                  Prochains RDV
                </Text>
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
                          <Feather name="calendar" size={14} color="#6ee7b7" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-medium">
                            {a.title || "Rendez-vous"}
                          </Text>
                          <Text variant="muted" className="text-xs">
                            {at.toLocaleDateString("fr-FR", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            à {at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={16} color="#64748b" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            );
          })()}

          {interactions.length > 0 && (
            <Card>
              <Text
                variant="muted"
                className="text-xs mb-3 uppercase tracking-wider"
              >
                Historique
              </Text>
              <View className="gap-3">
                {interactions.map((item, index) => (
                  <View key={item.id}>
                    <View className="flex-row items-start gap-3">
                      <View className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark items-center justify-center mt-0.5">
                        <Feather
                          name={
                            INTERACTION_ICONS[item.type as InteractionType] as FeatherName
                          }
                          size={14}
                          color="#6ee7b7"
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-sm font-semibold">
                            {
                              INTERACTION_LABELS[
                                item.type as InteractionType
                              ]
                            }
                          </Text>
                          <Text variant="muted" className="text-xs">
                            {new Date(
                              item.created_at
                            ).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })}
                          </Text>
                        </View>
                        {item.content && (
                          <Text
                            variant="muted"
                            className="text-sm mt-0.5 leading-relaxed"
                          >
                            {item.content}
                          </Text>
                        )}
                      </View>
                    </View>
                    {index < interactions.length - 1 && (
                      <View className="h-px bg-border ml-11 mt-3" />
                    )}
                  </View>
                ))}
              </View>
            </Card>
          )}

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

          <Button
            label="Supprimer ce contact"
            onPress={handleDelete}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
