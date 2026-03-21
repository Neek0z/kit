# KIT — Centre de notifications (cloche en haut de la home)

## Contexte

App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
Le redesign UI global Sleek a été effectué.

On ajoute une cloche de notifications en haut à droite du dashboard
qui ouvre un centre de notifications centralisé.

---

## Sources de notifications à agréger

1. **Relances en retard** — contacts dont `next_follow_up < now()`
2. **Tâches en retard** — `contact_tasks` dont `due_date < now()` et `completed_at IS NULL`
3. **Étapes workflow en retard** — `workflow_tasks` dont `due_date < now()` et `completed_at IS NULL`
4. **Nouveaux messages** — messages non lus dans les conversations
5. **RDV du jour** — appointments dont `scheduled_at` est aujourd'hui

---

## ÉTAPE 1 — Hook useNotificationCenter

Créer `hooks/useNotificationCenter.ts` :

```ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

export type NotificationItem = {
  id: string;
  type: "follow_up" | "task" | "workflow" | "message" | "appointment";
  title: string;
  subtitle: string;
  contactId?: string;
  contactName?: string;
  route: string;
  createdAt: Date;
  isUrgent: boolean;
};

export function useNotificationCenter() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    let mounted = true;
    const now = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const items: NotificationItem[] = [];

    // 1. Relances en retard
    const { data: overdueFollowUps } = await supabase
      .from("contacts")
      .select("id, full_name, next_follow_up")
      .eq("user_id", user.id)
      .lt("next_follow_up", now)
      .not("next_follow_up", "is", null)
      .order("next_follow_up", { ascending: true })
      .limit(10);

    (overdueFollowUps ?? []).forEach((c) => {
      const daysLate = Math.floor(
        (Date.now() - new Date(c.next_follow_up).getTime()) / 86400000
      );
      items.push({
        id: `followup-${c.id}`,
        type: "follow_up",
        title: c.full_name,
        subtitle: daysLate === 0
          ? "Relance prévue aujourd'hui"
          : `En retard de ${daysLate} jour${daysLate > 1 ? "s" : ""}`,
        contactId: c.id,
        contactName: c.full_name,
        route: `/(app)/contacts/${c.id}`,
        createdAt: new Date(c.next_follow_up),
        isUrgent: daysLate >= 1,
      });
    });

    // 2. Tâches en retard
    const { data: overdueTasks } = await supabase
      .from("contact_tasks")
      .select("id, title, due_date, contact_id, contacts(full_name)")
      .eq("user_id", user.id)
      .lt("due_date", now)
      .is("completed_at", null)
      .order("due_date", { ascending: true })
      .limit(10);

    (overdueTasks ?? []).forEach((t: any) => {
      items.push({
        id: `task-${t.id}`,
        type: "task",
        title: t.title,
        subtitle: `Tâche en retard · ${t.contacts?.full_name ?? ""}`,
        contactId: t.contact_id,
        contactName: t.contacts?.full_name,
        route: `/(app)/contacts/${t.contact_id}`,
        createdAt: new Date(t.due_date),
        isUrgent: true,
      });
    });

    // 3. Étapes workflow en retard
    const { data: overdueWorkflow } = await supabase
      .from("workflow_tasks")
      .select("id, title, due_date, contact_id, contacts(full_name)")
      .eq("user_id", user.id)
      .lt("due_date", now)
      .is("completed_at", null)
      .order("due_date", { ascending: true })
      .limit(5);

    (overdueWorkflow ?? []).forEach((w: any) => {
      items.push({
        id: `workflow-${w.id}`,
        type: "workflow",
        title: w.title,
        subtitle: `Étape workflow · ${w.contacts?.full_name ?? ""}`,
        contactId: w.contact_id,
        contactName: w.contacts?.full_name,
        route: `/(app)/contacts/${w.contact_id}`,
        createdAt: new Date(w.due_date),
        isUrgent: true,
      });
    });

    // 4. Messages non lus
    const { data: unreadMessages } = await supabase
      .from("messages")
      .select("id, content, created_at, conversation_id, sender_id")
      .neq("sender_id", user.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5);

    (unreadMessages ?? []).forEach((m) => {
      items.push({
        id: `message-${m.id}`,
        type: "message",
        title: "Nouveau message",
        subtitle: m.content.length > 50 ? `${m.content.substring(0, 50)}...` : m.content,
        route: `/(app)/messages/${m.conversation_id}`,
        createdAt: new Date(m.created_at),
        isUrgent: false,
      });
    });

    // 5. RDV du jour
    const { data: todayAppts } = await supabase
      .from("appointments")
      .select("id, title, scheduled_at, contact_id, contacts(full_name)")
      .eq("user_id", user.id)
      .gte("scheduled_at", todayStart.toISOString())
      .lte("scheduled_at", todayEnd.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5);

    (todayAppts ?? []).forEach((a: any) => {
      const time = new Date(a.scheduled_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit",
      });
      items.push({
        id: `appt-${a.id}`,
        type: "appointment",
        title: a.contacts?.full_name ?? a.title ?? "Rendez-vous",
        subtitle: `RDV aujourd'hui à ${time}`,
        contactId: a.contact_id,
        contactName: a.contacts?.full_name,
        route: `/(app)/calendar`,
        createdAt: new Date(a.scheduled_at),
        isUrgent: false,
      });
    });

    // Trier : urgents d'abord, puis par date
    items.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    if (mounted) {
      setNotifications(items);
      setLoading(false);
    }

    return () => { mounted = false; };
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const totalCount = notifications.length;
  const urgentCount = notifications.filter((n) => n.isUrgent).length;
  const hasUnread = totalCount > 0;

  return {
    notifications,
    loading,
    totalCount,
    urgentCount,
    hasUnread,
    refetch: fetchNotifications,
  };
}
```

---

## ÉTAPE 2 — Écran NotificationCenter

Créer `app/(app)/notifications.tsx` :

```tsx
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "../../components/ui";
import { useNotificationCenter, NotificationItem } from "../../hooks/useNotificationCenter";
import { useTheme } from "../../lib/theme";

const NOTIF_CONFIG = {
  follow_up:   { icon: "bell",        color: "#f87171", bg: "#fef2f2", label: "Relance" },
  task:        { icon: "check-square", color: "#f59e0b", bg: "#fffbeb", label: "Tâche" },
  workflow:    { icon: "git-branch",   color: "#818cf8", bg: "#f5f3ff", label: "Workflow" },
  message:     { icon: "message-circle", color: "#10b981", bg: "#f0fdf4", label: "Message" },
  appointment: { icon: "calendar",    color: "#0ea5e9", bg: "#f0f9ff", label: "RDV" },
} as const;

function NotificationRow({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const theme = useTheme();
  const config = NOTIF_CONFIG[item.type];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row", alignItems: "center", gap: 14,
        paddingVertical: 14, paddingHorizontal: 20,
      }}
      activeOpacity={0.7}
    >
      {/* Icône */}
      <View style={{
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: config.bg,
        alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Feather name={config.icon as any} size={18} color={config.color} />
      </View>

      {/* Contenu */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary, flex: 1 }} numberOfLines={1}>
            {item.title}
          </Text>
          {item.isUrgent && (
            <View style={{ backgroundColor: "#fef2f2", borderRadius: 100, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: "#ef4444" }}>URGENT</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: theme.textMuted }} numberOfLines={1}>
          {item.subtitle}
        </Text>
      </View>

      <Feather name="chevron-right" size={16} color={theme.textHint} />
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const { notifications, loading, urgentCount } = useNotificationCenter();

  // Grouper par type
  const groups = [
    { key: "follow_up",   label: "Relances",   icon: "bell" },
    { key: "task",        label: "Tâches",      icon: "check-square" },
    { key: "workflow",    label: "Workflow",    icon: "git-branch" },
    { key: "appointment", label: "RDV du jour", icon: "calendar" },
    { key: "message",     label: "Messages",    icon: "message-circle" },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fb" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}
        >
          <Feather name="arrow-left" size={18} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: theme.textPrimary }}>
          Notifications
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#10b981" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" }}>
            <Feather name="bell" size={28} color="#10b981" />
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary }}>
            Tout est à jour !
          </Text>
          <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: "center", paddingHorizontal: 40 }}>
            Aucune notification en attente. Bon travail ! 🎉
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Résumé urgent */}
          {urgentCount > 0 && (
            <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: "#fef2f2", borderRadius: 16, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Feather name="alert-circle" size={20} color="#ef4444" />
              <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#ef4444" }}>
                {urgentCount} action{urgentCount > 1 ? "s" : ""} urgente{urgentCount > 1 ? "s" : ""} à traiter
              </Text>
            </View>
          )}

          {/* Groupes */}
          {groups.map((group) => {
            const groupItems = notifications.filter((n) => n.type === group.key);
            if (groupItems.length === 0) return null;

            return (
              <View key={group.key} style={{ marginBottom: 8 }}>
                {/* Header groupe */}
                <Text style={{ fontSize: 11, fontWeight: "600", color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 20, paddingVertical: 8 }}>
                  {group.label} ({groupItems.length})
                </Text>

                {/* Items */}
                <View style={{ backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
                  {groupItems.map((item, i) => (
                    <View key={item.id}>
                      <NotificationRow
                        item={item}
                        onPress={() => router.push(item.route as any)}
                      />
                      {i < groupItems.length - 1 && (
                        <View style={{ height: 1, backgroundColor: "#f1f5f9", marginLeft: 78 }} />
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
```

---

## ÉTAPE 3 — Cloche dans le header du Dashboard

Dans `app/(app)/index.tsx`, modifier le header pour ajouter la cloche
à gauche du bouton `+` :

```tsx
// Importer le hook
import { useNotificationCenter } from "../../hooks/useNotificationCenter";

// Dans le composant
const { totalCount, urgentCount, hasUnread } = useNotificationCenter();

// Dans le JSX — header
<View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
  
  {/* Cloche à gauche */}
  <TouchableOpacity
    onPress={() => router.push("/(app)/notifications" as AppRoute)}
    style={{ position: "relative", width: 42, height: 42, borderRadius: 21, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, marginTop: 4 }}
  >
    <Feather name="bell" size={20} color={urgentCount > 0 ? "#ef4444" : theme.textMuted} />
    
    {/* Badge compteur */}
    {hasUnread && (
      <View style={{
        position: "absolute", top: -2, right: -2,
        minWidth: 18, height: 18, borderRadius: 9,
        backgroundColor: urgentCount > 0 ? "#ef4444" : "#10b981",
        alignItems: "center", justifyContent: "center",
        paddingHorizontal: 4,
        borderWidth: 2, borderColor: "#f8f9fb",
      }}>
        <Text style={{ fontSize: 9, fontWeight: "800", color: "#fff" }}>
          {totalCount > 99 ? "99+" : totalCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>

  {/* Greeting centré */}
  <View style={{ flex: 1, alignItems: "center" }}>
    <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
      {getGreeting()}, {firstName}
    </Text>
    <Text style={{ fontSize: 30, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>
      Dashboard
    </Text>
  </View>

  {/* Avatar utilisateur à droite */}
  <TouchableOpacity
    onPress={() => router.push("/(app)/profile" as AppRoute)}
    style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center", marginTop: 4 }}
  >
    <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
      {firstName?.[0]?.toUpperCase()}
    </Text>
  </TouchableOpacity>
</View>
```

---

## ÉTAPE 4 — Ajouter la route dans le router

Vérifier que `app/(app)/notifications.tsx` est bien accessible.
Si le layout `app/(app)/_layout.tsx` utilise des `Tabs`, ajouter :

```tsx
<Tabs.Screen
  name="notifications"
  options={{ href: null }} // caché de la tab bar mais accessible via router.push
/>
```

---

## Critères de validation

- [ ] La cloche apparaît en haut à gauche du dashboard
- [ ] Le badge rouge s'affiche avec le nombre si notifications urgentes
- [ ] Le badge vert s'affiche si notifications non urgentes seulement
- [ ] Tap sur la cloche ouvre l'écran notifications
- [ ] Les relances en retard apparaissent dans "Relances"
- [ ] Les tâches en retard apparaissent dans "Tâches"
- [ ] Les étapes workflow en retard apparaissent dans "Workflow"
- [ ] Les messages non lus apparaissent dans "Messages"
- [ ] Les RDV du jour apparaissent dans "RDV du jour"
- [ ] Tap sur une notification navigue vers le bon écran
- [ ] État vide "Tout est à jour !" si aucune notification
- [ ] Aucune erreur TypeScript
