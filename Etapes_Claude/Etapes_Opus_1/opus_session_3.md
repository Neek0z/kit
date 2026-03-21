# KIT — Session Opus 3 : Performance

## Contexte
App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
Les sessions 1 et 2 ont été complétées.
Tu vas maintenant optimiser les performances de l'app.

---

## ÉTAPE 0 — Lire avant de modifier

Avant de toucher quoi que ce soit, lis :
- `hooks/useContacts.ts`
- `hooks/useConversations.ts`
- `hooks/useContactTasks.ts`
- `components/contacts/ContactCard.tsx`
- `app/(app)/contacts/index.tsx`
- `app/(app)/messages/index.tsx`

---

## ÉTAPE 1 — Mémoiser les composants de liste 🟠

### 1a. React.memo sur les composants de liste

Wrapper avec `React.memo` ces composants :
- `components/contacts/ContactCard.tsx`
- `components/contacts/ContactTaskItem.tsx`
- `components/ui/Avatar.tsx`
- `components/groups/GroupBadge.tsx`

Pattern :
```tsx
const ContactCard = React.memo(function ContactCard({ contact }: ContactCardProps) {
  // ... code existant inchangé
});

export { ContactCard };
```

### 1b. useCallback sur les renderItem des FlatList

Dans chaque fichier avec une FlatList, wrapper le `renderItem` avec `useCallback` :

```tsx
// Avant
renderItem={({ item }) => <ContactCard contact={item} />}

// Après
const renderContact = useCallback(
  ({ item }: { item: Contact }) => <ContactCard contact={item} />,
  [] // ou avec les dépendances nécessaires
);

// Dans la FlatList
renderItem={renderContact}
```

Fichiers concernés :
- `app/(app)/contacts/index.tsx`
- `app/(app)/content/index.tsx`
- `app/(app)/messages/index.tsx`
- `app/(app)/messages/[id].tsx`
- `app/(app)/groups/index.tsx`
- `app/(app)/groups/[id].tsx`
- `app/(app)/contacts/import.tsx`
- `app/(app)/messages/group-pick.tsx`
- `components/contacts/SwipeMode.tsx`

### 1c. Mémoiser ListHeaderComponent et ListEmptyComponent

Extraire les composants header/empty inline en composants mémorisés :

```tsx
// Avant (dans la FlatList)
ListHeaderComponent={<View>...</View>}

// Après
const ListHeader = useCallback(() => <View>...</View>, [deps]);

// Dans la FlatList
ListHeaderComponent={ListHeader}
```

---

## ÉTAPE 2 — Mémoiser les calculs coûteux 🟠

### 2a. useMemo dans contacts/[id].tsx

```tsx
// Avant
const upcomingAppts = upcomingAppointments.filter(
  (a) => a.contact_id === contact.id
);

// Après
const upcomingAppts = useMemo(
  () => upcomingAppointments.filter((a) => a.contact_id === contact.id),
  [upcomingAppointments, contact.id]
);
```

### 2b. useMemo dans index.tsx (dashboard)

```tsx
const overdueCount = useMemo(
  () => toFollowUp.filter((c) => c.next_follow_up && new Date(c.next_follow_up) < new Date()).length,
  [toFollowUp]
);
```

### 2c. useMemo dans content/index.tsx

```tsx
const promptCountByCategory = useMemo(
  () => Object.fromEntries(
    categories.map((cat) => [cat.id, getPromptsByCategory(cat.id).length])
  ),
  [categories, prompts]
);
```

---

## ÉTAPE 3 — Optimiser Avatar avec expo-image 🟠

Dans `components/ui/Avatar.tsx`, remplacer `Image` de React Native
par `Image` de `expo-image` pour le cache et les performances :

```tsx
// Avant
import { Image } from "react-native";

// Après
import { Image } from "expo-image";
```

Vérifier qu'`expo-image` est bien dans `package.json`.
Si pas installé : `npx expo install expo-image --legacy-peer-deps`

Ajouter un placeholder et une transition :
```tsx
<Image
  source={{ uri: url }}
  style={...}
  placeholder={{ uri: "data:image/png;base64,..." }} // placeholder gris
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

---

## ÉTAPE 4 — Dédupliquer les requêtes Supabase 🟢

### 4a. Créer un hook batch pour les tâches en attente

Le problème : `ContactCard` fait un appel Supabase par contact dans la liste.
Si tu as 50 contacts, ça fait 50 requêtes.

Créer `hooks/usePendingTasksCounts.ts` :

```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

// Un seul appel pour tous les contacts
export function usePendingTasksCounts(contactIds: string[]) {
  const { user } = useAuthContext();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user || contactIds.length === 0) return;
    let mounted = true;

    supabase
      .from("contact_tasks")
      .select("contact_id")
      .eq("user_id", user.id)
      .is("completed_at", null)
      .in("contact_id", contactIds)
      .then(({ data }) => {
        if (!mounted || !data) return;
        const result: Record<string, number> = {};
        contactIds.forEach((id) => { result[id] = 0; });
        data.forEach((task) => {
          result[task.contact_id] = (result[task.contact_id] ?? 0) + 1;
        });
        setCounts(result);
      });

    return () => { mounted = false; };
  }, [user, contactIds.join(",")]);

  return counts;
}
```

### 4b. Utiliser le hook batch dans la liste contacts

Dans `app/(app)/contacts/index.tsx` :
```tsx
const contactIds = useMemo(() => contacts.map((c) => c.id), [contacts]);
const pendingTasksCounts = usePendingTasksCounts(contactIds);

// Passer le count en prop à ContactCard au lieu de faire un hook par carte
<ContactCard contact={contact} pendingCount={pendingTasksCounts[contact.id] ?? 0} />
```

Modifier `ContactCard` pour accepter `pendingCount` en prop
au lieu d'appeler `useContactTasks` en interne.

---

## ÉTAPE 5 — Optimiser les FlatList 🟠

Ajouter ces props sur toutes les FlatList de listes longues
(contacts, messages, groups) :

```tsx
<FlatList
  // ... props existantes
  windowSize={10}
  initialNumToRender={15}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
  keyboardShouldPersistTaps="handled"
/>
```

Pour `messages/[id].tsx` (liste inversée) :
```tsx
inverted={true}
windowSize={15}
initialNumToRender={20}
```

---

## ÉTAPE 6 — Optimiser useConversations 🟠

`useConversations` fait 6 requêtes séquentielles à chaque montage.
Refactoriser pour faire une seule requête avec jointures :

```ts
// Avant : 6 requêtes séquentielles
const convs = await supabase.from("conversations")...
const participants = await supabase.from("conversation_participants")...
// etc.

// Après : 1 requête avec select joiné
const { data } = await supabase
  .from("conversations")
  .select(`
    id, created_at, updated_at, group_id,
    conversation_participants!inner (user_id),
    messages (id, content, created_at, sender_id, read_at)
  `)
  .eq("conversation_participants.user_id", user.id)
  .order("updated_at", { ascending: false });
```

Adapter le mapping des données en conséquence.

---

## Validation finale

Après toutes les modifications :
1. Lance `npx tsc --noEmit` — zéro erreur TypeScript
2. Lance l'app et vérifie :
   - La liste contacts scrolle sans saccades
   - Les messages chargent rapidement
   - Les avatars ont un placeholder pendant le chargement
3. Donne une estimation de l'amélioration des performances :
   - Nombre de requêtes Supabase économisées par navigation
   - Nombre de re-renders évités par les React.memo
4. Liste tous les fichiers modifiés
5. Signale les cas complexes ou les décisions prises
