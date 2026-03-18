# KIT — Groupes de contacts & Groupes de messages

## Contexte

App fonctionnelle avec redesign visuel en cours.
On ajoute les groupes : organiser ses contacts en équipes MLM + conversations de groupe dans les messages.
Un contact peut appartenir à plusieurs groupes. Les groupes de contacts sont orientés MLM.

---

## Architecture

```
groups
  ├── id, name, color, emoji, type, owner_id
  └── type: "contact" | "message"

contact_group_members
  ├── group_id → groups
  └── contact_id → contacts

message_group_members
  ├── group_id → groups
  └── user_id → auth.users

conversations (table existante messages)
  └── group_id (nullable) — null = conversation 1:1
```

---

## PARTIE 1 — Supabase

### Tables à créer

```sql
-- Groupes (contacts ET messages)
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  color text default '#6ee7b7' not null,
  emoji text default '👥' not null,
  type text not null check (type in ('contact', 'message')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Membres des groupes de contacts
create table public.contact_group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, contact_id)
);

-- Membres des groupes de messages
create table public.message_group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- Index
create index groups_owner_id_idx on public.groups(owner_id);
create index contact_group_members_group_id_idx on public.contact_group_members(group_id);
create index contact_group_members_contact_id_idx on public.contact_group_members(contact_id);
create index message_group_members_group_id_idx on public.message_group_members(group_id);
create index message_group_members_user_id_idx on public.message_group_members(user_id);

-- RLS
alter table public.groups enable row level security;
alter table public.contact_group_members enable row level security;
alter table public.message_group_members enable row level security;

-- Policies groupes
create policy "Users can manage own groups"
  on public.groups for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Members can view message groups they belong to"
  on public.groups for select
  using (
    type = 'message' and exists (
      select 1 from public.message_group_members
      where group_id = groups.id and user_id = auth.uid()
    )
  );

-- Policies membres contacts
create policy "Users can manage own contact group members"
  on public.contact_group_members for all
  using (
    exists (
      select 1 from public.groups
      where id = contact_group_members.group_id and owner_id = auth.uid()
    )
  );

-- Policies membres messages
create policy "Users can view message group members"
  on public.message_group_members for select
  using (
    exists (
      select 1 from public.message_group_members mgm
      where mgm.group_id = message_group_members.group_id
      and mgm.user_id = auth.uid()
    )
  );

create policy "Group owner can manage message group members"
  on public.message_group_members for all
  using (
    exists (
      select 1 from public.groups
      where id = message_group_members.group_id and owner_id = auth.uid()
    )
  );

-- Trigger updated_at
create trigger groups_updated_at
  before update on public.groups
  for each row execute procedure public.handle_updated_at();
```

### Groupes MLM par défaut

```sql
-- Créer les groupes MLM par défaut pour les utilisateurs existants
-- Remplace par ton user_id
insert into public.groups (owner_id, name, description, color, emoji, type)
values
  ('<user_id>', 'Mon équipe', 'Mes filleuls directs et équipe MLM', '#6ee7b7', '🤝', 'contact'),
  ('<user_id>', 'Prospects chauds', 'Contacts très intéressés à suivre', '#fbbf24', '🔥', 'contact'),
  ('<user_id>', 'Clients VIP', 'Mes meilleurs clients', '#818cf8', '⭐', 'contact'),
  ('<user_id>', 'À former', 'Nouveaux membres à accompagner', '#f87171', '📚', 'contact');
```

### Ajouter group_id aux conversations existantes

```sql
-- Si tu as une table conversations pour les messages
alter table public.conversations
  add column if not exists group_id uuid references public.groups on delete set null;

create index conversations_group_id_idx on public.conversations(group_id);
```

---

## PARTIE 2 — Types

Ajouter dans `types/index.ts` :

```ts
export type GroupType = "contact" | "message";

export interface Group {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  color: string;
  emoji: string;
  type: GroupType;
  created_at: string;
  updated_at: string;
  // Enrichi côté frontend
  member_count?: number;
}

export interface ContactGroupMember {
  id: string;
  group_id: string;
  contact_id: string;
  added_at: string;
}

export interface MessageGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
}

// Groupes MLM prédéfinis (suggestions)
export const MLM_GROUP_PRESETS = [
  { name: "Mon équipe",      emoji: "🤝", color: "#6ee7b7", description: "Mes filleuls directs" },
  { name: "Prospects chauds",emoji: "🔥", color: "#fbbf24", description: "Très intéressés" },
  { name: "Clients VIP",     emoji: "⭐", color: "#818cf8", description: "Meilleurs clients" },
  { name: "À former",        emoji: "📚", color: "#f87171", description: "Nouveaux à accompagner" },
] as const;
```

---

## PARTIE 3 — Hook useGroups

Créer `hooks/useGroups.ts` :

```ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import { Group, GroupType } from "../types";

interface CreateGroupInput {
  name: string;
  description?: string;
  color: string;
  emoji: string;
  type: GroupType;
}

export function useGroups(type?: GroupType) {
  const { user } = useAuthContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("groups")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (type) query = query.eq("type", type);

    const { data } = await query;
    setGroups(data ?? []);
    setLoading(false);
  }, [user, type]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const createGroup = async (input: CreateGroupInput): Promise<Group | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("groups")
      .insert({ ...input, owner_id: user.id })
      .select()
      .single();
    if (error) return null;
    setGroups((prev) => [...prev, data]);
    return data;
  };

  const updateGroup = async (id: string, input: Partial<CreateGroupInput>): Promise<boolean> => {
    const { error } = await supabase.from("groups").update(input).eq("id", id);
    if (error) return false;
    setGroups((prev) => prev.map((g) => g.id === id ? { ...g, ...input } : g));
    return true;
  };

  const deleteGroup = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) return false;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    return true;
  };

  return { groups, loading, refetch: fetchGroups, createGroup, updateGroup, deleteGroup };
}
```

---

## PARTIE 4 — Hook useContactGroups

Créer `hooks/useContactGroups.ts` :

```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Group } from "../types";

export function useContactGroups(contactId: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("contact_group_members")
      .select("group_id, groups(*)")
      .eq("contact_id", contactId)
      .then(({ data }) => {
        setGroups((data ?? []).map((d: any) => d.groups).filter(Boolean));
        setLoading(false);
      });
  }, [contactId]);

  const addToGroup = async (groupId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("contact_group_members")
      .insert({ group_id: groupId, contact_id: contactId });
    if (error) return false;
    const { data } = await supabase.from("groups").select("*").eq("id", groupId).single();
    if (data) setGroups((prev) => [...prev, data]);
    return true;
  };

  const removeFromGroup = async (groupId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("contact_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("contact_id", contactId);
    if (error) return false;
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return true;
  };

  return { groups, loading, addToGroup, removeFromGroup };
}
```

---

## PARTIE 5 — Composants groupes de contacts

### Composant GroupBadge

Créer `components/groups/GroupBadge.tsx` :

```tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Group } from "../../types";

interface GroupBadgeProps {
  group: Group;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function GroupBadge({ group, onRemove, size = "md" }: GroupBadgeProps) {
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 5,
      backgroundColor: `${group.color}18`,
      borderWidth: 1, borderColor: `${group.color}35`,
      borderRadius: 100,
      paddingHorizontal: size === "sm" ? 8 : 10,
      paddingVertical: size === "sm" ? 3 : 4,
      alignSelf: "flex-start",
    }}>
      <Text style={{ fontSize: size === "sm" ? 10 : 11 }}>{group.emoji}</Text>
      <Text style={{
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: "600",
        color: group.color,
      }}>
        {group.name}
      </Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={{ marginLeft: 2 }}>
          <Text style={{ fontSize: 11, color: group.color, opacity: 0.7 }}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

---

### Composant GroupPicker (sheet de sélection)

Créer `components/groups/GroupPicker.tsx` :

```tsx
import { useState } from "react";
import { View, Modal, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Text, Button } from "../ui";
import { GroupBadge } from "./GroupBadge";
import { useGroups } from "../../hooks/useGroups";
import { Group, MLM_GROUP_PRESETS } from "../../types";
import { useTheme } from "../../lib/theme";

const COLORS = ["#6ee7b7", "#fbbf24", "#818cf8", "#f87171", "#22c55e", "#38bdf8", "#e879f9", "#fb923c"];
const EMOJIS = ["👥", "🔥", "⭐", "📚", "💼", "🎯", "💡", "🏆", "🤝", "📞"];

interface GroupPickerProps {
  visible: boolean;
  selectedGroups: Group[];
  onAdd: (groupId: string) => void;
  onRemove: (groupId: string) => void;
  onClose: () => void;
}

export function GroupPicker({ visible, selectedGroups, onAdd, onRemove, onClose }: GroupPickerProps) {
  const theme = useTheme();
  const { groups, createGroup } = useGroups("contact");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newEmoji, setNewEmoji] = useState(EMOJIS[0]);

  const selectedIds = new Set(selectedGroups.map((g) => g.id));

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createGroup({ name: newName.trim(), color: newColor, emoji: newEmoji, type: "contact" });
    setNewName("");
    setCreating(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
        <View style={{
          backgroundColor: theme.surface,
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: 20, maxHeight: "80%",
        }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: "center", marginBottom: 16 }} />

          <Text variant="h3" style={{ marginBottom: 16 }}>Groupes</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Groupes existants */}
            <View style={{ gap: 8, marginBottom: 16 }}>
              {groups.map((group) => {
                const isSelected = selectedIds.has(group.id);
                return (
                  <TouchableOpacity
                    key={group.id}
                    onPress={() => isSelected ? onRemove(group.id) : onAdd(group.id)}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      padding: 12, borderRadius: 14,
                      backgroundColor: isSelected ? `${group.color}12` : theme.bg,
                      borderWidth: 1,
                      borderColor: isSelected ? `${group.color}35` : theme.border,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ fontSize: 20 }}>{group.emoji}</Text>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>{group.name}</Text>
                        {group.description && (
                          <Text style={{ fontSize: 11, color: theme.textMuted }}>{group.description}</Text>
                        )}
                      </View>
                    </View>
                    {isSelected && (
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: group.color,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Text style={{ color: "#0f172a", fontSize: 13, fontWeight: "800" }}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Créer un nouveau groupe */}
            {!creating ? (
              <TouchableOpacity
                onPress={() => setCreating(true)}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 10,
                  padding: 12, borderRadius: 14,
                  borderWidth: 1, borderColor: theme.border,
                  borderStyle: "dashed",
                }}
              >
                <Text style={{ fontSize: 20 }}>+</Text>
                <Text style={{ fontSize: 14, color: theme.textMuted }}>Créer un groupe</Text>
              </TouchableOpacity>
            ) : (
              <View style={{
                padding: 14, borderRadius: 14,
                backgroundColor: theme.bg,
                borderWidth: 1, borderColor: theme.border,
                gap: 12,
              }}>
                {/* Emoji picker */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {EMOJIS.map((e) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setNewEmoji(e)}
                      style={{
                        width: 36, height: 36, borderRadius: 10,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: newEmoji === e ? `${newColor}20` : "transparent",
                        borderWidth: newEmoji === e ? 1 : 0,
                        borderColor: newColor,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Nom */}
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nom du groupe..."
                  placeholderTextColor={theme.textHint}
                  style={{
                    backgroundColor: theme.surface,
                    borderWidth: 1, borderColor: theme.border,
                    borderRadius: 10, padding: 10,
                    fontSize: 14, color: theme.textPrimary,
                  }}
                />

                {/* Couleur picker */}
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setNewColor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: 14,
                        backgroundColor: c,
                        borderWidth: newColor === c ? 2 : 0,
                        borderColor: "#fff",
                      }}
                    />
                  ))}
                </View>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setCreating(false)}
                    style={{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}
                  >
                    <Text style={{ color: theme.textMuted, fontSize: 13 }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCreate}
                    style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: `${newColor}20`, borderWidth: 1, borderColor: `${newColor}40`, alignItems: "center" }}
                  >
                    <Text style={{ color: newColor, fontSize: 13, fontWeight: "600" }}>Créer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Suggestions MLM si aucun groupe */}
            {groups.length === 0 && !creating && (
              <View style={{ marginTop: 16 }}>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Suggestions MLM
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {MLM_GROUP_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      onPress={() => createGroup({ ...preset, type: "contact" })}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: 100,
                        backgroundColor: `${preset.color}15`,
                        borderWidth: 1, borderColor: `${preset.color}30`,
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{preset.emoji}</Text>
                      <Text style={{ fontSize: 12, color: preset.color, fontWeight: "500" }}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 16, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: theme.border, alignItems: "center" }}>
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
```

---

## PARTIE 6 — Intégrer dans la fiche contact

Dans `app/(app)/contacts/[id].tsx`, ajouter :

```tsx
import { useContactGroups } from "../../../hooks/useContactGroups";
import { GroupBadge } from "../../../components/groups/GroupBadge";
import { GroupPicker } from "../../../components/groups/GroupPicker";

// Dans le composant
const { groups: contactGroups, addToGroup, removeFromGroup } = useContactGroups(id);
const [showGroupPicker, setShowGroupPicker] = useState(false);

// Dans le JSX — section Groupes (après les infos, avant les notes)
<Card>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <Text style={{ fontSize: 11, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
      Groupes
    </Text>
    <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
      <Text style={{ fontSize: 12, color: theme.primary }}>+ Ajouter</Text>
    </TouchableOpacity>
  </View>
  {contactGroups.length === 0 ? (
    <TouchableOpacity onPress={() => setShowGroupPicker(true)}>
      <Text style={{ fontSize: 13, color: theme.textMuted }}>Aucun groupe — tap pour ajouter</Text>
    </TouchableOpacity>
  ) : (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {contactGroups.map((group) => (
        <GroupBadge
          key={group.id}
          group={group}
          onRemove={() => removeFromGroup(group.id)}
        />
      ))}
    </View>
  )}
</Card>

<GroupPicker
  visible={showGroupPicker}
  selectedGroups={contactGroups}
  onAdd={addToGroup}
  onRemove={removeFromGroup}
  onClose={() => setShowGroupPicker(false)}
/>
```

---

## PARTIE 7 — Filtre par groupe dans la liste contacts

Dans `app/(app)/contacts.tsx`, ajouter le filtre groupe après les filtres de statut :

```tsx
import { useGroups } from "../../hooks/useGroups";
import { GroupBadge } from "../../components/groups/GroupBadge";

const { groups } = useGroups("contact");
const [activeGroup, setActiveGroup] = useState<string | null>(null);

// Filtre dans useMemo — ajouter la condition groupe
const filtered = useMemo(() => {
  return contacts.filter((c) => {
    const matchSearch = /* ... existing ... */;
    const matchFilter = /* ... existing status filter ... */;
    const matchGroup = !activeGroup || contactGroupMap[c.id]?.includes(activeGroup);
    return matchSearch && matchFilter && matchGroup;
  });
}, [contacts, search, activeFilter, activeGroup, contactGroupMap]);

// Ajouter une FlatList horizontale de groupes sous les filtres de statut
{groups.length > 0 && (
  <FlatList
    horizontal
    data={groups}
    keyExtractor={(g) => g.id}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 8 }}
    renderItem={({ item }) => (
      <TouchableOpacity onPress={() => setActiveGroup(activeGroup === item.id ? null : item.id)}>
        <GroupBadge
          group={item}
          size="sm"
          style={{ opacity: activeGroup && activeGroup !== item.id ? 0.5 : 1 }}
        />
      </TouchableOpacity>
    )}
  />
)}
```

---

## PARTIE 8 — Écran de gestion des groupes

Créer `app/(app)/groups/index.tsx` :

```tsx
import { useState } from "react";
import { View, FlatList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text, EmptyState } from "../../components/ui";
import { Header } from "../../components/layout";
import { GroupBadge } from "../../components/groups/GroupBadge";
import { useGroups } from "../../hooks/useGroups";
import { useTheme } from "../../lib/theme";
import { Group } from "../../types";

export default function GroupsScreen() {
  const theme = useTheme();
  const { groups, deleteGroup } = useGroups("contact");

  const handleDelete = (group: Group) => {
    Alert.alert(
      "Supprimer le groupe",
      `Supprimer "${group.name}" ? Les contacts ne seront pas supprimés.`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteGroup(group.id) },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header
        title="Mes groupes"
        showBack
        rightAction={{ icon: "plus", onPress: () => router.push("/(app)/groups/new") }}
      />

      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        ListEmptyComponent={
          <EmptyState
            icon="👥"
            title="Aucun groupe"
            description="Crée des groupes pour organiser tes contacts MLM."
            actionLabel="Créer un groupe"
            onAction={() => router.push("/(app)/groups/new")}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/groups/${item.id}`)}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              padding: 14, borderRadius: 16,
              backgroundColor: theme.surface,
              borderWidth: 1, borderColor: `${item.color}25`,
            }}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: `${item.color}15`,
              alignItems: "center", justifyContent: "center",
            }}>
              <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>{item.name}</Text>
              {item.description && (
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{item.description}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 16, color: theme.textHint }}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
```

Ajouter le lien depuis le Profil dans `app/(app)/profile.tsx` :

```tsx
<TouchableOpacity
  onPress={() => router.push("/(app)/groups")}
  className="flex-row items-center gap-3 py-3 px-1"
>
  <Text style={{ fontSize: 18 }}>👥</Text>
  <Text className="flex-1 text-sm">Mes groupes</Text>
  <Feather name="chevron-right" size={16} color="#475569" />
</TouchableOpacity>
```

---

## PARTIE 9 — Groupes de messages

Dans la table `conversations` existante, le champ `group_id` lie une conversation à un groupe de messages.

Créer `hooks/useMessageGroups.ts` :

```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import { Group } from "../types";

export function useMessageGroups() {
  const { user } = useAuthContext();
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!user) return;

    // Groupes dont je suis owner
    const fetchOwned = supabase
      .from("groups")
      .select("*")
      .eq("owner_id", user.id)
      .eq("type", "message");

    // Groupes dont je suis membre
    const fetchMember = supabase
      .from("message_group_members")
      .select("group_id, groups(*)")
      .eq("user_id", user.id);

    Promise.all([fetchOwned, fetchMember]).then(([owned, member]) => {
      const ownedGroups = owned.data ?? [];
      const memberGroups = (member.data ?? []).map((m: any) => m.groups).filter(Boolean);
      const all = [...ownedGroups, ...memberGroups];
      // Dédupliquer par id
      const unique = all.filter((g, i, arr) => arr.findIndex((x) => x.id === g.id) === i);
      setGroups(unique);
    });
  }, [user]);

  const createMessageGroup = async (name: string, emoji: string, color: string, memberUserIds: string[]): Promise<Group | null> => {
    if (!user) return null;

    const { data: group, error } = await supabase
      .from("groups")
      .insert({ name, emoji, color, type: "message", owner_id: user.id })
      .select()
      .single();

    if (error || !group) return null;

    // Ajouter les membres (incluant l'owner)
    const members = [...new Set([user.id, ...memberUserIds])].map((uid) => ({
      group_id: group.id,
      user_id: uid,
    }));

    await supabase.from("message_group_members").insert(members);

    // Créer la conversation de groupe
    await supabase.from("conversations").insert({
      group_id: group.id,
      created_by: user.id,
    });

    setGroups((prev) => [...prev, group]);
    return group;
  };

  return { groups, createMessageGroup };
}
```

Dans l'écran Messages existant, adapter pour afficher les conversations de groupe distinctement :

```tsx
// Dans la liste des conversations, distinguer 1:1 et groupe
// Si conversation.group_id → c'est un groupe → afficher l'emoji + nom du groupe
// Sinon → conversation 1:1 classique

const isGroupConversation = !!conversation.group_id;

// Rendu différent pour les groupes
{isGroupConversation ? (
  <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: `${group.color}15`, alignItems: "center", justifyContent: "center" }}>
    <Text style={{ fontSize: 20 }}>{group.emoji}</Text>
  </View>
) : (
  <Avatar name={otherUser.name} size="md" />
)}
```

---

## Critères de validation

- [ ] Créer un groupe de contacts fonctionne (via fiche contact ou écran groupes)
- [ ] Les suggestions MLM s'affichent quand aucun groupe n'existe
- [ ] Assigner un contact à plusieurs groupes fonctionne
- [ ] Retirer un contact d'un groupe fonctionne
- [ ] Les badges de groupe s'affichent sur la fiche contact
- [ ] Le filtre par groupe fonctionne dans la liste contacts
- [ ] L'écran "Mes groupes" liste tous les groupes avec possibilité de supprimer
- [ ] Créer un groupe de messages depuis l'écran Messages fonctionne
- [ ] Les conversations de groupe sont visuellement distinctes des 1:1
- [ ] Aucune erreur TypeScript
