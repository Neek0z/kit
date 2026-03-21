# KIT — Fiche contact avec onglets

## Contexte

On restructure complètement la fiche contact avec un système d'onglets.
Le hero (avatar + nom + statut + actions) est toujours visible en haut.
Le contenu est organisé en 6 onglets dans cet ordre exact.

---

## Structure générale

```
Header (retour + nom + édition)
Ligne décorative
Hero compact (avatar + nom + statut + boutons d'action)
Pipeline arc (toujours visible, sous le hero)
─────────────────────────────────
Onglets : Infos | Groupes | Tâches | Workflow | Relance | Historique
─────────────────────────────────
Contenu de l'onglet actif (scrollable)
```

---

## Ce que tu dois faire

### 1. Composant TabBar

Créer un composant de barre d'onglets horizontal scrollable
pour gérer les 6 onglets :

```tsx
import { useState, useRef } from "react";
import { View, TouchableOpacity, ScrollView, Text } from "react-native";
import { useTheme } from "../../lib/theme";

type TabKey = "infos" | "groupes" | "taches" | "workflow" | "relance" | "historique";

interface Tab {
  key: TabKey;
  label: string;
  badge?: number;
}

interface ContactTabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  badges?: Partial<Record<TabKey, number>>;
  showWorkflow?: boolean;
}

export function ContactTabBar({
  activeTab,
  onTabChange,
  badges = {},
  showWorkflow = false,
}: ContactTabBarProps) {
  const theme = useTheme();

  const tabs: Tab[] = [
    { key: "infos",       label: "Infos" },
    { key: "groupes",     label: "Groupes" },
    { key: "taches",      label: "Tâches",     badge: badges.taches },
    ...(showWorkflow ? [{ key: "workflow" as TabKey, label: "Workflow", badge: badges.workflow }] : []),
    { key: "relance",     label: "Relance" },
    { key: "historique",  label: "Historique", badge: badges.historique },
  ];

  return (
    <View style={{
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.bg,
    }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                borderBottomWidth: 2,
                borderBottomColor: isActive ? theme.primary : "transparent",
                marginBottom: -1,
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: isActive ? "700" : "500",
                color: isActive ? theme.primary : theme.textMuted,
              }}>
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={{
                  backgroundColor: isActive ? theme.primaryBg : theme.surface,
                  borderWidth: 1,
                  borderColor: isActive ? theme.primaryBorder : theme.border,
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  minWidth: 18,
                  alignItems: "center",
                }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: isActive ? theme.primary : theme.textMuted,
                  }}>
                    {tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
```

---

### 2. Restructurer app/(app)/contacts/[id].tsx

Remplacer complètement le layout de la fiche contact.
Conserver toute la logique métier existante (hooks, handlers, etc.).

```tsx
import { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, Card, Avatar } from "../../../components/ui";
import { StatusPill } from "../../../components/ui/StatusPill";
import { ContactTabBar } from "../../../components/contacts/ContactTabBar";
import { PipelineArc } from "../../../components/contacts/PipelineArc";
import { ContactTasksSection } from "../../../components/contacts/ContactTasksSection";
import { WorkflowTimeline } from "../../../components/contacts/WorkflowTimeline";
import { AddInteractionSheet } from "../../../components/contacts/AddInteractionSheet";
import { FollowUpPicker } from "../../../components/contacts/FollowUpPicker";
import { GroupPicker } from "../../../components/groups/GroupPicker";
import { GroupBadge } from "../../../components/groups/GroupBadge";
import { useContacts } from "../../../hooks/useContacts";
import { useContactGroups } from "../../../hooks/useContactGroups";
import { useInteractions } from "../../../hooks/useInteractions";
import { useContactTasks } from "../../../hooks/useContactTasks";
import { useTheme } from "../../../lib/theme";
import { PipelineStatus, INTERACTION_LABELS, INTERACTION_ICONS, InteractionType, STATUS_COLORS, StatusKey } from "../../../types";

type TabKey = "infos" | "groupes" | "taches" | "workflow" | "relance" | "historique";

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { contacts, updateContact, deleteContact } = useContacts();
  const { groups: contactGroups, addToGroup, removeFromGroup } = useContactGroups(id);
  const { interactions, addInteraction } = useInteractions(id);
  const { pendingCount } = useContactTasks(id);

  const contact = contacts.find((c) => c.id === id);

  const [activeTab, setActiveTab] = useState<TabKey>("infos");
  const [showInteractionSheet, setShowInteractionSheet] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  if (!contact) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: theme.textMuted }}>Contact introuvable.</Text>
      </SafeAreaView>
    );
  }

  const isClient = contact.status === "client";
  const statusColors = STATUS_COLORS[contact.status as StatusKey] ?? STATUS_COLORS.inactive;

  // Handlers existants — conserver tels quels
  const handleCall = () => { if (contact.phone) Linking.openURL(`tel:${contact.phone}`); };
  const handleWhatsApp = () => { if (contact.phone) { const c = contact.phone.replace(/\s/g, ""); Linking.openURL(`https://wa.me/${c}`); } };
  const handleEmail = () => { if (contact.email) Linking.openURL(`mailto:${contact.email}`); };
  const handleKitMessage = () => router.push(`/(app)/messages/${contact.id}`);

  const handleDelete = () => {
    Alert.alert("Supprimer", `Supprimer ${contact.full_name} ?`, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => { await deleteContact(contact.id); router.back(); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.textPrimary }}>
          {contact.full_name}
        </Text>
        <TouchableOpacity onPress={() => router.push(`/(app)/contacts/${id}/edit`)}>
          <Feather name="edit-2" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Ligne décorative */}
      <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />

      {/* Hero compact */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 18, paddingVertical: 14 }}>
        <Avatar name={contact.full_name} url={contact.avatar_url} status={contact.status} size="lg" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.5 }}>
            {contact.full_name}
          </Text>
          <View style={{ marginTop: 5 }}>
            <StatusPill status={contact.status} />
          </View>
        </View>

        {/* Boutons d'action */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {contact.phone && (
            <TouchableOpacity onPress={handleCall} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: theme.surface, borderWidth: 1, borderColor: `${theme.primary}30`, alignItems: "center", justifyContent: "center" }}>
              <Feather name="phone" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
          {contact.phone && (
            <TouchableOpacity onPress={handleWhatsApp} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: theme.surface, borderWidth: 1, borderColor: "rgba(34,197,94,0.25)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="message-circle" size={16} color="#22c55e" />
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity onPress={handleEmail} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: theme.surface, borderWidth: 1, borderColor: "rgba(129,140,248,0.25)", alignItems: "center", justifyContent: "center" }}>
              <Feather name="mail" size={16} color="#818cf8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleKitMessage} style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: theme.surface, borderWidth: 1, borderColor: `${theme.primary}30`, alignItems: "center", justifyContent: "center" }}>
            <Feather name="message-square" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Barre d'onglets */}
      <ContactTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showWorkflow={isClient}
        badges={{
          taches: pendingCount > 0 ? pendingCount : undefined,
          historique: interactions.length > 0 ? interactions.length : undefined,
        }}
      />

      {/* Contenu des onglets */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        {/* ─── ONGLET INFOS ─── */}
        {activeTab === "infos" && (
          <View style={{ gap: 10 }}>
            {/* Coordonnées */}
            <Card>
              {contact.phone && (
                <TouchableOpacity onPress={handleCall} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
                  <Feather name="phone" size={14} color={theme.textHint} />
                  <Text style={{ fontSize: 14, color: theme.textPrimary, flex: 1 }}>{contact.phone}</Text>
                  <Feather name="chevron-right" size={12} color={theme.textHint} />
                </TouchableOpacity>
              )}
              {contact.phone && contact.email && <View style={{ height: 1, backgroundColor: theme.border }} />}
              {contact.email && (
                <TouchableOpacity onPress={handleEmail} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
                  <Feather name="mail" size={14} color={theme.textHint} />
                  <Text style={{ fontSize: 14, color: theme.textPrimary, flex: 1 }}>{contact.email}</Text>
                  <Feather name="chevron-right" size={12} color={theme.textHint} />
                </TouchableOpacity>
              )}
            </Card>

            {/* Notes */}
            {contact.notes && (
              <Card>
                <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 8 }}>
                  Notes
                </Text>
                <Text style={{ fontSize: 14, color: theme.textMuted, lineHeight: 20 }}>{contact.notes}</Text>
              </Card>
            )}

            {/* Pipeline arc */}
            <Card>
              <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 10 }}>
                Pipeline
              </Text>
              <PipelineArc
                status={contact.status as PipelineStatus}
                onChange={async (newStatus) => {
                  await updateContact(contact.id, { status: newStatus });
                }}
              />
            </Card>

            {/* RDV + Supprimer */}
            <TouchableOpacity
              onPress={() => router.push(`/(app)/calendar/new?contactId=${contact.id}`)}
              style={{ backgroundColor: theme.primaryBg, borderWidth: 1, borderColor: theme.primaryBorder, borderRadius: 12, padding: 14, alignItems: "center" }}
            >
              <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>Prévoir un RDV</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: "#f87171" }}>Supprimer ce contact</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── ONGLET GROUPES ─── */}
        {activeTab === "groupes" && (
          <View style={{ gap: 10 }}>
            {/* Groupes */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>Groupes</Text>
              <TouchableOpacity onPress={() => setShowGroupPicker(true)} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.primaryBg, borderWidth: 1, borderColor: theme.primaryBorder, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Feather name="plus" size={12} color={theme.primary} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {contactGroups.length === 0 ? (
              <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
                <Card>
                  <Text style={{ fontSize: 13, color: theme.textHint, textAlign: "center", paddingVertical: 8 }}>
                    Aucun groupe — tap pour ajouter
                  </Text>
                </Card>
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 8 }}>
                {contactGroups.map((group) => (
                  <View key={group.id} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: theme.surface, borderWidth: 1, borderColor: `${group.color}25`, borderRadius: 14, padding: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${group.color}15`, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 18 }}>{group.emoji}</Text>
                      </View>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>{group.name}</Text>
                        {group.description && <Text style={{ fontSize: 11, color: theme.textMuted }}>{group.description}</Text>}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeFromGroup(group.id)}>
                      <Feather name="x" size={16} color={theme.textHint} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Tags */}
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 10 }}>
                Tags
              </Text>
              {/* Garder le composant tags existant ici */}
              <Card>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {(contact.tags ?? []).map((tag) => (
                    <View key={tag} style={{ backgroundColor: "rgba(129,140,248,0.1)", borderWidth: 1, borderColor: "rgba(129,140,248,0.2)", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 12, color: "#818cf8", fontWeight: "600" }}>{tag}</Text>
                    </View>
                  ))}
                  <TouchableOpacity style={{ backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="plus" size={11} color={theme.textHint} />
                    <Text style={{ fontSize: 12, color: theme.textHint }}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            </View>

            <GroupPicker
              visible={showGroupPicker}
              selectedGroups={contactGroups}
              onAdd={addToGroup}
              onRemove={removeFromGroup}
              onClose={() => setShowGroupPicker(false)}
            />
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
            {/* Date actuelle */}
            {contact.next_follow_up && (
              <Card style={{ backgroundColor: theme.primaryBg, borderColor: theme.primaryBorder }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Feather name="calendar" size={15} color={theme.primary} />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.primary }}>
                      {new Date(contact.next_follow_up).toLocaleDateString("fr-FR", {
                        weekday: "long", day: "numeric", month: "long",
                      })}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleFollowUpChange(null)}>
                    <Feather name="x" size={16} color={theme.textHint} />
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {/* FollowUpPicker existant */}
            <FollowUpPicker
              value={contact.next_follow_up}
              onChange={handleFollowUpChange}
            />
          </View>
        )}

        {/* ─── ONGLET HISTORIQUE ─── */}
        {activeTab === "historique" && (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>Interactions</Text>
              <TouchableOpacity
                onPress={() => setShowInteractionSheet(true)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: theme.primaryBg, borderWidth: 1, borderColor: theme.primaryBorder, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 }}
              >
                <Feather name="plus" size={12} color={theme.primary} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary }}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {interactions.length === 0 ? (
              <TouchableOpacity onPress={() => setShowInteractionSheet(true)}>
                <Card>
                  <Text style={{ fontSize: 13, color: theme.textHint, textAlign: "center", paddingVertical: 8 }}>
                    Aucune interaction — tap pour en ajouter
                  </Text>
                </Card>
              </TouchableOpacity>
            ) : (
              <Card>
                {interactions.map((item, index) => (
                  <View key={item.id}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 50, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}>
                        <Feather name={INTERACTION_ICONS[item.type as InteractionType] as any} size={14} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textPrimary }}>
                            {INTERACTION_LABELS[item.type as InteractionType]}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.textHint }}>
                            {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                          </Text>
                        </View>
                        {item.content && (
                          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3, lineHeight: 17 }}>{item.content}</Text>
                        )}
                      </View>
                    </View>
                    {index < interactions.length - 1 && <View style={{ height: 1, backgroundColor: theme.border }} />}
                  </View>
                ))}
              </Card>
            )}

            <AddInteractionSheet
              visible={showInteractionSheet}
              onClose={() => setShowInteractionSheet(false)}
              onAdd={(type, content) => addInteraction(id, type, content)}
            />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 3. Exporter ContactTabBar

Ajouter dans `components/contacts/index.ts` :

```ts
export { ContactTabBar } from "./ContactTabBar";
```

---

## Critères de validation

- [ ] Le hero (avatar + nom + statut + boutons) est toujours visible
- [ ] Les 6 onglets s'affichent dans l'ordre : Infos, Groupes, Tâches, Workflow, Relance, Historique
- [ ] L'onglet Workflow n'apparaît que si le contact est "Client"
- [ ] Le badge sur Tâches affiche le nombre de tâches en attente
- [ ] Le badge sur Historique affiche le nombre d'interactions
- [ ] Chaque onglet affiche le bon contenu
- [ ] La barre d'onglets est scrollable horizontalement
- [ ] Aucune régression fonctionnelle sur les handlers existants
- [ ] Aucune erreur TypeScript
