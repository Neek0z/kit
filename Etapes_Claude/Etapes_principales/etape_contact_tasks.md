# KIT — Tâches par contact

## Contexte

On ajoute des tâches liées à un contact spécifique.
Pas un todo global — uniquement des actions à faire pour un contact donné.
Exemples : "Envoyer la présentation", "Appeler sa femme", "Préparer le RDV".
Intégré directement dans la fiche contact.

---

## Ce que tu dois faire

### 1. Table Supabase

```sql
create table public.contact_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  title text not null,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  priority text default 'normal' check (priority in ('low', 'normal', 'high')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index contact_tasks_contact_id_idx on public.contact_tasks(contact_id);
create index contact_tasks_user_id_idx on public.contact_tasks(user_id);
create index contact_tasks_due_date_idx on public.contact_tasks(user_id, due_date);

alter table public.contact_tasks enable row level security;

create policy "Users can manage own contact tasks"
  on public.contact_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger contact_tasks_updated_at
  before update on public.contact_tasks
  for each row execute procedure public.handle_updated_at();
```

---

### 2. Mettre à jour les types

Ajouter dans `types/index.ts` :

```ts
export type TaskPriority = "low" | "normal" | "high";

export interface ContactTask {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  due_date?: string;
  completed_at?: string;
  priority: TaskPriority;
  created_at: string;
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    "#64748b",
  normal: "#6ee7b7",
  high:   "#f87171",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    "Faible",
  normal: "Normal",
  high:   "Urgent",
};
```

---

### 3. Hook useContactTasks

Créer `hooks/useContactTasks.ts` :

```ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import { ContactTask, TaskPriority } from "../types";

interface CreateTaskInput {
  title: string;
  due_date?: string;
  priority?: TaskPriority;
}

export function useContactTasks(contactId: string) {
  const { user } = useAuthContext();
  const [tasks, setTasks] = useState<ContactTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("contact_tasks")
      .select("*")
      .eq("contact_id", contactId)
      .order("completed_at", { ascending: true, nullsFirst: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    setTasks(data ?? []);
    setLoading(false);
  }, [contactId, user]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (input: CreateTaskInput): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from("contact_tasks")
      .insert({
        ...input,
        contact_id: contactId,
        user_id: user.id,
        priority: input.priority ?? "normal",
      })
      .select()
      .single();

    if (error) return false;
    setTasks((prev) => [data, ...prev]);
    return true;
  };

  const toggleTask = async (taskId: string, completed: boolean): Promise<boolean> => {
    const { error } = await supabase
      .from("contact_tasks")
      .update({
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    if (error) return false;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, completed_at: completed ? new Date().toISOString() : undefined }
          : t
      )
    );
    return true;
  };

  const deleteTask = async (taskId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("contact_tasks")
      .delete()
      .eq("id", taskId);

    if (error) return false;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    return true;
  };

  const pendingCount = tasks.filter((t) => !t.completed_at).length;
  const pendingTasks = tasks.filter((t) => !t.completed_at);
  const completedTasks = tasks.filter((t) => !!t.completed_at);

  return {
    tasks,
    pendingTasks,
    completedTasks,
    pendingCount,
    loading,
    createTask,
    toggleTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
```

---

### 4. Composant ContactTaskItem

Créer `components/contacts/ContactTaskItem.tsx` :

```tsx
import { View, TouchableOpacity, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ContactTask, PRIORITY_COLORS, TaskPriority } from "../../types";
import { useTheme } from "../../lib/theme";

interface ContactTaskItemProps {
  task: ContactTask;
  onToggle: () => void;
  onDelete: () => void;
}

export function ContactTaskItem({ task, onToggle, onDelete }: ContactTaskItemProps) {
  const theme = useTheme();
  const isCompleted = !!task.completed_at;
  const priorityColor = PRIORITY_COLORS[task.priority as TaskPriority];

  const isOverdue = !isCompleted && task.due_date && new Date(task.due_date) < new Date();

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
    }}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={onToggle}
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: isCompleted ? theme.primary : theme.border,
          backgroundColor: isCompleted ? theme.primaryBg : "transparent",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isCompleted && (
          <Feather name="check" size={13} color={theme.primary} />
        )}
      </TouchableOpacity>

      {/* Contenu */}
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: 14,
          color: isCompleted ? theme.textMuted : theme.textPrimary,
          textDecorationLine: isCompleted ? "line-through" : "none",
          fontWeight: "500",
        }}>
          {task.title}
        </Text>

        {task.due_date && (
          <Text style={{
            fontSize: 11,
            color: isOverdue ? "#f87171" : theme.textMuted,
            marginTop: 2,
          }}>
            {isOverdue ? "⚠ " : ""}
            {new Date(task.due_date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        )}
      </View>

      {/* Indicateur priorité */}
      {!isCompleted && task.priority !== "normal" && (
        <View style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: priorityColor,
        }} />
      )}

      {/* Supprimer */}
      <TouchableOpacity
        onPress={onDelete}
        style={{ padding: 4 }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="x" size={14} color={theme.textHint} />
      </TouchableOpacity>
    </View>
  );
}
```

---

### 5. Composant AddTaskSheet

Créer `components/contacts/AddTaskSheet.tsx` :

```tsx
import { useState } from "react";
import { View, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { TaskPriority, PRIORITY_LABELS, PRIORITY_COLORS } from "../../types";

const PRIORITIES: TaskPriority[] = ["normal", "high", "low"];

const QUICK_TASKS = [
  "Envoyer la présentation",
  "Rappeler dans la semaine",
  "Envoyer un message WhatsApp",
  "Préparer le RDV",
  "Envoyer les ressources",
  "Faire un suivi",
];

interface AddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (title: string, dueDate?: string, priority?: TaskPriority) => Promise<void>;
}

export function AddTaskSheet({ visible, onClose, onAdd }: AddTaskSheetProps) {
  const theme = useTheme();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (taskTitle?: string) => {
    const finalTitle = (taskTitle ?? title).trim();
    if (!finalTitle) return;

    setLoading(true);
    await onAdd(finalTitle, undefined, priority);
    setTitle("");
    setPriority("normal");
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <View style={{
          backgroundColor: theme.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          gap: 16,
        }}>
          {/* Handle */}
          <View style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: theme.border,
            alignSelf: "center",
          }} />

          <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary }}>
            Nouvelle tâche
          </Text>

          {/* Suggestions rapides */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {QUICK_TASKS.map((qt) => (
              <TouchableOpacity
                key={qt}
                onPress={() => handleAdd(qt)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 6,
                  borderRadius: 100,
                  backgroundColor: theme.bg,
                  borderWidth: 1, borderColor: theme.border,
                }}
              >
                <Text style={{ fontSize: 11, color: theme.textMuted }}>{qt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Séparateur */}
          <View style={{ height: 1, backgroundColor: theme.border }} />

          {/* Input custom */}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ou écris ta propre tâche..."
            placeholderTextColor={theme.textHint}
            style={{
              backgroundColor: theme.bg,
              borderWidth: 1, borderColor: theme.border,
              borderRadius: 12, padding: 12,
              fontSize: 14, color: theme.textPrimary,
            }}
            autoFocus={false}
          />

          {/* Priorité */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPriority(p)}
                style={{
                  flex: 1, paddingVertical: 8,
                  borderRadius: 10, alignItems: "center",
                  backgroundColor: priority === p
                    ? `${PRIORITY_COLORS[p]}18`
                    : theme.bg,
                  borderWidth: 1,
                  borderColor: priority === p
                    ? `${PRIORITY_COLORS[p]}40`
                    : theme.border,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: "600",
                  color: priority === p ? PRIORITY_COLORS[p] : theme.textMuted,
                }}>
                  {PRIORITY_LABELS[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Boutons */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1, paddingVertical: 14,
                borderRadius: 12, alignItems: "center",
                borderWidth: 1, borderColor: theme.border,
              }}
            >
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAdd()}
              disabled={!title.trim() || loading}
              style={{
                flex: 2, paddingVertical: 14,
                borderRadius: 12, alignItems: "center",
                backgroundColor: title.trim() ? theme.primaryBg : theme.bg,
                borderWidth: 1,
                borderColor: title.trim() ? theme.primaryBorder : theme.border,
                opacity: loading ? 0.6 : 1,
              }}
            >
              <Text style={{
                fontSize: 14, fontWeight: "600",
                color: title.trim() ? theme.primary : theme.textMuted,
              }}>
                Ajouter la tâche
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
```

---

### 6. Composant ContactTasksSection

Créer `components/contacts/ContactTasksSection.tsx` :

```tsx
import { useState } from "react";
import { View, TouchableOpacity, Text, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { useContactTasks } from "../../hooks/useContactTasks";
import { ContactTaskItem } from "./ContactTaskItem";
import { AddTaskSheet } from "./AddTaskSheet";
import { TaskPriority } from "../../types";

interface ContactTasksSectionProps {
  contactId: string;
}

export function ContactTasksSection({ contactId }: ContactTasksSectionProps) {
  const theme = useTheme();
  const { pendingTasks, completedTasks, pendingCount, createTask, toggleTask, deleteTask } = useContactTasks(contactId);
  const [showSheet, setShowSheet] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleDelete = (taskId: string, title: string) => {
    Alert.alert(
      "Supprimer la tâche",
      `Supprimer "${title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteTask(taskId) },
      ]
    );
  };

  const hasAnyTask = pendingTasks.length > 0 || completedTasks.length > 0;

  return (
    <View style={{
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: pendingCount > 0 ? theme.borderAccent : theme.border,
      borderRadius: 18,
      padding: 14,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: hasAnyTask ? 12 : 0,
      }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{
            fontSize: 11,
            color: theme.textHint,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            fontWeight: "600",
          }}>
            Tâches
          </Text>
          {pendingCount > 0 && (
            <View style={{
              backgroundColor: theme.primaryBg,
              borderRadius: 10,
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderWidth: 1,
              borderColor: theme.primaryBorder,
            }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: theme.primary }}>
                {pendingCount}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowSheet(true)}
          style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 100,
            backgroundColor: theme.primaryBg,
            borderWidth: 1, borderColor: theme.primaryBorder,
          }}
        >
          <Feather name="plus" size={12} color={theme.primary} />
          <Text style={{ fontSize: 11, fontWeight: "600", color: theme.primary }}>
            Ajouter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tâches en cours */}
      {pendingTasks.length > 0 && (
        <View style={{ gap: 2 }}>
          {pendingTasks.map((task, i) => (
            <View key={task.id}>
              <ContactTaskItem
                task={task}
                onToggle={() => toggleTask(task.id, true)}
                onDelete={() => handleDelete(task.id, task.title)}
              />
              {i < pendingTasks.length - 1 && (
                <View style={{ height: 1, backgroundColor: theme.border }} />
              )}
            </View>
          ))}
        </View>
      )}

      {/* Etat vide */}
      {!hasAnyTask && (
        <TouchableOpacity
          onPress={() => setShowSheet(true)}
          style={{ paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 13, color: theme.textHint }}>
            Aucune tâche — tap pour en ajouter
          </Text>
        </TouchableOpacity>
      )}

      {/* Tâches complétées (repliables) */}
      {completedTasks.length > 0 && (
        <View style={{ marginTop: pendingTasks.length > 0 ? 10 : 0 }}>
          <TouchableOpacity
            onPress={() => setShowCompleted(!showCompleted)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
          >
            <Feather
              name={showCompleted ? "chevron-up" : "chevron-down"}
              size={13}
              color={theme.textHint}
            />
            <Text style={{ fontSize: 11, color: theme.textHint }}>
              {completedTasks.length} terminée{completedTasks.length > 1 ? "s" : ""}
            </Text>
          </TouchableOpacity>

          {showCompleted && (
            <View style={{ marginTop: 4, gap: 2 }}>
              {completedTasks.map((task) => (
                <ContactTaskItem
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(task.id, false)}
                  onDelete={() => handleDelete(task.id, task.title)}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Sheet */}
      <AddTaskSheet
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        onAdd={async (title, dueDate, priority) => {
          await createTask({ title, due_date: dueDate, priority });
        }}
      />
    </View>
  );
}
```

---

### 7. Intégrer dans la fiche contact

Dans `app/(app)/contacts/[id].tsx`, ajouter l'import :

```tsx
import { ContactTasksSection } from "../../../components/contacts/ContactTasksSection";
```

Ajouter dans le JSX, entre les infos contact et l'historique des interactions :

```tsx
{/* Tâches */}
<ContactTasksSection contactId={id} />
```

---

### 8. Badge tâches sur les cards de contact

Dans `components/contacts/ContactCard.tsx`, afficher le nombre de tâches en attente.

Ajouter le hook dans le composant :

```tsx
import { useContactTasks } from "../../hooks/useContactTasks";

// Dans le composant
const { pendingCount } = useContactTasks(contact.id);

// Dans le JSX, à côté du StatusPill
{pendingCount > 0 && (
  <View style={{
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "rgba(110,231,183,0.15)",
    borderWidth: 1, borderColor: "rgba(110,231,183,0.3)",
    alignItems: "center", justifyContent: "center",
  }}>
    <Text style={{ fontSize: 9, fontWeight: "700", color: "#6ee7b7" }}>
      {pendingCount}
    </Text>
  </View>
)}
```

---

### 9. Exporter les nouveaux composants

Mettre à jour `components/contacts/index.ts` :

```ts
export { ContactTaskItem } from "./ContactTaskItem";
export { AddTaskSheet } from "./AddTaskSheet";
export { ContactTasksSection } from "./ContactTasksSection";
```

---

## Critères de validation

- [ ] La table `contact_tasks` existe dans Supabase avec RLS
- [ ] La section Tâches apparaît sur la fiche contact
- [ ] Les suggestions rapides créent une tâche en un tap
- [ ] Le champ texte custom crée une tâche personnalisée
- [ ] Les 3 niveaux de priorité (Faible / Normal / Urgent) fonctionnent
- [ ] Cocher une tâche la passe en "terminée" avec rayure
- [ ] Les tâches terminées sont repliables
- [ ] Décocher une tâche la remet en "en cours"
- [ ] La suppression fonctionne avec confirmation
- [ ] Le badge avec le nombre de tâches apparaît sur la ContactCard
- [ ] Aucune erreur TypeScript
