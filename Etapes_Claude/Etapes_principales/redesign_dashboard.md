# KIT — Redesign Dashboard (Homepage)

## Contexte

On restructure complètement le dashboard pour le rendre plus actionnable.
4 nouvelles sections : Streak, Aujourd'hui, RDV à venir, Raccourcis rapides.
Toute la logique existante (hooks, données) est conservée.

---

## Nouvelle structure

```
Header (Bonjour + date + bouton +)
Ligne décorative
─────────────────────────────
Streak + Stats (côte à côte)
Section "Aujourd'hui" (contacts à relancer)
Mini calendrier RDV à venir
Raccourcis rapides (grille 2x2)
─────────────────────────────
```

---

## Ce que tu dois faire

### 1. Hook useStreak

Créer `hooks/useStreak.ts` :

```ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

interface StreakData {
  currentStreak: number;
  weekDays: boolean[]; // 7 jours, lundi à dimanche
  lastActivityDate: string | null;
}

export function useStreak() {
  const { user } = useAuthContext();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    weekDays: [false, false, false, false, false, false, false],
    lastActivityDate: null,
  });

  useEffect(() => {
    if (!user) return;
    loadStreak();
  }, [user]);

  const loadStreak = async () => {
    if (!user) return;

    // Récupérer les interactions des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: interactions } = await supabase
      .from("interactions")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!interactions || interactions.length === 0) {
      setStreak({ currentStreak: 0, weekDays: [false,false,false,false,false,false,false], lastActivityDate: null });
      return;
    }

    // Calculer les jours uniques avec activité
    const activeDays = new Set(
      interactions.map((i) => new Date(i.created_at).toDateString())
    );

    // Calculer le streak actuel
    let currentStreak = 0;
    const today = new Date();
    let checkDate = new Date(today);

    while (activeDays.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Si pas d'activité aujourd'hui, vérifier hier
    if (currentStreak === 0) {
      checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
      while (activeDays.has(checkDate.toDateString())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calculer les 7 jours de la semaine en cours (lundi à dimanche)
    const weekDays: boolean[] = [];
    const monday = new Date(today);
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    monday.setDate(today.getDate() - daysFromMonday);

    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(activeDays.has(day.toDateString()));
    }

    const lastActivity = interactions[0]?.created_at ?? null;

    setStreak({ currentStreak, weekDays, lastActivityDate: lastActivity });
  };

  return { ...streak, reload: loadStreak };
}
```

---

### 2. Hook useUpcomingAppointments

Créer `hooks/useUpcomingAppointments.ts` :

```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

export interface UpcomingAppointment {
  id: string;
  title: string;
  start_date: string;
  contact_name?: string;
  contact_id?: string;
}

export function useUpcomingAppointments(limit = 3) {
  const { user } = useAuthContext();
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const now = new Date().toISOString();

    // Adapter le nom de la table selon ce qui existe dans le projet
    // (appointments ou events ou rdv)
    supabase
      .from("appointments")
      .select("id, title, start_date, contact_id, contacts(full_name)")
      .eq("user_id", user.id)
      .gte("start_date", now)
      .order("start_date", { ascending: true })
      .limit(limit)
      .then(({ data }) => {
        setAppointments(
          (data ?? []).map((a: any) => ({
            id: a.id,
            title: a.title,
            start_date: a.start_date,
            contact_name: a.contacts?.full_name,
            contact_id: a.contact_id,
          }))
        );
        setLoading(false);
      });
  }, [user, limit]);

  return { appointments, loading };
}
```

---

### 3. Remplacer complètement app/(app)/index.tsx

```tsx
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, Card, Avatar } from "../../components/ui";
import { StatusPill } from "../../components/ui/StatusPill";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";
import { useSubscription } from "../../hooks/useSubscription";
import { useStreak } from "../../hooks/useStreak";
import { useUpcomingAppointments } from "../../hooks/useUpcomingAppointments";
import { useTheme } from "../../lib/theme";
import { Contact } from "../../types";

const WEEK_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { isPro } = useSubscription();
  const { totalContacts, toFollowUp, byStatus, overdueFollowUps, loading } = useDashboard();
  const { currentStreak, weekDays } = useStreak();
  const { appointments } = useUpcomingAppointments(3);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  // Contacts à traiter aujourd'hui (en retard + prévus aujourd'hui)
  const todayContacts = toFollowUp.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* Ligne décorative */}
      <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>

          {/* HEADER */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 18, paddingBottom: 14 }}>
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 3 }}>
                Bonjour {firstName} 👋
              </Text>
              <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1, lineHeight: 30 }}>
                Dashboard
              </Text>
              <Text style={{ fontSize: 12, color: theme.textHint, marginTop: 4, textTransform: "capitalize" }}>
                {today}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(app)/contacts/new")}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: theme.primaryBg,
                borderWidth: 1, borderColor: theme.primaryBorder,
                alignItems: "center", justifyContent: "center",
                marginTop: 4,
              }}
            >
              <Feather name="plus" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* STREAK + STATS */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>

            {/* Streak */}
            <View style={{
              flex: 1.2,
              backgroundColor: theme.surface,
              borderWidth: 1,
              borderColor: "rgba(251,191,36,0.25)",
              borderRadius: 16,
              padding: 12,
            }}>
              <Text style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 6 }}>
                Streak
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 10 }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#fbbf24", lineHeight: 30 }}>
                  {currentStreak}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted }}>jours</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 3 }}>
                {WEEK_LABELS.map((label, i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      borderRadius: 100,
                      backgroundColor: weekDays[i]
                        ? "#fbbf24"
                        : "rgba(251,191,36,0.1)",
                      borderWidth: weekDays[i] ? 0 : 1,
                      borderColor: "rgba(251,191,36,0.2)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: weekDays[i] ? "#0f172a" : "#fbbf24",
                    }}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Stats mini */}
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{
                flex: 1, backgroundColor: theme.surface,
                borderWidth: 1, borderColor: theme.border,
                borderRadius: 14, padding: 10,
              }}>
                <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 3 }}>
                  Contacts
                </Text>
                <Text style={{ fontSize: 24, fontWeight: "800", color: theme.primary, lineHeight: 26 }}>
                  {totalContacts}
                </Text>
              </View>
              <View style={{
                flex: 1, backgroundColor: theme.surface,
                borderWidth: 1, borderColor: theme.borderAccent,
                borderRadius: 14, padding: 10,
              }}>
                <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 3 }}>
                  Clients
                </Text>
                <Text style={{ fontSize: 24, fontWeight: "800", color: theme.primary, lineHeight: 26 }}>
                  {byStatus.client ?? 0}
                </Text>
              </View>
            </View>
          </View>

          {/* AUJOURD'HUI */}
          {todayContacts.length > 0 && (
            <View style={{
              backgroundColor: "rgba(248,113,113,0.04)",
              borderWidth: 1,
              borderColor: "rgba(248,113,113,0.2)",
              borderRadius: 16,
              padding: 14,
              marginBottom: 10,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 10, color: "#f87171", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
                    Aujourd'hui
                  </Text>
                  <View style={{ backgroundColor: "rgba(248,113,113,0.15)", borderWidth: 1, borderColor: "rgba(248,113,113,0.3)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#f87171" }}>{todayContacts.length}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push("/(app)/contacts")}>
                  <Text style={{ fontSize: 11, color: "#f87171" }}>Voir tout →</Text>
                </TouchableOpacity>
              </View>

              {todayContacts.map((contact, i) => (
                <View key={contact.id}>
                  <TouchableOpacity
                    onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 }}
                    activeOpacity={0.7}
                  >
                    <Avatar name={contact.full_name} status={contact.status} size="md" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textPrimary }}>
                        {contact.full_name}
                      </Text>
                      <Text style={{ fontSize: 11, color: contact.next_follow_up && new Date(contact.next_follow_up) < new Date() ? "#f87171" : theme.textMuted, marginTop: 1 }}>
                        {contact.next_follow_up && new Date(contact.next_follow_up) < new Date()
                          ? `En retard · prévu le ${new Date(contact.next_follow_up).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                          : "Aujourd'hui"
                        }
                      </Text>
                    </View>
                    <StatusPill status={contact.status} size="sm" />
                  </TouchableOpacity>
                  {i < todayContacts.length - 1 && <View style={{ height: 1, backgroundColor: "rgba(248,113,113,0.1)" }} />}
                </View>
              ))}
            </View>
          )}

          {/* RDV À VENIR */}
          <Card style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
                RDV à venir
              </Text>
              <TouchableOpacity onPress={() => router.push("/(app)/calendar")}>
                <Text style={{ fontSize: 11, color: theme.primary }}>+ RDV</Text>
              </TouchableOpacity>
            </View>

            {appointments.length === 0 ? (
              <TouchableOpacity
                onPress={() => router.push("/(app)/calendar")}
                style={{ paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, color: theme.textHint }}>Aucun RDV · tap pour en ajouter</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: "row", gap: 8 }}>
                {appointments.map((apt, i) => {
                  const date = new Date(apt.start_date);
                  const isNext = i === 0;
                  return (
                    <TouchableOpacity
                      key={apt.id}
                      onPress={() => router.push("/(app)/calendar")}
                      style={{
                        flex: 1,
                        backgroundColor: isNext ? theme.primaryBg : theme.bg,
                        borderWidth: 1,
                        borderColor: isNext ? theme.primaryBorder : theme.border,
                        borderRadius: 12,
                        padding: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 10, color: isNext ? theme.primary : theme.textHint, fontWeight: "600", marginBottom: 3, textTransform: "uppercase" }}>
                        {date.toLocaleDateString("fr-FR", { month: "short" })}
                      </Text>
                      <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary, lineHeight: 24 }}>
                        {date.getDate()}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.textMuted, marginTop: 4, textAlign: "center" }} numberOfLines={1}>
                        {apt.contact_name ?? apt.title}
                      </Text>
                      <Text style={{ fontSize: 10, color: isNext ? theme.primary : theme.textHint, marginTop: 2 }}>
                        {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Card>

          {/* RACCOURCIS RAPIDES */}
          <Card>
            <Text style={{ fontSize: 10, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 10 }}>
              Raccourcis
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Nouveau contact",  icon: "user-plus",     color: theme.primary,  route: "/(app)/contacts/new" },
                { label: "Interaction",       icon: "message-circle",color: "#818cf8",       route: null, action: "interaction" },
                { label: "Nouveau RDV",       icon: "calendar",      color: "#fbbf24",       route: "/(app)/calendar" },
                { label: "Message KIT",       icon: "message-square",color: "#22c55e",       route: "/(app)/messages" },
              ].map((shortcut) => (
                <TouchableOpacity
                  key={shortcut.label}
                  onPress={() => shortcut.route ? router.push(shortcut.route as any) : null}
                  style={{
                    width: "47%",
                    backgroundColor: theme.bg,
                    borderWidth: 1,
                    borderColor: `${shortcut.color}20`,
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 9,
                    backgroundColor: `${shortcut.color}15`,
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Feather name={shortcut.icon as any} size={15} color={shortcut.color} />
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: shortcut.color, flex: 1 }} numberOfLines={2}>
                    {shortcut.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Bannière upgrade Free → Pro */}
          {!isPro && totalContacts >= 20 && (
            <TouchableOpacity
              onPress={() => router.push("/(app)/subscription")}
              style={{
                marginTop: 10,
                backgroundColor: "rgba(129,140,248,0.08)",
                borderWidth: 1, borderColor: "rgba(129,140,248,0.2)",
                borderRadius: 14, padding: 12,
                flexDirection: "row", alignItems: "center", gap: 10,
              }}
            >
              <Text style={{ fontSize: 16 }}>✨</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: "500", color: "#818cf8" }}>
                {totalContacts}/25 contacts · Passe à Pro
              </Text>
              <Feather name="chevron-right" size={14} color="#818cf8" />
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Critères de validation

- [ ] Le header affiche la date du jour
- [ ] Le streak affiche le bon nombre de jours consécutifs
- [ ] Les 7 points de la semaine s'affichent en jaune pour les jours actifs
- [ ] La section "Aujourd'hui" s'affiche uniquement si des contacts sont à relancer
- [ ] Les contacts en retard affichent la date en rouge
- [ ] Les 3 prochains RDV s'affichent en cartes horizontales
- [ ] Le premier RDV est mis en avant (bordure verte)
- [ ] Les 4 raccourcis naviguent vers les bons écrans
- [ ] La bannière Pro s'affiche quand on approche 25 contacts
- [ ] Aucune régression sur les données existantes
- [ ] Aucune erreur TypeScript
