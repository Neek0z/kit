import { useState, useEffect } from "react";
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
import {
  Text as KitText,
  Avatar,
  Card,
  Button,
  StatusPill,
} from "../../../components/ui";
import {
  AddInteractionSheet,
  FollowUpPicker,
  TagsEditor,
  PipelineArc,
  WorkflowTimeline,
  ContactTasksSection,
  ContactTabBar,
  type ContactTabKey,
} from "../../../components/contacts";
import { AppointmentSheet } from "../../../components/calendar/AppointmentSheet";
import { useContacts } from "../../../hooks/useContacts";
import { useConversations } from "../../../hooks/useConversations";
import { useInteractions } from "../../../hooks/useInteractions";
import { useAppointments } from "../../../hooks/useAppointments";
import { useContactTasks } from "../../../hooks/useContactTasks";
import type { Appointment } from "../../../types";
import { useToast } from "../../../lib/ToastContext";
import {
  scheduleFollowUpNotification,
  cancelNotification,
  scheduleFollowUpNotificationInSeconds,
  getReminderTime,
} from "../../../lib/notifications";
import {
  PipelineStatus,
  INTERACTION_LABELS,
  INTERACTION_ICONS,
  InteractionType,
  FollowUpRecurrence,
  FOLLOW_UP_RECURRENCE_LABELS,
} from "../../../types";
import { useTheme } from "../../../lib/theme";
import { useContactGroups } from "../../../hooks/useContactGroups";
import { GroupPicker } from "../../../components/groups/GroupPicker";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

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
  const { pendingCount } = useContactTasks(id ?? "");
  const { showToast } = useToast();
  const [showSheet, setShowSheet] = useState(false);
  const [appointmentSheetVisible, setAppointmentSheetVisible] = useState(false);
  const [appointmentSheetMode, setAppointmentSheetMode] = useState<"create" | "edit">("create");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { groups: contactGroups, addToGroup, removeFromGroup } = useContactGroups(id ?? "");
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<ContactTabKey>("infos");

  const contact = contacts.find((c) => c.id === id);
  const conversationWithContact = contact?.email
    ? conversations.find(
        (c) =>
          c.otherParticipant?.email?.toLowerCase() ===
          contact.email?.toLowerCase()
      )
    : null;

  useEffect(() => {
    if (!contact) return;
    if (activeTab === "workflow" && contact.status !== "client") {
      setActiveTab("infos");
    }
  }, [contact, activeTab]);

  if (!contact) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KitText variant="muted">Contact introuvable.</KitText>
      </SafeAreaView>
    );
  }

  const isClient = contact.status === "client";

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

  const handleKitMessage = () => {
    if (!contact.email) return;
    if (conversationWithContact) {
      router.push(`/(app)/messages/${conversationWithContact.id}`);
    } else {
      router.push(
        `/(app)/messages/new?email=${encodeURIComponent(contact.email)}`
      );
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
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible de planifier le test (Expo Go ? Essaie un build de dev)."
      );
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
        Alert.alert(
          "Erreur",
          result.errorMessage ?? "Impossible d'enregistrer la date de relance."
        );
      } else {
        showToast("Relance programmée");
      }
    } catch {
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

  const upcomingAppointments = (contactAppointments as Appointment[]).filter(
    (a) => new Date(a.scheduled_at) >= new Date()
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 18,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "700",
            color: theme.textPrimary,
            flex: 1,
            textAlign: "center",
            marginHorizontal: 8,
          }}
          numberOfLines={1}
        >
          {contact.full_name}
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/contacts/${id}/edit`)}
        >
          <Feather name="edit-2" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />

      {/* Hero compact */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 18,
          paddingVertical: 14,
        }}
      >
        <Avatar
          name={contact.full_name}
          url={contact.avatar_url}
          status={contact.status}
          size="lg"
        />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: theme.textPrimary,
              letterSpacing: -0.5,
            }}
            numberOfLines={2}
          >
            {contact.full_name}
          </Text>
          <View style={{ marginTop: 5 }}>
            <StatusPill status={contact.status} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, flexShrink: 0 }}>
          {contact.phone && (
            <TouchableOpacity
              onPress={handleCall}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: `${theme.primary}30`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="phone" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
          {contact.phone && (
            <TouchableOpacity
              onPress={handleWhatsApp}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: "rgba(34,197,94,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="message-circle" size={16} color="#22c55e" />
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              onPress={handleEmail}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: "rgba(129,140,248,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="mail" size={16} color="#818cf8" />
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              onPress={handleKitMessage}
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: `${theme.primary}30`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="message-square" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityLabel="Prévoir un rendez-vous"
            onPress={() => {
              setAppointmentSheetMode("create");
              setEditingAppointment(null);
              setAppointmentSheetVisible(true);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: "rgba(251,191,36,0.35)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="calendar" size={16} color="#f59e0b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pipeline (toujours visible sous le hero) */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <Card>
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
        </Card>
      </View>

      <ContactTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showWorkflow={isClient}
        badges={{
          taches: pendingCount > 0 ? pendingCount : undefined,
          historique:
            interactions.length > 0 ? interactions.length : undefined,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* ─── ONGLET INFOS ─── */}
        {activeTab === "infos" && (
          <View style={{ gap: 10 }}>
            <Card>
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
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.textPrimary,
                      flex: 1,
                    }}
                  >
                    {contact.phone}
                  </Text>
                  <Feather name="chevron-right" size={12} color={theme.textHint} />
                </TouchableOpacity>
              )}
              {contact.phone && contact.email && (
                <View style={{ height: 1, backgroundColor: theme.border }} />
              )}
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
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.textPrimary,
                      flex: 1,
                    }}
                  >
                    {contact.email}
                  </Text>
                  <Feather name="chevron-right" size={12} color={theme.textHint} />
                </TouchableOpacity>
              )}
            </Card>

            {contact.notes && (
              <Card>
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.textHint,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontWeight: "600",
                    marginBottom: 8,
                  }}
                >
                  Notes
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.textMuted,
                    lineHeight: 20,
                  }}
                >
                  {contact.notes}
                </Text>
              </Card>
            )}

            {upcomingAppointments.length > 0 && (
              <Card>
                <KitText
                  variant="muted"
                  className="text-xs mb-3 uppercase tracking-wider"
                >
                  Prochains RDV
                </KitText>
                <View className="gap-2">
                  {upcomingAppointments.map((a) => {
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
                          <Feather
                            name="calendar"
                            size={14}
                            color={theme.primary}
                          />
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
                        <Feather
                          name="chevron-right"
                          size={16}
                          color={theme.textHint}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            )}

            <Button
              label="Supprimer ce contact"
              onPress={handleDelete}
              variant="ghost"
            />
          </View>
        )}

        {/* ─── ONGLET GROUPES ─── */}
        {activeTab === "groupes" && (
          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: theme.textPrimary,
                }}
              >
                Groupes
              </Text>
              <TouchableOpacity
                onPress={() => setShowGroupPicker(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: theme.primaryBg,
                  borderWidth: 1,
                  borderColor: theme.primaryBorder,
                  borderRadius: 100,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Feather name="plus" size={12} color={theme.primary} />
                <Text
                  style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}
                >
                  Ajouter
                </Text>
              </TouchableOpacity>
            </View>

            {contactGroups.length === 0 ? (
              <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
                <Card>
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.textHint,
                      textAlign: "center",
                      paddingVertical: 8,
                    }}
                  >
                    Aucun groupe — tap pour ajouter
                  </Text>
                </Card>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 8 }}>
                {contactGroups.map((group) => (
                  <View
                    key={group.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: `${group.color}25`,
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        flex: 1,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: `${group.color}15`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{group.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.textPrimary,
                          }}
                        >
                          {group.name}
                        </Text>
                        {group.description ? (
                          <Text
                            style={{ fontSize: 11, color: theme.textMuted }}
                            numberOfLines={2}
                          >
                            {group.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeFromGroup(group.id)}>
                      <Feather name="x" size={16} color={theme.textHint} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: 8 }}>
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
                Tags
              </Text>
              <Card>
                <TagsEditor
                  tags={contact.tags ?? []}
                  onChange={async (nextTags) => {
                    await updateContact(contact.id, { tags: nextTags });
                  }}
                  editable
                />
              </Card>
            </View>
          </View>
        )}

        {/* ─── ONGLET TÂCHES ─── */}
        {activeTab === "taches" && (
          <ContactTasksSection contactId={contact.id} />
        )}

        {/* ─── ONGLET WORKFLOW ─── */}
        {activeTab === "workflow" && isClient && (
          <View style={{ gap: 10 }}>
            <WorkflowTimeline contactId={contact.id} />
          </View>
        )}

        {/* ─── ONGLET RELANCE ─── */}
        {activeTab === "relance" && (
          <View style={{ gap: 10 }}>
            <Card>
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
                    <Text style={{ fontSize: 11, color: theme.primary }}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {contact.next_follow_up && (
                <Card
                  style={{
                    backgroundColor: theme.primaryBg,
                    borderColor: theme.primaryBorder,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        flex: 1,
                      }}
                    >
                      <Feather name="calendar" size={15} color={theme.primary} />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: theme.primary,
                          flex: 1,
                        }}
                      >
                        {new Date(contact.next_follow_up).toLocaleDateString(
                          "fr-FR",
                          {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          }
                        )}
                      </Text>
                    </View>
                  </View>
                </Card>
              )}

              <FollowUpPicker
                value={contact.next_follow_up}
                onChange={handleFollowUpChange}
              />

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
          </View>
        )}

        {/* ─── ONGLET HISTORIQUE ─── */}
        {activeTab === "historique" && (
          <View style={{ gap: 10 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: theme.textPrimary,
                }}
              >
                Interactions
              </Text>
              <TouchableOpacity
                onPress={() => setShowSheet(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: theme.primaryBg,
                  borderWidth: 1,
                  borderColor: theme.primaryBorder,
                  borderRadius: 100,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Feather name="plus" size={12} color={theme.primary} />
                <Text
                  style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}
                >
                  Ajouter
                </Text>
              </TouchableOpacity>
            </View>

            {interactions.length === 0 ? (
              <TouchableOpacity onPress={() => setShowSheet(true)}>
                <Card>
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.textHint,
                      textAlign: "center",
                      paddingVertical: 8,
                    }}
                  >
                    Aucune interaction — tap pour en ajouter
                  </Text>
                </Card>
              </TouchableOpacity>
            ) : (
              <Card>
                {interactions.map((item, index) => (
                  <View key={item.id}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 12,
                        paddingVertical: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 50,
                          backgroundColor: theme.bg,
                          borderWidth: 1,
                          borderColor: theme.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather
                          name={
                            INTERACTION_ICONS[item.type as InteractionType] as FeatherName
                          }
                          size={14}
                          color={theme.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "600",
                              color: theme.textPrimary,
                            }}
                          >
                            {INTERACTION_LABELS[item.type as InteractionType]}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textHint }}>
                            {new Date(item.created_at).toLocaleDateString(
                              "fr-FR",
                              { day: "numeric", month: "short" }
                            )}
                          </Text>
                        </View>
                        {item.content && (
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                              marginTop: 3,
                              lineHeight: 17,
                            }}
                          >
                            {item.content}
                          </Text>
                        )}
                      </View>
                    </View>
                    {index < interactions.length - 1 && (
                      <View style={{ height: 1, backgroundColor: theme.border }} />
                    )}
                  </View>
                ))}
              </Card>
            )}
          </View>
        )}
      </ScrollView>

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

      {/* GroupPicker global : visible depuis l’onglet Groupes */}
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
