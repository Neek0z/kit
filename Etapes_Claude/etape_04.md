# KIT — etape_04 : Pipeline de suivi + Historique + Dashboard

## Contexte

Gestion des contacts fonctionnelle (etape_03 validée).
On construit maintenant la couche de suivi : historique des interactions par contact,
pipeline de relance, et un Dashboard qui donne une vue d'ensemble actionnable.

---

## Ce que tu dois faire

### 1. Table Supabase — interactions

Dans Supabase → SQL Editor :

```sql
-- Table interactions
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  type text not null, -- 'call' | 'message' | 'email' | 'meeting' | 'note'
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index
create index interactions_contact_id_idx on public.interactions(contact_id);
create index interactions_user_id_idx on public.interactions(user_id);

-- RLS
alter table public.interactions enable row level security;

create policy "Users can manage own interactions"
  on public.interactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

Mettre à jour aussi la table contacts pour ajouter le champ `last_interaction_at` :

```sql
alter table public.contacts
  add column if not exists last_interaction_at timestamp with time zone;
```

---

### 2. Mettre à jour les types

Mettre à jour `types/index.ts` — ajouter :

```ts
export type InteractionType = "call" | "message" | "email" | "meeting" | "note";

export const INTERACTION_LABELS: Record<InteractionType, string> = {
  call: "Appel",
  message: "Message",
  email: "Email",
  meeting: "Rencontre",
  note: "Note",
};

export const INTERACTION_ICONS: Record<InteractionType, string> = {
  call: "phone",
  message: "message-circle",
  email: "mail",
  meeting: "users",
  note: "file-text",
};

export interface Interaction {
  id: string;
  user_id: string;
  contact_id: string;
  type: InteractionType;
  content?: string;
  created_at: string;
}

// Mettre à jour Contact pour inclure last_interaction_at
export interface Contact {
  id: ContactId;
  user_id: UserId;
  full_name: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: PipelineStatus;
  next_follow_up?: string;
  last_interaction_at?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}
```

---

### 3. Hook useInteractions

Créer `hooks/useInteractions.ts` :

```ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Interaction, InteractionType } from "../types";
import { useAuthContext } from "../lib/AuthContext";

interface UseInteractionsReturn {
  interactions: Interaction[];
  loading: boolean;
  addInteraction: (contactId: string, type: InteractionType, content?: string) => Promise<boolean>;
  deleteInteraction: (id: string) => Promise<boolean>;
}

export function useInteractions(contactId: string): UseInteractionsReturn {
  const { user } = useAuthContext();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("interactions")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    setInteractions(data ?? []);
    setLoading(false);
  }, [contactId, user]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const addInteraction = async (
    contactId: string,
    type: InteractionType,
    content?: string
  ): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from("interactions")
      .insert({ contact_id: contactId, user_id: user.id, type, content })
      .select()
      .single();

    if (error) return false;

    setInteractions((prev) => [data, ...prev]);

    // Mettre à jour last_interaction_at sur le contact
    await supabase
      .from("contacts")
      .update({ last_interaction_at: new Date().toISOString() })
      .eq("id", contactId);

    return true;
  };

  const deleteInteraction = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("interactions")
      .delete()
      .eq("id", id);

    if (error) return false;
    setInteractions((prev) => prev.filter((i) => i.id !== id));
    return true;
  };

  return { interactions, loading, addInteraction, deleteInteraction };
}
```

---

### 4. Hook useDashboard

Créer `hooks/useDashboard.ts` :

```ts
import { useMemo } from "react";
import { useContacts } from "./useContacts";
import { Contact, PipelineStatus } from "../types";

interface DashboardStats {
  totalContacts: number;
  toFollowUp: Contact[];
  byStatus: Record<PipelineStatus, number>;
  recentContacts: Contact[];
  overdueFollowUps: Contact[];
}

export function useDashboard(): DashboardStats & { loading: boolean } {
  const { contacts, loading } = useContacts();

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const toFollowUp = contacts.filter((c) => {
      if (!c.next_follow_up) return false;
      return new Date(c.next_follow_up) <= now;
    });

    const overdueFollowUps = contacts.filter((c) => {
      if (!c.next_follow_up) return false;
      return new Date(c.next_follow_up) < today;
    });

    const byStatus = contacts.reduce((acc, c) => {
      const s = c.status as PipelineStatus;
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {} as Record<PipelineStatus, number>);

    const recentContacts = [...contacts]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);

    return {
      totalContacts: contacts.length,
      toFollowUp,
      byStatus,
      recentContacts,
      overdueFollowUps,
    };
  }, [contacts]);

  return { ...stats, loading };
}
```

---

### 5. Composant AddInteractionSheet

Créer `components/contacts/AddInteractionSheet.tsx` :

```tsx
import { useState } from "react";
import { View, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text, Button } from "../ui";
import { InteractionType, INTERACTION_LABELS, INTERACTION_ICONS } from "../../types";

const TYPES: InteractionType[] = ["call", "message", "email", "meeting", "note"];

interface AddInteractionSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (type: InteractionType, content?: string) => Promise<void>;
}

export function AddInteractionSheet({ visible, onClose, onAdd }: AddInteractionSheetProps) {
  const [selectedType, setSelectedType] = useState<InteractionType>("call");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    setLoading(true);
    await onAdd(selectedType, content.trim() || undefined);
    setContent("");
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <View className="bg-surface rounded-t-3xl p-6 gap-5"
          style={{ shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 20 }}
        >
          {/* Handle */}
          <View className="w-10 h-1 rounded-full bg-border self-center -mt-1 mb-1" />

          <Text variant="h3">Ajouter une interaction</Text>

          {/* Type selector */}
          <View className="flex-row gap-2 flex-wrap">
            {TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSelectedType(type)}
                className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
                  selectedType === type
                    ? "bg-primary/10 border-primary"
                    : "bg-background border-border"
                }`}
              >
                <Feather
                  name={INTERACTION_ICONS[type] as any}
                  size={14}
                  color={selectedType === type ? "#6ee7b7" : "#475569"}
                />
                <Text className={`text-sm ${selectedType === type ? "text-primary font-semibold" : "text-textMuted"}`}>
                  {INTERACTION_LABELS[type]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note optionnelle */}
          <TextInput
            className="bg-background border border-border rounded-xl px-4 py-3 text-textMain text-sm h-20"
            placeholder="Note optionnelle..."
            placeholderTextColor="#475569"
            value={content}
            onChangeText={setContent}
            multiline
          />

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 py-4 items-center border border-border rounded-xl"
            >
              <Text variant="muted">Annuler</Text>
            </TouchableOpacity>
            <View className="flex-1">
              <Button label="Enregistrer" onPress={handleAdd} loading={loading} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
```

---

### 6. Mettre à jour la fiche contact — onglet historique

Mettre à jour `app/(app)/contacts/[id].tsx` pour ajouter l'historique sous les infos :

Ajouter en haut du fichier :

```tsx
import { useInteractions } from "../../../hooks/useInteractions";
import { AddInteractionSheet } from "../../../components/contacts/AddInteractionSheet";
import { INTERACTION_LABELS, INTERACTION_ICONS, InteractionType } from "../../../types";
```

Ajouter dans le composant :

```tsx
const { interactions, addInteraction } = useInteractions(id);
const [showSheet, setShowSheet] = useState(false);
```

Ajouter dans le JSX, avant le bouton Supprimer :

```tsx
{/* Bouton ajout interaction */}
<Button
  label="+ Ajouter une interaction"
  onPress={() => setShowSheet(true)}
  variant="secondary"
/>

{/* Historique */}
{interactions.length > 0 && (
  <Card>
    <Text variant="muted" className="text-xs mb-3 uppercase tracking-wider">
      Historique
    </Text>
    <View className="gap-3">
      {interactions.map((item, index) => (
        <View key={item.id}>
          <View className="flex-row items-start gap-3">
            <View className="w-8 h-8 rounded-full bg-surface border border-border items-center justify-center mt-0.5">
              <Feather
                name={INTERACTION_ICONS[item.type as InteractionType] as any}
                size={14}
                color="#6ee7b7"
              />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold">
                  {INTERACTION_LABELS[item.type as InteractionType]}
                </Text>
                <Text variant="muted" className="text-xs">
                  {new Date(item.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </Text>
              </View>
              {item.content && (
                <Text variant="muted" className="text-sm mt-0.5 leading-relaxed">
                  {item.content}
                </Text>
              )}
            </View>
          </View>
          {index < interactions.length - 1 && <View className="h-px bg-border ml-11 mt-3" />}
        </View>
      ))}
    </View>
  </Card>
)}

{/* Sheet */}
<AddInteractionSheet
  visible={showSheet}
  onClose={() => setShowSheet(false)}
  onAdd={(type, content) => addInteraction(id, type, content)}
/>
```

---

### 7. Composant PipelineBar

Créer `components/dashboard/PipelineBar.tsx` :

```tsx
import { View } from "react-native";
import { Text } from "../ui";
import { PipelineStatus, PIPELINE_LABELS } from "../../types";

const STATUS_COLORS: Record<PipelineStatus, string> = {
  new: "#475569",
  contacted: "#818cf8",
  interested: "#fbbf24",
  follow_up: "#f87171",
  client: "#6ee7b7",
  inactive: "#1e293b",
};

interface PipelineBarProps {
  byStatus: Partial<Record<PipelineStatus, number>>;
  total: number;
}

const ORDERED: PipelineStatus[] = ["new", "contacted", "interested", "follow_up", "client"];

export function PipelineBar({ byStatus, total }: PipelineBarProps) {
  if (total === 0) return null;

  return (
    <View className="gap-3">
      {/* Barre de progression */}
      <View className="flex-row h-2 rounded-full overflow-hidden bg-border">
        {ORDERED.map((status) => {
          const count = byStatus[status] ?? 0;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <View
              key={status}
              style={{ flex: pct, backgroundColor: STATUS_COLORS[status] }}
            />
          );
        })}
      </View>

      {/* Légende */}
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        {ORDERED.map((status) => {
          const count = byStatus[status] ?? 0;
          if (count === 0) return null;
          return (
            <View key={status} className="flex-row items-center gap-1.5">
              <View
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              <Text variant="muted" className="text-xs">
                {PIPELINE_LABELS[status]} ({count})
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
```

---

### 8. Dashboard complet

Remplacer `app/(app)/index.tsx` :

```tsx
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, Card, EmptyState } from "../../components/ui";
import { ContactCard } from "../../components/contacts";
import { PipelineBar } from "../../components/dashboard/PipelineBar";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";

export default function DashboardScreen() {
  const { user } = useAuthContext();
  const { totalContacts, toFollowUp, byStatus, recentContacts, overdueFollowUps, loading } = useDashboard();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6ee7b7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="pt-6 pb-5 flex-row items-start justify-between">
          <View>
            <Text variant="muted">Bonjour {firstName} 👋</Text>
            <Text variant="h1" className="mt-1">Dashboard</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(app)/contacts/new")}
            className="bg-primary w-10 h-10 rounded-full items-center justify-center mt-1"
          >
            <Feather name="plus" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Alertes relances en retard */}
        {overdueFollowUps.length > 0 && (
          <TouchableOpacity
            onPress={() => router.push("/(app)/contacts")}
            className="bg-danger/10 border border-danger/30 rounded-2xl p-4 mb-4 flex-row items-center gap-3"
          >
            <Feather name="alert-circle" size={18} color="#f87171" />
            <Text className="text-danger text-sm font-semibold flex-1">
              {overdueFollowUps.length} relance{overdueFollowUps.length > 1 ? "s" : ""} en retard
            </Text>
            <Feather name="chevron-right" size={16} color="#f87171" />
          </TouchableOpacity>
        )}

        {/* Stats rapides */}
        <View className="flex-row gap-3 mb-4">
          <Card className="flex-1">
            <Text variant="muted" className="text-xs mb-1">Contacts</Text>
            <Text variant="h2" className="text-primary">{totalContacts}</Text>
          </Card>
          <Card className="flex-1">
            <Text variant="muted" className="text-xs mb-1">À relancer</Text>
            <Text variant="h2" className={toFollowUp.length > 0 ? "text-yellow-400" : "text-textMain"}>
              {toFollowUp.length}
            </Text>
          </Card>
          <Card className="flex-1">
            <Text variant="muted" className="text-xs mb-1">Clients</Text>
            <Text variant="h2" className="text-primary">{byStatus.client ?? 0}</Text>
          </Card>
        </View>

        {/* Pipeline */}
        {totalContacts > 0 && (
          <Card className="mb-4">
            <Text variant="muted" className="text-xs mb-3 uppercase tracking-wider">Pipeline</Text>
            <PipelineBar byStatus={byStatus} total={totalContacts} />
          </Card>
        )}

        {/* À relancer aujourd'hui */}
        {toFollowUp.length > 0 && (
          <View className="mb-4">
            <Text variant="h3" className="mb-3">À relancer</Text>
            <Card padding="sm">
              {toFollowUp.slice(0, 5).map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
              {toFollowUp.length > 5 && (
                <TouchableOpacity
                  onPress={() => router.push("/(app)/contacts")}
                  className="py-3 items-center"
                >
                  <Text className="text-primary text-sm">
                    Voir les {toFollowUp.length - 5} autres →
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          </View>
        )}

        {/* Contacts récents */}
        {recentContacts.length > 0 && (
          <View className="mb-8">
            <Text variant="h3" className="mb-3">Récents</Text>
            <Card padding="sm">
              {recentContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </Card>
          </View>
        )}

        {/* Etat vide */}
        {totalContacts === 0 && (
          <EmptyState
            icon="🤝"
            title="Commence par ajouter un contact"
            description="KIT t'aide à ne plus jamais oublier de relancer quelqu'un."
            actionLabel="Ajouter un contact"
            onAction={() => router.push("/(app)/contacts/new")}
          />
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 9. Écran Activité

Remplacer `app/(app)/activity.tsx` :

```tsx
import { View, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Card, EmptyState } from "../../components/ui";
import { useAuthContext } from "../../lib/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Interaction, InteractionType, INTERACTION_LABELS, INTERACTION_ICONS } from "../../types";

interface InteractionWithContact extends Interaction {
  contacts: { full_name: string };
}

export default function ActivityScreen() {
  const { user } = useAuthContext();
  const [items, setItems] = useState<InteractionWithContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("interactions")
      .select("*, contacts(full_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setItems((data as InteractionWithContact[]) ?? []);
        setLoading(false);
      });
  }, [user]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-6 pb-3">
        <Text variant="h1">Activité</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6ee7b7" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="📋"
              title="Aucune activité"
              description="Tes interactions avec tes contacts apparaîtront ici."
            />
          }
          renderItem={({ item }) => (
            <View className="flex-row items-start gap-3 py-3 border-b border-border">
              <View className="w-9 h-9 rounded-full bg-surface border border-border items-center justify-center mt-0.5">
                <Feather
                  name={INTERACTION_ICONS[item.type as InteractionType] as any}
                  size={15}
                  color="#6ee7b7"
                />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold">
                    {item.contacts?.full_name}
                  </Text>
                  <Text variant="muted" className="text-xs">
                    {new Date(item.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Text>
                </View>
                <Text variant="muted" className="text-xs mt-0.5">
                  {INTERACTION_LABELS[item.type as InteractionType]}
                  {item.content ? ` · ${item.content}` : ""}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
```

---

## Critères de validation

Avant de passer à etape_05, vérifier que :

- [ ] Le Dashboard affiche les stats (total, à relancer, clients)
- [ ] La barre pipeline s'affiche proportionnellement aux statuts
- [ ] L'alerte rouge apparaît si des relances sont en retard
- [ ] Sur la fiche contact, le bouton "+ Interaction" ouvre le sheet
- [ ] Après ajout d'une interaction, elle apparaît dans l'historique
- [ ] L'écran Activité liste toutes les interactions avec le nom du contact
- [ ] `last_interaction_at` se met à jour dans Supabase après une interaction
- [ ] Aucune erreur TypeScript

---

## Ce qu'on ne fait PAS dans cette étape

- Pas de notifications push (etape_05)
- Pas de Stripe (etape_06)
- Pas de widget (etape_07)
- La date de relance `next_follow_up` est visible mais pas encore planifiable via rappel

---

## Prochaine étape

`etape_05` — Notifications push + rappels de relance planifiés
