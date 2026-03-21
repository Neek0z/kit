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
  type FeatherIconName,
  type AppRoute,
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
  const [appointmentSheetMode, setAppointmentSheetMode] = useState<
    "create" | "edit"
  >("create");
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const { groups: contactGroups, addToGroup, removeFromGroup } =
    useContactGroups(id ?? "");
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

  const upcomingAppointments = useMemo(
    () =>
      (contactAppointments as Appointment[]).filter(
        (a) => new Date(a.scheduled_at) >= new Date()
      ),
    [contactAppointments]
  );

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
          backgroundColor: "#f8f9fb",
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
      router.push(`/(app)/messages/${conversationWithContact.id}` as AppRoute);
    } else {
      router.push(
        `/(app)/messages/new?email=${encodeURIComponent(contact.email)}` as AppRoute
      );
    }
  };

  const handleCreateAppt = () => {
    setAppointmentSheetMode("create");
    setEditingAppointment(null);
    setAppointmentSheetVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fb" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Feather name="chevron-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Feather name="star" size={18} color="#fbbf24" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push(`/(app)/contacts/${id}/edit` as AppRoute)
            }
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Feather name="edit-2" size={16} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero: centered avatar + name + status */}
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <Avatar
          name={contact.full_name}
          url={contact.avatar_url}
          status={contact.status}
          size="lg"
        />
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: theme.textPrimary,
            marginTop: 12,
            letterSpacing: -0.5,
          }}
        >
          {contact.full_name}
        </Text>
        {contact.notes && (
          <Text
            style={{
              fontSize: 13,
              color: theme.textMuted,
              marginTop: 4,
              textAlign: "center",
              paddingHorizontal: 32,
            }}
            numberOfLines={1}
          >
            {contact.notes}
          </Text>
        )}
        <View style={{ marginTop: 8 }}>
          <StatusPill status={contact.status} />
        </View>
      </View>

      {/* 4 action buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 16,
          paddingHorizontal: 20,
          paddingBottom: 20,
        }}
      >
        {[
          {
            label: "Appel",
            icon: "phone" as FeatherName,
            color: "#10b981",
            bg: "#f0fdf4",
            onPress: handleCall,
            show: !!contact.phone,
          },
          {
            label: "Chat",
            icon: "message-circle" as FeatherName,
            color: "#818cf8",
            bg: "#f5f3ff",
            onPress: handleWhatsApp,
            show: !!contact.phone,
          },
          {
            label: "Planifier",
            icon: "calendar" as FeatherName,
            color: "#f59e0b",
            bg: "#fffbeb",
            onPress: handleCreateAppt,
            show: true,
          },
          {
            label: "Plus",
            icon: "more-horizontal" as FeatherName,
            color: "#64748b",
            bg: "#f8fafc",
            onPress: () => {},
            show: true,
          },
        ]
          .filter((b) => b.show)
          .map((btn) => (
            <TouchableOpacity
              key={btn.label}
              onPress={btn.onPress}
              style={{ alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: btn.bg,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <Feather name={btn.icon} size={20} color={btn.color} />
              </View>
              <Text
                style={{
                  fontSize: 11,
                  color: theme.textMuted,
                  fontWeight: "500",
                }}
              >
                {btn.label}
              </Text>
            </TouchableOpacity>
          ))}
      </View>

      {/* Pipeline card */}
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

      {/* Tabs */}
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

      {/* Tab content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
        }}
      >
        {/* INFOS TAB */}
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
                  <Feather
                    name="chevron-right"
                    size={12}
                    color={theme.textHint}
                  />
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
                  <Feather
                    name="chevron-right"
                    size={12}
                    color={theme.textHint}
                  />
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
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.textHint,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    fontWeight: "600",
                    marginBottom: 12,
                  }}
                >
                  Prochains RDV
                </Text>
                <View style={{ gap: 8 }}>
                  {upcomingAppointments.map((a) => {
                    const at = new Date(a.scheduled_at);
                    const otherNames = (a.contact_ids ?? [])
                      .filter((cid: string) => cid !== id)
                      .map((cid: string) => contacts.find((c) => c.id === cid)?.full_name)
                      .filter(Boolean);
                    return (
                      <TouchableOpacity
                        key={a.id}
                        onPress={() => {
                          setEditingAppointment(a);
                          setAppointmentSheetMode("edit");
                          setAppointmentSheetVisible(true);
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#fffbeb",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather
                            name="calendar"
                            size={14}
                            color="#f59e0b"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "600",
                              color: theme.textPrimary,
                            }}
                          >
                            {a.title || "Rendez-vous"}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                              marginTop: 2,
                            }}
                          >
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
                          </Text>
                          {otherNames.length > 0 && (
                            <Text
                              style={{
                                fontSize: 11,
                                color: theme.textHint,
                                marginTop: 2,
                              }}
                              numberOfLines={1}
                            >
                              avec {otherNames.join(", ")}
                            </Text>
                          )}
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

        {/* GROUPS TAB */}
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
                  backgroundColor: "#f0fdf4",
                  borderRadius: 100,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Feather name="plus" size={12} color="#10b981" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#10b981",
                  }}
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
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      padding: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
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
                            style={{
                              fontSize: 11,
                              color: theme.textMuted,
                            }}
                            numberOfLines={2}
                          >
                            {group.description}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFromGroup(group.id)}
                    >
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

        {/* WORKFLOW TAB */}
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

        {/* RELANCES TAB */}
        {activeTab === "relance" && (
          <ContactRelancesSection
            contact={contact}
            updateContact={updateContact}
            addInteraction={addInteraction}
            refetchContacts={refetchContacts}
          />
        )}

        {/* HISTORY TAB */}
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
                  backgroundColor: "#f0fdf4",
                  borderRadius: 100,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                }}
              >
                <Feather name="plus" size={12} color="#10b981" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: "#10b981",
                  }}
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
                          borderRadius: 16,
                          backgroundColor: "#f0fdf4",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather
                          name={
                            INTERACTION_ICONS[
                              item.type as InteractionType
                            ] as FeatherName
                          }
                          size={14}
                          color="#10b981"
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
                            {
                              INTERACTION_LABELS[
                                item.type as InteractionType
                              ]
                            }
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.textHint,
                            }}
                          >
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
