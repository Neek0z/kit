# KIT — Synchronisation calendrier téléphone

## Contexte

On ajoute la synchronisation bidirectionnelle entre le calendrier KIT
et le calendrier natif du téléphone (Google Calendar sur Android, Apple Calendar sur iOS).
L'utilisateur choisit quels événements synchroniser.

---

## Ce que tu dois faire

### 1. Installer expo-calendar

```bash
npx expo install expo-calendar --legacy-peer-deps
```

Ajouter dans `app.json` → plugins :

```json
[
  "expo-calendar",
  {
    "calendarPermission": "KIT accède à ton calendrier pour synchroniser tes rendez-vous.",
    "remindersPermission": "KIT accède à tes rappels pour synchroniser tes tâches."
  }
]
```

---

### 2. Mettre à jour la table appointments (RDV existants)

```sql
-- Ajouter les champs de sync sur la table des RDV existante
-- (adapte le nom de la table si différent de "appointments")
alter table public.appointments
  add column if not exists calendar_event_id text,
  add column if not exists sync_to_calendar boolean default false,
  add column if not exists calendar_id text;

-- Table pour stocker les préférences de sync
create table if not exists public.calendar_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  sync_enabled boolean default false,
  calendar_id text,
  calendar_name text,
  sync_direction text default 'both' check (sync_direction in ('export', 'import', 'both')),
  auto_sync boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.calendar_preferences enable row level security;

create policy "Users can manage own calendar preferences"
  on public.calendar_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger calendar_preferences_updated_at
  before update on public.calendar_preferences
  for each row execute procedure public.handle_updated_at();
```

---

### 3. Service de calendrier

Créer `lib/calendarService.ts` :

```ts
import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

export interface CalendarInfo {
  id: string;
  name: string;
  color: string;
  isPrimary: boolean;
}

// Demander les permissions
export async function requestCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === "granted";
}

// Vérifier les permissions
export async function checkCalendarPermissions(): Promise<boolean> {
  const { status } = await Calendar.getCalendarPermissionsAsync();
  return status === "granted";
}

// Lister les calendriers disponibles
export async function getAvailableCalendars(): Promise<CalendarInfo[]> {
  const granted = await requestCalendarPermissions();
  if (!granted) return [];

  const calendars = await Calendar.getCalendarsAsync(
    Calendar.EntityTypes.EVENT
  );

  return calendars
    .filter((c) => c.allowsModifications)
    .map((c) => ({
      id: c.id,
      name: c.title,
      color: c.color ?? "#6ee7b7",
      isPrimary: c.isPrimary ?? false,
    }));
}

// Obtenir le calendrier par défaut
export async function getDefaultCalendar(): Promise<CalendarInfo | null> {
  const calendars = await getAvailableCalendars();
  return calendars.find((c) => c.isPrimary) ?? calendars[0] ?? null;
}

// Créer un calendrier KIT dédié (optionnel)
export async function createKITCalendar(): Promise<string | null> {
  const granted = await requestCalendarPermissions();
  if (!granted) return null;

  try {
    const defaultCalendar = await getDefaultCalendar();
    if (!defaultCalendar) return null;

    const calendarId = await Calendar.createCalendarAsync({
      title: "KIT — Keep in Touch",
      color: "#6ee7b7",
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: Platform.OS === "ios" ? defaultCalendar.id : undefined,
      source: Platform.OS === "android" ? {
        isLocalAccount: true,
        name: "KIT",
        type: Calendar.CalendarType.LOCAL,
      } : undefined,
      name: "KIT",
      ownerAccount: "KIT",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });

    return calendarId;
  } catch {
    return null;
  }
}

// Exporter un RDV KIT vers le calendrier téléphone
export async function exportEventToCalendar(
  calendarId: string,
  event: {
    title: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
    location?: string;
  }
): Promise<string | null> {
  const granted = await checkCalendarPermissions();
  if (!granted) return null;

  try {
    const eventId = await Calendar.createEventAsync(calendarId, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      notes: event.notes,
      location: event.location,
      alarms: [{ relativeOffset: -30 }], // Rappel 30 min avant
    });
    return eventId;
  } catch {
    return null;
  }
}

// Mettre à jour un événement existant dans le calendrier
export async function updateCalendarEvent(
  eventId: string,
  event: {
    title: string;
    startDate: Date;
    endDate: Date;
    notes?: string;
  }
): Promise<boolean> {
  const granted = await checkCalendarPermissions();
  if (!granted) return false;

  try {
    await Calendar.updateEventAsync(eventId, {
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      notes: event.notes,
    });
    return true;
  } catch {
    return false;
  }
}

// Supprimer un événement du calendrier
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const granted = await checkCalendarPermissions();
  if (!granted) return false;

  try {
    await Calendar.deleteEventAsync(eventId);
    return true;
  } catch {
    return false;
  }
}

// Importer les événements du calendrier téléphone vers KIT
export async function importEventsFromCalendar(
  calendarId: string,
  startDate: Date,
  endDate: Date
): Promise<Calendar.Event[]> {
  const granted = await checkCalendarPermissions();
  if (!granted) return [];

  try {
    const events = await Calendar.getEventsAsync(
      [calendarId],
      startDate,
      endDate
    );
    return events;
  } catch {
    return [];
  }
}
```

---

### 4. Hook useCalendarSync

Créer `hooks/useCalendarSync.ts` :

```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import {
  CalendarInfo,
  getAvailableCalendars,
  exportEventToCalendar,
  updateCalendarEvent,
  deleteCalendarEvent,
  requestCalendarPermissions,
} from "../lib/calendarService";

interface CalendarPreferences {
  sync_enabled: boolean;
  calendar_id: string | null;
  calendar_name: string | null;
  sync_direction: "export" | "import" | "both";
  auto_sync: boolean;
}

export function useCalendarSync() {
  const { user } = useAuthContext();
  const [prefs, setPrefs] = useState<CalendarPreferences | null>(null);
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Charger les préférences
    supabase
      .from("calendar_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setPrefs(data ?? {
          sync_enabled: false,
          calendar_id: null,
          calendar_name: null,
          sync_direction: "both",
          auto_sync: true,
        });
        setLoading(false);
      });
  }, [user]);

  const requestPermissions = async (): Promise<boolean> => {
    const granted = await requestCalendarPermissions();
    setPermissionGranted(granted);
    if (granted) {
      const available = await getAvailableCalendars();
      setCalendars(available);
    }
    return granted;
  };

  const savePreferences = async (newPrefs: Partial<CalendarPreferences>): Promise<boolean> => {
    if (!user) return false;

    const updated = { ...prefs, ...newPrefs };

    const { error } = await supabase
      .from("calendar_preferences")
      .upsert({
        user_id: user.id,
        ...updated,
        updated_at: new Date().toISOString(),
      });

    if (error) return false;
    setPrefs(updated as CalendarPreferences);
    return true;
  };

  const syncEventToCalendar = async (
    appointmentId: string,
    event: {
      title: string;
      startDate: Date;
      endDate: Date;
      notes?: string;
      existingCalendarEventId?: string;
    }
  ): Promise<string | null> => {
    if (!prefs?.sync_enabled || !prefs?.calendar_id) return null;
    if (prefs.sync_direction === "import") return null;

    // Mettre à jour si déjà exporté
    if (event.existingCalendarEventId) {
      const updated = await updateCalendarEvent(event.existingCalendarEventId, event);
      return updated ? event.existingCalendarEventId : null;
    }

    // Créer le nouvel événement
    const eventId = await exportEventToCalendar(prefs.calendar_id, event);

    if (eventId) {
      // Sauvegarder l'ID dans Supabase
      await supabase
        .from("appointments")
        .update({ calendar_event_id: eventId, sync_to_calendar: true })
        .eq("id", appointmentId);
    }

    return eventId;
  };

  const removeEventFromCalendar = async (calendarEventId: string): Promise<void> => {
    if (!calendarEventId) return;
    await deleteCalendarEvent(calendarEventId);
  };

  return {
    prefs,
    calendars,
    loading,
    permissionGranted,
    requestPermissions,
    savePreferences,
    syncEventToCalendar,
    removeEventFromCalendar,
  };
}
```

---

### 5. Écran paramètres calendrier

Créer `app/(app)/profile/calendar.tsx` :

```tsx
import { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Card } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useCalendarSync } from "../../../hooks/useCalendarSync";
import { useTheme } from "../../../lib/theme";
import { getAvailableCalendars, CalendarInfo } from "../../../lib/calendarService";

export default function CalendarSettingsScreen() {
  const theme = useTheme();
  const { prefs, loading, requestPermissions, savePreferences, permissionGranted } = useCalendarSync();
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [saving, setSaving] = useState(false);

  const handleEnableSync = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          "Permission refusée",
          "Autorise KIT à accéder à ton calendrier dans les réglages de ton téléphone.",
          [{ text: "OK" }]
        );
        return;
      }
      const available = await getAvailableCalendars();
      setCalendars(available);

      // Sélectionner automatiquement le calendrier principal
      const primary = available.find((c) => c.isPrimary) ?? available[0];
      if (primary) {
        await savePreferences({
          sync_enabled: true,
          calendar_id: primary.id,
          calendar_name: primary.name,
        });
      }
    } else {
      await savePreferences({ sync_enabled: false });
    }
  };

  const handleSelectCalendar = async (calendar: CalendarInfo) => {
    setSaving(true);
    await savePreferences({
      calendar_id: calendar.id,
      calendar_name: calendar.name,
    });
    setSaving(false);
  };

  const handleDirectionChange = async (direction: "export" | "import" | "both") => {
    setSaving(true);
    await savePreferences({ sync_direction: direction });
    setSaving(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <Header title="Synchronisation calendrier" showBack />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View style={{ gap: 16, paddingTop: 8, paddingBottom: 32 }}>

          {/* Toggle principal */}
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textPrimary, marginBottom: 3 }}>
                  Synchroniser avec le calendrier
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 17 }}>
                  Tes RDV KIT apparaîtront dans ton calendrier téléphone et inversement.
                </Text>
              </View>
              <Switch
                value={prefs?.sync_enabled ?? false}
                onValueChange={handleEnableSync}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#f1f5f9"
              />
            </View>
          </Card>

          {prefs?.sync_enabled && (
            <>
              {/* Calendrier sélectionné */}
              <Card>
                <Text style={{
                  fontSize: 11, color: theme.textHint,
                  textTransform: "uppercase", letterSpacing: 0.8,
                  fontWeight: "600", marginBottom: 10,
                }}>
                  Calendrier utilisé
                </Text>

                {calendars.length === 0 ? (
                  <TouchableOpacity
                    onPress={async () => {
                      const available = await getAvailableCalendars();
                      setCalendars(available);
                    }}
                    style={{
                      paddingVertical: 10,
                      flexDirection: "row", alignItems: "center", gap: 8,
                    }}
                  >
                    <Feather name="refresh-cw" size={14} color={theme.primary} />
                    <Text style={{ fontSize: 13, color: theme.primary }}>Charger les calendriers</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ gap: 8 }}>
                    {calendars.map((cal) => {
                      const isSelected = prefs?.calendar_id === cal.id;
                      return (
                        <TouchableOpacity
                          key={cal.id}
                          onPress={() => handleSelectCalendar(cal)}
                          style={{
                            flexDirection: "row", alignItems: "center", gap: 12,
                            padding: 10, borderRadius: 12,
                            backgroundColor: isSelected ? theme.primaryBg : theme.bg,
                            borderWidth: 1,
                            borderColor: isSelected ? theme.primaryBorder : theme.border,
                          }}
                        >
                          <View style={{
                            width: 14, height: 14, borderRadius: 7,
                            backgroundColor: cal.color,
                          }} />
                          <Text style={{
                            flex: 1, fontSize: 14,
                            color: isSelected ? theme.primary : theme.textPrimary,
                            fontWeight: isSelected ? "600" : "400",
                          }}>
                            {cal.name}
                            {cal.isPrimary ? " (principal)" : ""}
                          </Text>
                          {isSelected && (
                            <Feather name="check" size={15} color={theme.primary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </Card>

              {/* Direction de sync */}
              <Card>
                <Text style={{
                  fontSize: 11, color: theme.textHint,
                  textTransform: "uppercase", letterSpacing: 0.8,
                  fontWeight: "600", marginBottom: 10,
                }}>
                  Direction de synchronisation
                </Text>

                {[
                  { value: "both", label: "Bidirectionnelle", desc: "KIT ↔ Calendrier téléphone", icon: "refresh-cw" },
                  { value: "export", label: "KIT → Calendrier", desc: "Exporte les RDV KIT vers ton téléphone", icon: "upload" },
                  { value: "import", label: "Calendrier → KIT", desc: "Importe les événements du téléphone dans KIT", icon: "download" },
                ].map((option) => {
                  const isSelected = prefs?.sync_direction === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleDirectionChange(option.value as "export" | "import" | "both")}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 12,
                        padding: 10, borderRadius: 12, marginBottom: 6,
                        backgroundColor: isSelected ? theme.primaryBg : "transparent",
                        borderWidth: 1,
                        borderColor: isSelected ? theme.primaryBorder : "transparent",
                      }}
                    >
                      <Feather
                        name={option.icon as any}
                        size={16}
                        color={isSelected ? theme.primary : theme.textMuted}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 14, fontWeight: isSelected ? "600" : "400",
                          color: isSelected ? theme.primary : theme.textPrimary,
                        }}>
                          {option.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>
                          {option.desc}
                        </Text>
                      </View>
                      {isSelected && (
                        <Feather name="check" size={15} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </Card>

              {/* Sync auto */}
              <Card>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary, marginBottom: 2 }}>
                      Synchronisation automatique
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted }}>
                      Sync automatique à chaque création ou modification de RDV.
                    </Text>
                  </View>
                  <Switch
                    value={prefs?.auto_sync ?? true}
                    onValueChange={(val) => savePreferences({ auto_sync: val })}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#f1f5f9"
                  />
                </View>
              </Card>
            </>
          )}

          {/* Info */}
          <View style={{
            padding: 12, borderRadius: 12,
            backgroundColor: "rgba(110,231,183,0.06)",
            borderWidth: 1, borderColor: "rgba(110,231,183,0.15)",
          }}>
            <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 18 }}>
              💡 Les événements importés depuis ton calendrier n'affectent pas tes données KIT.
              Tu peux désactiver la sync à tout moment sans perdre tes RDV.
            </Text>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 6. Intégrer la sync dans la création de RDV

Dans le fichier qui gère la création de RDV (probablement `app/(app)/calendar/new.tsx` ou similaire), ajouter la sync automatique après la création :

```tsx
import { useCalendarSync } from "../../../hooks/useCalendarSync";

// Dans le composant
const { prefs, syncEventToCalendar } = useCalendarSync();

// Après la création du RDV dans Supabase
const handleCreate = async () => {
  // ... création du RDV dans Supabase (code existant)

  // Sync automatique si activée
  if (prefs?.sync_enabled && prefs?.auto_sync) {
    await syncEventToCalendar(newAppointment.id, {
      title: `KIT — ${contactName} : ${title}`,
      startDate: new Date(startDate),
      endDate: new Date(endDate ?? startDate),
      notes: notes,
    });
  }
};
```

---

### 7. Bouton sync manuel sur un RDV

Dans la vue détail d'un RDV existant, ajouter un bouton pour sync manuelle :

```tsx
const { prefs, syncEventToCalendar } = useCalendarSync();
const [syncing, setSyncing] = useState(false);

const handleManualSync = async () => {
  setSyncing(true);
  const eventId = await syncEventToCalendar(appointment.id, {
    title: `KIT — ${appointment.title}`,
    startDate: new Date(appointment.start_date),
    endDate: new Date(appointment.end_date ?? appointment.start_date),
    notes: appointment.notes,
    existingCalendarEventId: appointment.calendar_event_id,
  });
  setSyncing(false);

  if (eventId) {
    Alert.alert("✅ Synchronisé", "Le RDV a été ajouté à ton calendrier.");
  }
};

// Dans le JSX
<TouchableOpacity
  onPress={handleManualSync}
  style={{
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 12,
    backgroundColor: appointment.calendar_event_id
      ? "rgba(110,231,183,0.08)"
      : theme.surface,
    borderWidth: 1,
    borderColor: appointment.calendar_event_id
      ? "rgba(110,231,183,0.25)"
      : theme.border,
  }}
>
  {syncing ? (
    <ActivityIndicator size="small" color={theme.primary} />
  ) : (
    <Feather
      name={appointment.calendar_event_id ? "check-circle" : "calendar"}
      size={16}
      color={appointment.calendar_event_id ? theme.primary : theme.textMuted}
    />
  )}
  <Text style={{
    fontSize: 13, fontWeight: "500",
    color: appointment.calendar_event_id ? theme.primary : theme.textMuted,
  }}>
    {appointment.calendar_event_id ? "Synchronisé avec le calendrier" : "Ajouter au calendrier"}
  </Text>
</TouchableOpacity>
```

---

### 8. Lien depuis le Profil

Dans `app/(app)/profile.tsx`, ajouter dans la section Paramètres :

```tsx
<TouchableOpacity
  onPress={() => router.push("/(app)/profile/calendar")}
  style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 4 }}
>
  <Feather name="calendar" size={18} color="#475569" />
  <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>Synchronisation calendrier</Text>
  {prefs?.sync_enabled && (
    <View style={{
      backgroundColor: theme.primaryBg,
      borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3,
      borderWidth: 1, borderColor: theme.primaryBorder,
    }}>
      <Text style={{ fontSize: 10, fontWeight: "600", color: theme.primary }}>Actif</Text>
    </View>
  )}
  <Feather name="chevron-right" size={16} color="#475569" />
</TouchableOpacity>
```

---

## Critères de validation

- [ ] `expo-calendar` installé et permissions déclarées dans `app.json`
- [ ] L'écran "Synchronisation calendrier" est accessible depuis le Profil
- [ ] Le toggle demande la permission calendrier au premier activation
- [ ] La liste des calendriers du téléphone s'affiche correctement
- [ ] La sélection d'un calendrier se sauvegarde
- [ ] Les 3 directions de sync sont sélectionnables
- [ ] La sync auto crée bien un événement dans le calendrier téléphone à la création d'un RDV
- [ ] Le bouton sync manuel sur un RDV fonctionne
- [ ] Un RDV déjà synchronisé affiche "Synchronisé" en vert
- [ ] Désactiver la sync ne supprime pas les événements déjà exportés
- [ ] Aucune erreur TypeScript

---

## Note importante

La sync bidirectionnelle complète (import automatique depuis le calendrier téléphone)
nécessite un accès en lecture continue au calendrier système.
Pour le MVP, l'import se fait manuellement depuis l'écran Calendrier KIT
via un bouton "Importer depuis mon calendrier" qui lit les événements
de la période affichée.
