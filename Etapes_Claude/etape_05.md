# KIT — etape_05 : Notifications push + Rappels de relance

## Contexte

Pipeline et historique fonctionnels (etape_04 validée).
On ajoute maintenant les notifications push natives — le vrai avantage compétitif vs une PWA.
Un utilisateur peut planifier une relance sur un contact et recevoir un rappel sur son téléphone,
même quand l'app est fermée.

---

## Ce que tu dois faire

### 1. Installer les dépendances

```bash
npx expo install expo-notifications expo-device expo-constants
```

Mettre à jour `app.json` pour ajouter la config notifications :

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#6ee7b7",
          "sounds": []
        }
      ],
      [
        "expo-contacts",
        {
          "contactsPermission": "KIT accède à tes contacts pour les importer facilement."
        }
      ]
    ],
    "android": {
      "useNextNotificationsApi": true
    }
  }
}
```

> **Note :** Crée un fichier `assets/notification-icon.png` (96x96px, fond transparent, icône blanche).
> Pour le dev, une image placeholder suffit.

---

### 2. Service de notifications

Créer `lib/notifications.ts` :

```ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configuration du comportement des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Demander la permission et obtenir le token push
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Les notifications push nécessitent un vrai appareil.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Canal Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("follow-up", {
      name: "Rappels de relance",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6ee7b7",
    });
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

// Planifier une notification locale pour une relance
export async function scheduleFollowUpNotification(
  contactName: string,
  contactId: string,
  date: Date
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Rappel KIT 👋",
      body: `N'oublie pas de relancer ${contactName} aujourd'hui.`,
      data: { contactId },
      sound: true,
    },
    trigger: {
      date,
      channelId: "follow-up",
    },
  });
  return id;
}

// Annuler une notification planifiée
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Annuler toutes les notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Lister les notifications planifiées (debug)
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
```

---

### 3. Ajouter le champ notification_id dans Supabase

```sql
alter table public.contacts
  add column if not exists notification_id text;
```

---

### 4. Mettre à jour le type Contact

Dans `types/index.ts`, ajouter `notification_id` à l'interface Contact :

```ts
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
  notification_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}
```

---

### 5. Hook useNotifications

Créer `hooks/useNotifications.ts` :

```ts
import { useEffect, useRef, useCallback } from "react";
import { AppState } from "react-native";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { registerForPushNotifications } from "../lib/notifications";

export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Demander la permission au démarrage
    registerForPushNotifications();

    // Écouter les notifications reçues quand l'app est ouverte
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("Notification reçue :", notification);
      }
    );

    // Gérer le tap sur une notification → naviguer vers le contact
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const contactId = response.notification.request.content.data?.contactId;
        if (contactId) {
          router.push(`/(app)/contacts/${contactId}`);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
```

Mettre à jour `app/_layout.tsx` pour initialiser les notifications :

```tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import "../global.css";

function AppWithNotifications() {
  useNotifications();
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppWithNotifications />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

---

### 6. Composant DatePickerFollowUp

Créer `components/contacts/FollowUpPicker.tsx` :

```tsx
import { useState } from "react";
import { View, TouchableOpacity, Modal, Platform } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { Text, Button } from "../ui";

interface FollowUpPickerProps {
  value?: string | null;
  onChange: (date: Date | null) => void;
}

export function FollowUpPicker({ value, onChange }: FollowUpPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );

  const formatted = value
    ? new Date(value).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
      if (date) onChange(date);
    } else {
      if (date) setTempDate(date);
    }
  };

  const QUICK_OPTIONS = [
    { label: "Demain", days: 1 },
    { label: "3 jours", days: 3 },
    { label: "1 semaine", days: 7 },
    { label: "2 semaines", days: 14 },
    { label: "1 mois", days: 30 },
  ];

  const addDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(9, 0, 0, 0);
    onChange(d);
  };

  return (
    <View className="gap-2">
      <Text variant="muted" className="text-sm font-medium">Prochaine relance</Text>

      {/* Raccourcis */}
      <View className="flex-row flex-wrap gap-2">
        {QUICK_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.days}
            onPress={() => addDays(opt.days)}
            className="px-3 py-2 rounded-lg border border-border bg-surface"
          >
            <Text className="text-sm text-textMuted">{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date sélectionnée */}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        className="flex-row items-center gap-2 bg-surface border border-border rounded-xl px-4 py-3"
      >
        <Feather name="calendar" size={16} color={value ? "#6ee7b7" : "#475569"} />
        <Text className={`flex-1 text-sm ${value ? "text-primary" : "text-textMuted"}`}>
          {formatted ?? "Choisir une date..."}
        </Text>
        {value && (
          <TouchableOpacity onPress={() => onChange(null)}>
            <Feather name="x" size={16} color="#475569" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Picker iOS — Modal */}
      {Platform.OS === "ios" && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View className="flex-1 justify-end">
            <View className="bg-surface rounded-t-3xl p-6 gap-4">
              <Text variant="h3">Choisir une date</Text>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={new Date()}
                locale="fr-FR"
                textColor="#f1f5f9"
              />
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  className="flex-1 py-4 items-center border border-border rounded-xl"
                >
                  <Text variant="muted">Annuler</Text>
                </TouchableOpacity>
                <View className="flex-1">
                  <Button
                    label="Confirmer"
                    onPress={() => {
                      onChange(tempDate);
                      setShowPicker(false);
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Picker Android — natif inline */}
      {Platform.OS === "android" && showPicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={new Date()}
        />
      )}
    </View>
  );
}
```

Installer le date picker :

```bash
npx expo install @react-native-community/datetimepicker
```

---

### 7. Intégrer FollowUpPicker dans la fiche contact

Mettre à jour `app/(app)/contacts/[id].tsx` — ajouter la gestion des rappels.

Ajouter les imports :

```tsx
import { FollowUpPicker } from "../../../components/contacts/FollowUpPicker";
import {
  scheduleFollowUpNotification,
  cancelNotification,
} from "../../../lib/notifications";
```

Ajouter la fonction de mise à jour de la relance dans le composant :

```tsx
const handleFollowUpChange = async (date: Date | null) => {
  // Annuler l'ancienne notification si elle existe
  if (contact.notification_id) {
    await cancelNotification(contact.notification_id);
  }

  let notificationId: string | undefined;

  // Planifier la nouvelle notification
  if (date) {
    notificationId = await scheduleFollowUpNotification(
      contact.full_name,
      contact.id,
      date
    );
  }

  // Mettre à jour le contact dans Supabase
  await updateContact(contact.id, {
    next_follow_up: date?.toISOString() ?? null,
    notification_id: notificationId ?? null,
  });
};
```

Ajouter dans le JSX, dans la Card infos :

```tsx
{/* Planificateur de relance */}
<Card>
  <FollowUpPicker
    value={contact.next_follow_up}
    onChange={handleFollowUpChange}
  />
</Card>
```

---

### 8. Exporter les nouveaux composants

Mettre à jour `components/contacts/index.ts` :

```ts
export { ContactCard } from "./ContactCard";
export { AddInteractionSheet } from "./AddInteractionSheet";
export { FollowUpPicker } from "./FollowUpPicker";
```

---

## Critères de validation

Avant de passer à etape_06, vérifier que :

- [ ] L'app demande la permission notifications au premier lancement
- [ ] Sur la fiche contact, les raccourcis rapides (Demain, 3 jours, etc.) définissent une date
- [ ] Le date picker s'ouvre et permet de choisir une date personnalisée
- [ ] Après sélection d'une date, `next_follow_up` est mis à jour dans Supabase
- [ ] Une notification apparaît sur le téléphone à l'heure planifiée
- [ ] Taper sur la notification ouvre directement la fiche du bon contact
- [ ] Supprimer la date de relance annule la notification
- [ ] Le Dashboard affiche bien le contact dans "À relancer" à la bonne date

---

## Ce qu'on ne fait PAS dans cette étape

- Pas de notifications push serveur (Expo Push API) — les notifications locales suffisent pour le MVP
- Pas de récurrence automatique (peut être ajouté plus tard)
- Pas de Stripe (etape_06)
- Pas de widget (etape_07)

---

## Prochaine étape

`etape_06` — Abonnements Stripe (Free / Pro) avec paywall
