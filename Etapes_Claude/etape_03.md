# KIT — etape_03 : Gestion des contacts

## Contexte

Design system et navigation en place (etape_02 validée).
On construit maintenant la fonctionnalité centrale de KIT : la gestion complète des contacts.
Liste, fiche détaillée, ajout, édition, suppression — et import depuis les contacts du téléphone.

---

## Ce que tu dois faire

### 1. Table Supabase à créer

Dans Supabase → SQL Editor :

```sql
-- Table contacts
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text not null,
  phone text,
  email text,
  notes text,
  status text default 'new' not null,
  next_follow_up timestamp with time zone,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index pour les requêtes par user
create index contacts_user_id_idx on public.contacts(user_id);
create index contacts_status_idx on public.contacts(user_id, status);
create index contacts_follow_up_idx on public.contacts(user_id, next_follow_up);

-- RLS
alter table public.contacts enable row level security;

create policy "Users can manage own contacts"
  on public.contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.handle_updated_at();
```

---

### 2. Installer expo-contacts

```bash
npx expo install expo-contacts
```

Ajouter les permissions dans `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-contacts",
        {
          "contactsPermission": "KIT accède à tes contacts pour les importer facilement."
        }
      ]
    ]
  }
}
```

---

### 3. Hook useContacts

Créer `hooks/useContacts.ts` :

```ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Contact } from "../types";
import { useAuthContext } from "../lib/AuthContext";

interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createContact: (data: CreateContactInput) => Promise<Contact | null>;
  updateContact: (id: string, data: Partial<CreateContactInput>) => Promise<boolean>;
  deleteContact: (id: string) => Promise<boolean>;
}

export interface CreateContactInput {
  full_name: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: string;
  next_follow_up?: string | null;
  tags?: string[];
}

export function useContacts(): UseContactsReturn {
  const { user } = useAuthContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("full_name", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setContacts(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = async (data: CreateContactInput): Promise<Contact | null> => {
    if (!user) return null;

    const { data: contact, error } = await supabase
      .from("contacts")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (error) {
      setError(error.message);
      return null;
    }

    setContacts((prev) => [...prev, contact].sort((a, b) =>
      a.full_name.localeCompare(b.full_name)
    ));
    return contact;
  };

  const updateContact = async (id: string, data: Partial<CreateContactInput>): Promise<boolean> => {
    const { error } = await supabase
      .from("contacts")
      .update(data)
      .eq("id", id);

    if (error) {
      setError(error.message);
      return false;
    }

    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );
    return true;
  };

  const deleteContact = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return false;
    }

    setContacts((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
```

---

### 4. Composant ContactCard

Créer `components/contacts/ContactCard.tsx` :

```tsx
import { View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, Avatar, Badge } from "../ui";
import { Contact, PIPELINE_LABELS, PipelineStatus } from "../../types";

const STATUS_VARIANTS: Record<PipelineStatus, "success" | "info" | "warning" | "neutral" | "danger"> = {
  new: "neutral",
  contacted: "info",
  interested: "warning",
  follow_up: "danger",
  client: "success",
  inactive: "neutral",
};

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center gap-3 py-3 px-5 border-b border-border">
        <Avatar name={contact.full_name} size="md" />
        <View className="flex-1">
          <Text variant="h3" className="text-base">{contact.full_name}</Text>
          {contact.phone && (
            <Text variant="muted" className="text-xs mt-0.5">{contact.phone}</Text>
          )}
        </View>
        <View className="items-end gap-1">
          <Badge
            label={PIPELINE_LABELS[contact.status as PipelineStatus] ?? contact.status}
            variant={STATUS_VARIANTS[contact.status as PipelineStatus] ?? "neutral"}
          />
          {contact.next_follow_up && (
            <Text variant="muted" className="text-xs">
              {new Date(contact.next_follow_up).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={16} color="#475569" />
      </View>
    </TouchableOpacity>
  );
}
```

Créer `components/contacts/index.ts` :

```ts
export { ContactCard } from "./ContactCard";
```

---

### 5. Écran liste des contacts

Remplacer `app/(app)/contacts.tsx` :

```tsx
import { useState, useMemo } from "react";
import { View, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, EmptyState } from "../../components/ui";
import { ContactCard } from "../../components/contacts";
import { useContacts } from "../../hooks/useContacts";
import { PipelineStatus, PIPELINE_LABELS } from "../../types";

const FILTERS: { label: string; value: PipelineStatus | "all" }[] = [
  { label: "Tous", value: "all" },
  { label: "À relancer", value: "follow_up" },
  { label: "Intéressés", value: "interested" },
  { label: "Clients", value: "client" },
  { label: "Nouveaux", value: "new" },
];

export default function ContactsScreen() {
  const { contacts, loading } = useContacts();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PipelineStatus | "all">("all");

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        c.full_name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = activeFilter === "all" || c.status === activeFilter;
      return matchSearch && matchFilter;
    });
  }, [contacts, search, activeFilter]);

  return (
    <SafeAreaView className="flex-1 bg-background">

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <Text variant="h1">Contacts</Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/contacts/new")}
          className="bg-primary w-9 h-9 rounded-full items-center justify-center"
        >
          <Feather name="plus" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Recherche */}
      <View className="px-5 mb-3">
        <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 gap-2">
          <Feather name="search" size={16} color="#475569" />
          <TextInput
            className="flex-1 py-3 text-textMain text-base"
            placeholder="Rechercher..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres */}
      <View className="mb-2">
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(item.value)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === item.value
                  ? "bg-primary border-primary"
                  : "bg-surface border-border"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === item.value ? "text-background" : "text-textMuted"
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Liste */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6ee7b7" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ContactCard contact={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title={search ? "Aucun résultat" : "Aucun contact"}
              description={
                search
                  ? "Essaie un autre terme de recherche."
                  : "Ajoute ton premier contact pour commencer."
              }
              actionLabel={search ? undefined : "Ajouter un contact"}
              onAction={search ? undefined : () => router.push("/(app)/contacts/new")}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
```

---

### 6. Formulaire d'ajout / édition

Créer `app/(app)/contacts/new.tsx` :

```tsx
import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ExpoContacts from "expo-contacts";
import { Feather } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native";
import { Text, Input, Button, Card } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useContacts } from "../../../hooks/useContacts";
import { PipelineStatus, PIPELINE_LABELS } from "../../../types";

const STATUSES = Object.entries(PIPELINE_LABELS) as [PipelineStatus, string][];

export default function NewContactScreen() {
  const { createContact } = useContacts();
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<PipelineStatus>("new");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Le nom est obligatoire.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);

    const contact = await createContact({
      full_name: fullName.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    });

    setLoading(false);

    if (contact) {
      router.replace(`/(app)/contacts/${contact.id}`);
    } else {
      Alert.alert("Erreur", "Impossible de créer le contact.");
    }
  };

  const handleImportFromPhone = async () => {
    const { status: permStatus } = await ExpoContacts.requestPermissionsAsync();
    if (permStatus !== "granted") {
      Alert.alert("Permission refusée", "Autorise KIT à accéder à tes contacts dans les réglages.");
      return;
    }

    const { data } = await ExpoContacts.getContactsAsync({
      fields: [ExpoContacts.Fields.Name, ExpoContacts.Fields.PhoneNumbers, ExpoContacts.Fields.Emails],
    });

    if (data.length > 0) {
      // Ouvre un sélecteur simple — prend le premier contact pour simplifier
      // Pour un vrai sélecteur multi, utiliser expo-contacts avec une FlatList modale
      const picked = data[0];
      setFullName(picked.name ?? "");
      setPhone(picked.phoneNumbers?.[0]?.number ?? "");
      setEmail(picked.emails?.[0]?.email ?? "");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title="Nouveau contact"
        showBack
      />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Import depuis téléphone */}
        <TouchableOpacity
          onPress={handleImportFromPhone}
          className="flex-row items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3 mb-6"
        >
          <Feather name="smartphone" size={16} color="#6ee7b7" />
          <Text className="text-primary text-sm font-medium">
            Importer depuis mes contacts
          </Text>
        </TouchableOpacity>

        {/* Formulaire */}
        <View className="gap-4 pb-8">
          <Input
            label="Nom complet *"
            placeholder="Jean Dupont"
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
            autoCapitalize="words"
          />
          <Input
            label="Téléphone"
            placeholder="+33 6 12 34 56 78"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Email"
            placeholder="jean@exemple.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Statut pipeline */}
          <View className="gap-1.5">
            <Text variant="muted" className="text-sm font-medium">Statut</Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUSES.map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setStatus(value)}
                  className={`px-3 py-2 rounded-lg border ${
                    status === value
                      ? "bg-primary/10 border-primary"
                      : "bg-surface border-border"
                  }`}
                >
                  <Text className={`text-sm ${status === value ? "text-primary font-semibold" : "text-textMuted"}`}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Input
            label="Notes"
            placeholder="Notes sur ce contact..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            className="h-24"
          />

          <Button
            label="Enregistrer le contact"
            onPress={handleSave}
            loading={loading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 7. Fiche contact détaillée

Créer `app/(app)/contacts/[id].tsx` :

```tsx
import { useState } from "react";
import { View, ScrollView, Alert, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, Avatar, Badge, Card, Button, Divider } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useContacts } from "../../../hooks/useContacts";
import { PIPELINE_LABELS, PipelineStatus } from "../../../types";

const STATUS_VARIANTS: Record<PipelineStatus, "success" | "info" | "warning" | "neutral" | "danger"> = {
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

  const contact = contacts.find((c) => c.id === id);

  if (!contact) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header
        title={contact.full_name}
        showBack
        rightAction={{ icon: "edit-2", onPress: () => router.push(`/(app)/contacts/${id}/edit`) }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Profil */}
        <View className="items-center py-6 gap-3">
          <Avatar name={contact.full_name} size="lg" />
          <Badge
            label={PIPELINE_LABELS[contact.status as PipelineStatus] ?? contact.status}
            variant={STATUS_VARIANTS[contact.status as PipelineStatus] ?? "neutral"}
          />
        </View>

        {/* Actions rapides */}
        <View className="flex-row justify-center gap-4 px-5 mb-6">
          {contact.phone && (
            <TouchableOpacity
              onPress={handleCall}
              className="items-center gap-1"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Feather name="phone" size={20} color="#6ee7b7" />
              </View>
              <Text variant="muted" className="text-xs">Appeler</Text>
            </TouchableOpacity>
          )}
          {contact.phone && (
            <TouchableOpacity onPress={handleWhatsApp} className="items-center gap-1">
              <View className="w-12 h-12 rounded-full bg-green-500/10 items-center justify-center">
                <Feather name="message-circle" size={20} color="#22c55e" />
              </View>
              <Text variant="muted" className="text-xs">WhatsApp</Text>
            </TouchableOpacity>
          )}
          {contact.email && (
            <TouchableOpacity onPress={handleEmail} className="items-center gap-1">
              <View className="w-12 h-12 rounded-full bg-secondary/10 items-center justify-center">
                <Feather name="mail" size={20} color="#818cf8" />
              </View>
              <Text variant="muted" className="text-xs">Email</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Infos */}
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

          {contact.notes && (
            <Card>
              <Text variant="muted" className="text-xs mb-2 uppercase tracking-wider">Notes</Text>
              <Text className="text-sm leading-relaxed">{contact.notes}</Text>
            </Card>
          )}

          {contact.next_follow_up && (
            <Card>
              <View className="flex-row items-center gap-2">
                <Feather name="calendar" size={15} color="#fbbf24" />
                <Text className="text-sm text-yellow-400">
                  Relance prévue le{" "}
                  {new Date(contact.next_follow_up).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </Text>
              </View>
            </Card>
          )}

          {/* Supprimer */}
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
```

---

### 8. Structure de fichiers finale

```
app/(app)/contacts/
├── [id].tsx          # Fiche contact
├── [id]/
│   └── edit.tsx      # Édition (voir note ci-dessous)
└── new.tsx           # Nouveau contact
```

> **Note :** L'écran `edit.tsx` est à créer en copiant `new.tsx` et en pré-remplissant les champs avec les données du contact existant via `useLocalSearchParams`. Cursor peut le générer automatiquement à partir du fichier `new.tsx`.

---

## Critères de validation

Avant de passer à etape_04, vérifier que :

- [ ] La liste des contacts s'affiche (vide au départ)
- [ ] Ajouter un contact le fait apparaître dans la liste et dans Supabase
- [ ] La recherche filtre en temps réel
- [ ] Les filtres par statut fonctionnent
- [ ] La fiche contact affiche les infos et les boutons d'action
- [ ] Appeler / WhatsApp / Email ouvrent les bonnes apps
- [ ] La suppression fonctionne avec confirmation
- [ ] L'import depuis les contacts du téléphone pré-remplit le formulaire
- [ ] Aucune erreur TypeScript

---

## Ce qu'on ne fait PAS dans cette étape

- Pas d'historique d'interactions (etape_04)
- Pas de rappels / notifications (etape_05)
- Pas de tags complexes (peut être ajouté plus tard)
- Pas de tri avancé (peut être ajouté plus tard)

---

## Prochaine étape

`etape_04` — Pipeline de suivi + historique des interactions + Dashboard
