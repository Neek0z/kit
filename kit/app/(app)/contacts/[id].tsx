import { useState, useEffect, useMemo } from "react";
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
  Divider,
} from "../../../components/ui";
import {
  AddInteractionSheet,
  TagsEditor,
  PipelineArc,
  WorkflowTimeline,
  ContactRelancesSection,
  ContactTabBar,
  type ContactTabKey,
} from "../../../components/contacts";
import { AppointmentSheet } from "../../../components/calendar/AppointmentSheet";
import { useContacts } from "../../../hooks/useContacts";
import { useConversations } from "../../../hooks/useConversations";
import { useInteractions } from "../../../hooks/useInteractions";
import { useAppointments } from "../../../hooks/useAppointments";
import { usePendingRelancesCount } from "../../../hooks/useContactRelances";
import type { Appointment } from "../../../types";
import { useToast } from "../../../lib/ToastContext";
import {
  PipelineStatus,
  INTERACTION_LABELS,
  INTERACTION_ICONS,
  InteractionType,
} from "../../../types";
import { useTheme } from "../../../lib/theme";
import { useContactGroups } from "../../../hooks/useContactGroups";
import { GroupPicker } from "../../../components/groups/GroupPicker";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { contacts, deleteContact, updateContact, refetch: refetchContacts } =
    useContacts();
  const { conversations } = useConversations();
  const { interactions, addInteraction } = useInteractions(id ?? "");
  const {
    appointments: contactAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments({ contactId: id ?? null });
  const { pendingCount: relancePendingCount } = usePendingRelancesCount(
    id ?? ""
  );
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

  const upcomingAppointments = useMemo(
    () => (contactAppointments as Appointment[]).filter(
      (a) => new Date(a.scheduled_at) >= new Date()
    ),
    [contactAppointments]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
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
          paddingHorizontal: 20,
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
                borderRadius: 12,
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
                borderRadius: 12,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.successBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="message-circle" size={16} color={theme.success} />
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              onPress={handleEmail}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.accentBorder,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="mail" size={16} color={theme.accent} />
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity
              onPress={handleKitMessage}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
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
              borderRadius: 12,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: theme.warningBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="calendar" size={16} color={theme.warning} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Pipeline (toujours visible sous le hero) */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
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
          relance:
            relancePendingCount > 0 ? relancePendingCount : undefined,
          historique:
            interactions.length > 0 ? interactions.length : undefined,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
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
              {contact.phone && contact.email && <Divider />}
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

        {/* ─── ONGLET WORKFLOW ─── */}
        {activeTab === "workflow" && isClient && (
          <View style={{ gap: 12 }}>
            <WorkflowTimeline
              contactId={contact.id}
              workflowRole="parrain"
              sectionTitle="Workflow parrain"
            />
            <WorkflowTimeline
              contactId={contact.id}
              workflowRole="client_arrival"
              sectionTitle="Arrivée client (checklist)"
            />
          </View>
        )}

        {/* ─── ONGLET RELANCES ─── */}
        {activeTab === "relance" && (
          <ContactRelancesSection
            contact={contact}
            updateContact={updateContact}
            addInteraction={addInteraction}
            refetchContacts={refetchContacts}
          />
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
                    {index < interactions.length - 1 && <Divider />}
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
