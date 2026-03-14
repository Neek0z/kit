import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Contact } from "../types";

const KEY_MORNING_DIGEST = "notif_morning_digest";
const KEY_MORNING_DIGEST_NOTIF_ID = "morning_digest_notification_id";
const KEY_MORNING_DIGEST_HOUR = "notif_morning_digest_hour";
const KEY_MORNING_DIGEST_MINUTE = "notif_morning_digest_minute";
const KEY_REMINDER_HOUR = "notif_reminder_hour";
const KEY_REMINDER_MINUTE = "notif_reminder_minute";

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

export async function getMorningDigestTime(): Promise<{
  hour: number;
  minute: number;
}> {
  const [h, m] = await Promise.all([
    AsyncStorage.getItem(KEY_MORNING_DIGEST_HOUR),
    AsyncStorage.getItem(KEY_MORNING_DIGEST_MINUTE),
  ]);
  const hour = h != null ? parseInt(h, 10) : DEFAULT_HOUR;
  const minute = m != null ? parseInt(m, 10) : DEFAULT_MINUTE;
  return {
    hour: Number.isNaN(hour) ? DEFAULT_HOUR : Math.max(0, Math.min(23, hour)),
    minute: Number.isNaN(minute) ? DEFAULT_MINUTE : Math.max(0, Math.min(59, minute)),
  };
}

export async function setMorningDigestTime(
  hour: number,
  minute: number
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEY_MORNING_DIGEST_HOUR, String(Math.max(0, Math.min(23, hour)))),
    AsyncStorage.setItem(KEY_MORNING_DIGEST_MINUTE, String(Math.max(0, Math.min(59, minute)))),
  ]);
}

export async function getReminderTime(): Promise<{
  hour: number;
  minute: number;
}> {
  const [h, m] = await Promise.all([
    AsyncStorage.getItem(KEY_REMINDER_HOUR),
    AsyncStorage.getItem(KEY_REMINDER_MINUTE),
  ]);
  const hour = h != null ? parseInt(h, 10) : DEFAULT_HOUR;
  const minute = m != null ? parseInt(m, 10) : DEFAULT_MINUTE;
  return {
    hour: Number.isNaN(hour) ? DEFAULT_HOUR : Math.max(0, Math.min(23, hour)),
    minute: Number.isNaN(minute) ? DEFAULT_MINUTE : Math.max(0, Math.min(59, minute)),
  };
}

export async function setReminderTime(
  hour: number,
  minute: number
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEY_REMINDER_HOUR, String(Math.max(0, Math.min(23, hour)))),
    AsyncStorage.setItem(KEY_REMINDER_MINUTE, String(Math.max(0, Math.min(59, minute)))),
  ]);
}
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn("Les notifications push nécessitent un vrai appareil.");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("follow-up", {
        name: "Rappels de relance",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6ee7b7",
      });
      await Notifications.setNotificationChannelAsync("messages", {
        name: "Messages KIT",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6ee7b7",
      });
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData?.data ?? null;
    } catch {
      return null;
    }
  } catch (e) {
    console.warn("Notifications (register):", e);
    return null;
  }
}

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
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: "follow-up",
    },
  });
  return id;
}

export async function cancelNotification(
  notificationId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/** Pour tester : planifie un rappel dans X secondes (n’enregistre pas dans Supabase). */
export async function scheduleFollowUpNotificationInSeconds(
  contactName: string,
  contactId: string,
  seconds: number
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Rappel KIT 👋",
      body: `N'oublie pas de relancer ${contactName} aujourd'hui.`,
      data: { contactId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      channelId: "follow-up",
    },
  });
  return id;
}

/** Prochaine occurrence de l'heure du récap (aujourd'hui si pas encore passée, sinon demain). */
async function getNextMorningDigestDate(): Promise<Date> {
  const { hour, minute } = await getMorningDigestTime();
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next;
}

/** Nombre de contacts avec une relance prévue à la date donnée (jour entier). */
function countFollowUpsOnDate(contacts: Contact[], date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return contacts.filter((c) => {
    if (!c.next_follow_up) return false;
    const fd = new Date(c.next_follow_up);
    return fd.getFullYear() === y && fd.getMonth() === m && fd.getDate() === d;
  }).length;
}

/**
 * Planifie la notification "Récap matinal" pour la prochaine occurrence de 9h
 * si l'utilisateur a activé l'option. À appeler au passage en foreground (avec les contacts à jour).
 */
export async function scheduleMorningDigestIfNeeded(
  contacts: Contact[]
): Promise<void> {
  try {
    const enabled = await AsyncStorage.getItem(KEY_MORNING_DIGEST);
    if (enabled !== "true") {
      const existingId = await AsyncStorage.getItem(KEY_MORNING_DIGEST_NOTIF_ID);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
        await AsyncStorage.removeItem(KEY_MORNING_DIGEST_NOTIF_ID);
      }
      return;
    }

    const nextDate = await getNextMorningDigestDate();
    const count = countFollowUpsOnDate(contacts, nextDate);

    const previousId = await AsyncStorage.getItem(KEY_MORNING_DIGEST_NOTIF_ID);
    if (previousId) {
      await Notifications.cancelScheduledNotificationAsync(previousId);
    }

    const title = "Récap matinal KIT ☀️";
    const body =
      count === 0
        ? "Aucune relance prévue aujourd'hui."
        : count === 1
          ? "1 relance prévue aujourd'hui."
          : `${count} relances prévues aujourd'hui.`;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("morning-digest", {
        name: "Récap matinal",
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: "#6ee7b7",
      });
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: "morning_digest" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: nextDate.getTime(),
        channelId: Platform.OS === "android" ? "morning-digest" : undefined,
      },
    });

    await AsyncStorage.setItem(KEY_MORNING_DIGEST_NOTIF_ID, id);
  } catch (e) {
    console.warn("Récap matinal (schedule):", e);
  }
}

/** Annule la notification récap matinal (quand l'utilisateur désactive l'option). */
export async function cancelMorningDigest(): Promise<void> {
  try {
    const id = await AsyncStorage.getItem(KEY_MORNING_DIGEST_NOTIF_ID);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(KEY_MORNING_DIGEST_NOTIF_ID);
    }
  } catch (e) {
    console.warn("Récap matinal (cancel):", e);
  }
}
