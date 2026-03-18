# KIT — etape_03c : Workflow automatique au passage en Client

## Contexte

Swipe cards et arc de progression en place (etape_03b validée).
On ajoute un workflow d'accompagnement automatique : quand un contact passe
en statut "Client", KIT génère automatiquement une série de relances planifiées
avec notifications push.

---

## Architecture

```
Contact passe en "client"
         ↓
updateContact() détecte le changement de statut
         ↓
workflowService.triggerClientWorkflow()
         ↓
Création des étapes en base (table workflow_tasks)
+ Planification des notifications push locales
         ↓
Les relances apparaissent dans le dashboard et la fiche contact
```

---

## Ce que tu dois faire

### 1. Table Supabase — workflow_tasks

Dans Supabase → SQL Editor :

```sql
-- Étapes de workflow prédéfinies (template)
create table public.workflow_steps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  delay_days integer not null default 0,
  interaction_type text not null default 'call',
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.workflow_steps enable row level security;

create policy "Users can manage own workflow steps"
  on public.workflow_steps for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tâches générées pour chaque contact client
create table public.workflow_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  step_id uuid references public.workflow_steps on delete set null,
  title text not null,
  description text,
  interaction_type text not null default 'call',
  due_date timestamp with time zone not null,
  completed_at timestamp with time zone,
  notification_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index
create index workflow_tasks_contact_id_idx on public.workflow_tasks(contact_id);
create index workflow_tasks_user_id_idx on public.workflow_tasks(user_id);
create index workflow_tasks_due_date_idx on public.workflow_tasks(user_id, due_date);

-- RLS
alter table public.workflow_tasks enable row level security;

create policy "Users can manage own workflow tasks"
  on public.workflow_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

---

### 2. Workflow par défaut — seed Supabase

Après avoir créé les tables, exécuter ce SQL pour insérer le workflow par défaut
**pour chaque nouvel utilisateur** via un trigger :

```sql
-- Fonction qui crée le workflow par défaut à l'inscription
create or replace function public.create_default_workflow(p_user_id uuid)
returns void as $$
begin
  insert into public.workflow_steps (user_id, name, description, delay_days, interaction_type, sort_order)
  values
    (p_user_id, 'Message de bienvenue', 'Envoyer un message de bienvenue personnalisé', 0, 'message', 0),
    (p_user_id, 'Appel de démarrage', 'Appel pour s''assurer que tout se passe bien', 3, 'call', 1),
    (p_user_id, 'Envoi des ressources', 'Partager les ressources et documents utiles', 7, 'message', 2),
    (p_user_id, 'Premier check-in', 'Vérifier les premiers résultats et répondre aux questions', 14, 'call', 3),
    (p_user_id, 'Bilan du premier mois', 'Bilan complet et prochaines étapes', 30, 'meeting', 4);
end;
$$ language plpgsql security definer;

-- Trigger : créer le workflow par défaut à l'inscription
create or replace function public.handle_new_user_workflow()
returns trigger as $$
begin
  perform public.create_default_workflow(new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_workflow
  after insert on auth.users
  for each row execute procedure public.handle_new_user_workflow();

-- Pour les utilisateurs existants — lancer manuellement :
-- select create_default_workflow('<ton-user-id>');
```

> **Important :** Pour tes utilisateurs existants (dont toi), lance manuellement :
> ```sql
> select create_default_workflow('<copie ton user_id depuis Auth → Users>');
> ```

---

### 3. Mettre à jour les types

Ajouter dans `types/index.ts` :

```ts
export interface WorkflowStep {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  delay_days: number;
  interaction_type: InteractionType;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface WorkflowTask {
  id: string;
  user_id: string;
  contact_id: string;
  step_id?: string;
  title: string;
  description?: string;
  interaction_type: InteractionType;
  due_date: string;
  completed_at?: string;
  notification_id?: string;
  created_at: string;
}
```

---

### 4. Service workflow

Créer `lib/workflowService.ts` :

```ts
import { supabase } from "./supabase";
import { scheduleFollowUpNotification, cancelNotification } from "./notifications";
import { WorkflowStep, WorkflowTask } from "../types";

export async function triggerClientWorkflow(
  userId: string,
  contactId: string,
  contactName: string
): Promise<void> {
  // 1. Récupérer les étapes actives du workflow de l'utilisateur
  const { data: steps, error } = await supabase
    .from("workflow_steps")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !steps || steps.length === 0) {
    console.warn("Aucune étape de workflow trouvée.");
    return;
  }

  // 2. Vérifier qu'aucun workflow n'existe déjà pour ce contact
  const { data: existing } = await supabase
    .from("workflow_tasks")
    .select("id")
    .eq("contact_id", contactId)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log("Workflow déjà en cours pour ce contact.");
    return;
  }

  // 3. Générer les tâches avec dates
  const now = new Date();
  const tasksToInsert = steps.map((step: WorkflowStep) => {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + step.delay_days);
    dueDate.setHours(9, 0, 0, 0); // 9h du matin

    return {
      user_id: userId,
      contact_id: contactId,
      step_id: step.id,
      title: step.name,
      description: step.description,
      interaction_type: step.interaction_type,
      due_date: dueDate.toISOString(),
    };
  });

  // 4. Insérer en base
  const { data: insertedTasks, error: insertError } = await supabase
    .from("workflow_tasks")
    .insert(tasksToInsert)
    .select();

  if (insertError || !insertedTasks) {
    console.error("Erreur création workflow tasks:", insertError);
    return;
  }

  // 5. Planifier les notifications push pour chaque étape
  for (const task of insertedTasks as WorkflowTask[]) {
    const dueDate = new Date(task.due_date);

    // Ne planifier que les futures notifications
    if (dueDate > now) {
      try {
        const notifId = await scheduleFollowUpNotification(
          `${contactName} — ${task.title}`,
          contactId,
          dueDate
        );

        // Sauvegarder l'ID de notification
        await supabase
          .from("workflow_tasks")
          .update({ notification_id: notifId })
          .eq("id", task.id);
      } catch (e) {
        console.warn("Notification non planifiée:", e);
      }
    }
  }
}

export async function cancelClientWorkflow(
  contactId: string
): Promise<void> {
  // Récupérer les tâches non complétées
  const { data: tasks } = await supabase
    .from("workflow_tasks")
    .select("id, notification_id")
    .eq("contact_id", contactId)
    .is("completed_at", null);

  if (!tasks) return;

  // Annuler les notifications
  for (const task of tasks) {
    if (task.notification_id) {
      await cancelNotification(task.notification_id);
    }
  }

  // Supprimer les tâches
  await supabase
    .from("workflow_tasks")
    .delete()
    .eq("contact_id", contactId)
    .is("completed_at", null);
}

export async function completeWorkflowTask(taskId: string): Promise<void> {
  await supabase
    .from("workflow_tasks")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", taskId);
}
```

---

### 5. Déclencher le workflow au changement de statut

Mettre à jour `hooks/useContacts.ts` — modifier la fonction `updateContact` pour détecter
le passage en "client" :

Ajouter l'import en haut :
```ts
import { triggerClientWorkflow, cancelClientWorkflow } from "../lib/workflowService";
```

Modifier `updateContact` :
```ts
const updateContact = async (id: string, data: Partial<CreateContactInput>): Promise<boolean> => {
  // Récupérer le contact actuel pour comparer le statut
  const currentContact = contacts.find((c) => c.id === id);

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

  // Déclencher le workflow si passage en "client"
  if (data.status === "client" && currentContact?.status !== "client" && user) {
    await triggerClientWorkflow(user.id, id, currentContact?.full_name ?? "");
  }

  // Annuler le workflow si on retire le statut "client"
  if (data.status && data.status !== "client" && currentContact?.status === "client") {
    Alert.alert(
      "Retirer le statut Client ?",
      "Le workflow d'accompagnement en cours sera annulé.",
      [
        { text: "Annuler", style: "cancel", onPress: () => {} },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: () => cancelClientWorkflow(id),
        },
      ]
    );
  }

  return true;
};
```

---

### 6. Composant WorkflowTimeline dans la fiche contact

Créer `components/contacts/WorkflowTimeline.tsx` :

```tsx
import { useState, useEffect } from "react";
import { View, TouchableOpacity, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { completeWorkflowTask } from "../../lib/workflowService";
import { Text, Card } from "../ui";
import { WorkflowTask, INTERACTION_ICONS, InteractionType } from "../../types";

interface WorkflowTimelineProps {
  contactId: string;
}

export function WorkflowTimeline({ contactId }: WorkflowTimelineProps) {
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("workflow_tasks")
      .select("*")
      .eq("contact_id", contactId)
      .order("due_date", { ascending: true })
      .then(({ data }) => {
        setTasks(data ?? []);
        setLoading(false);
      });
  }, [contactId]);

  const handleComplete = (task: WorkflowTask) => {
    Alert.alert(
      "Marquer comme fait",
      `Valider "${task.title}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Valider",
          onPress: async () => {
            await completeWorkflowTask(task.id);
            setTasks((prev) =>
              prev.map((t) =>
                t.id === task.id
                  ? { ...t, completed_at: new Date().toISOString() }
                  : t
              )
            );
          },
        },
      ]
    );
  };

  if (loading || tasks.length === 0) return null;

  const completed = tasks.filter((t) => t.completed_at);
  const pending = tasks.filter((t) => !t.completed_at);
  const progress = Math.round((completed.length / tasks.length) * 100);

  return (
    <Card>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text variant="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
          Workflow client
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 12, color: "#6ee7b7", fontWeight: "500" }}>
            {completed.length}/{tasks.length}
          </Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={{ height: 4, backgroundColor: "#1e293b", borderRadius: 2, marginBottom: 16 }}>
        <View
          style={{
            height: 4,
            backgroundColor: "#6ee7b7",
            borderRadius: 2,
            width: `${progress}%`,
          }}
        />
      </View>

      {/* Timeline */}
      <View style={{ gap: 12 }}>
        {tasks.map((task, index) => {
          const isCompleted = !!task.completed_at;
          const isOverdue = !isCompleted && new Date(task.due_date) < new Date();
          const dueDate = new Date(task.due_date);

          return (
            <View key={task.id} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
              {/* Timeline line + dot */}
              <View style={{ alignItems: "center", width: 24 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isCompleted
                      ? "#6ee7b7"
                      : isOverdue
                      ? "#f8717122"
                      : "#1e293b",
                    borderWidth: 1.5,
                    borderColor: isCompleted
                      ? "#6ee7b7"
                      : isOverdue
                      ? "#f87171"
                      : "#334155",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {isCompleted ? (
                    <Feather name="check" size={12} color="#0f172a" />
                  ) : (
                    <Feather
                      name={INTERACTION_ICONS[task.interaction_type as InteractionType] as any}
                      size={11}
                      color={isOverdue ? "#f87171" : "#64748b"}
                    />
                  )}
                </View>
                {index < tasks.length - 1 && (
                  <View style={{ width: 1, flex: 1, minHeight: 12, backgroundColor: "#1e293b", marginTop: 4 }} />
                )}
              </View>

              {/* Contenu */}
              <View style={{ flex: 1, paddingBottom: index < tasks.length - 1 ? 8 : 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: isCompleted ? "#475569" : "#f1f5f9",
                      textDecorationLine: isCompleted ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </Text>
                  {!isCompleted && (
                    <TouchableOpacity
                      onPress={() => handleComplete(task)}
                      style={{ padding: 4 }}
                    >
                      <Feather name="check-circle" size={16} color="#475569" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 11,
                    color: isOverdue ? "#f87171" : "#64748b",
                    marginTop: 2,
                  }}
                >
                  {isCompleted
                    ? `Fait le ${new Date(task.completed_at!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                    : isOverdue
                    ? `En retard — prévu le ${dueDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                    : dueDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </Text>

                {task.description && !isCompleted && (
                  <Text style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    {task.description}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Message fin de workflow */}
      {pending.length === 0 && (
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: "#6ee7b7" }}>
            🎉 Workflow complété !
          </Text>
        </View>
      )}
    </Card>
  );
}
```

---

### 7. Intégrer WorkflowTimeline dans la fiche contact

Dans `app/(app)/contacts/[id].tsx`, ajouter l'import :

```tsx
import { WorkflowTimeline } from "../../../components/contacts/WorkflowTimeline";
```

Ajouter le composant dans le JSX, juste après la Card des infos contact,
**uniquement si le contact est "client"** :

```tsx
{contact.status === "client" && (
  <WorkflowTimeline contactId={contact.id} />
)}
```

---

### 8. Écran de configuration du workflow (Paramètres)

Créer `app/(app)/profile/workflow.tsx` :

```tsx
import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Card } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { supabase } from "../../../lib/supabase";
import { useAuthContext } from "../../../lib/AuthContext";
import { WorkflowStep } from "../../../types";
import { INTERACTION_LABELS, InteractionType } from "../../../types";

export default function WorkflowSettingsScreen() {
  const { user } = useAuthContext();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("workflow_steps")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .then(({ data }) => setSteps(data ?? []));
  }, [user]);

  const toggleStep = async (step: WorkflowStep) => {
    await supabase
      .from("workflow_steps")
      .update({ is_active: !step.is_active })
      .eq("id", step.id);
    setSteps((prev) =>
      prev.map((s) => s.id === step.id ? { ...s, is_active: !s.is_active } : s)
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Workflow client" showBack />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <Text variant="muted" className="text-sm leading-relaxed mt-2 mb-4">
          Ces étapes se déclenchent automatiquement quand un contact passe en statut "Client".
        </Text>

        <View className="gap-2 pb-8">
          {steps.map((step, index) => (
            <Card key={step.id} padding="sm">
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {/* Numéro */}
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: step.is_active ? "#6ee7b7" : "#1e293b", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: step.is_active ? "#0f172a" : "#475569" }}>
                    {index + 1}
                  </Text>
                </View>

                {/* Infos */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: step.is_active ? "#f1f5f9" : "#475569" }}>
                    {step.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#64748b" }}>
                    J+{step.delay_days} · {INTERACTION_LABELS[step.interaction_type as InteractionType]}
                  </Text>
                </View>

                {/* Toggle */}
                <TouchableOpacity onPress={() => toggleStep(step)}>
                  <Feather
                    name={step.is_active ? "toggle-right" : "toggle-left"}
                    size={24}
                    color={step.is_active ? "#6ee7b7" : "#475569"}
                  />
                </TouchableOpacity>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

Ajouter le lien dans `app/(app)/profile.tsx` :

```tsx
<TouchableOpacity
  onPress={() => router.push("/(app)/profile/workflow")}
  className="flex-row items-center gap-3 py-3 px-1"
>
  <Feather name="git-branch" size={18} color="#475569" />
  <Text className="flex-1 text-sm">Workflow client</Text>
  <Feather name="chevron-right" size={16} color="#475569" />
</TouchableOpacity>
```

---

### 9. Exporter les nouveaux composants

Mettre à jour `components/contacts/index.ts` :

```ts
export { WorkflowTimeline } from "./WorkflowTimeline";
```

---

## Critères de validation

- [ ] Passer un contact en "Client" (via swipe ou arc) crée automatiquement les tâches workflow
- [ ] La timeline apparaît sur la fiche contact uniquement pour les clients
- [ ] Les tâches en retard s'affichent en rouge
- [ ] Cocher une tâche la marque comme complétée avec la date
- [ ] Les notifications push arrivent à 9h les jours prévus
- [ ] Retirer le statut "Client" propose d'annuler le workflow
- [ ] L'écran Paramètres → Workflow client permet d'activer/désactiver les étapes
- [ ] Si un contact redevient client, le workflow ne se redéclenche pas (vérification en base)
- [ ] La barre de progression reflète le % d'étapes complétées
- [ ] Aucune erreur TypeScript

---

## Note — Personnalisation avancée (v2)

Pour une future version, tu pourras permettre à l'utilisateur de :
- Modifier le nom et le délai de chaque étape
- Ajouter / supprimer des étapes
- Créer plusieurs workflows selon le type de client
- Déclencher un workflow manuellement depuis la fiche contact

Pour l'instant le workflow est configurable (activer/désactiver les étapes)
mais pas entièrement éditable — c'est le bon équilibre pour un MVP.
