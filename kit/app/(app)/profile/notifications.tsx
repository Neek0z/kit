import { useState, useEffect } from "react";
import { View, Switch, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, Card, Divider } from "../../../components/ui";
import { Header } from "../../../components/layout";
import {
  cancelMorningDigest,
  getMorningDigestTime,
  setMorningDigestTime,
  getReminderTime,
  setReminderTime,
} from "../../../lib/notifications";

const KEY_REMINDERS = "notif_reminders";
const KEY_MORNING_DIGEST = "notif_morning_digest";

export default function NotificationSettingsScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [morningDigest, setMorningDigest] = useState(false);
  const [digestHour, setDigestHour] = useState(9);
  const [digestMinute, setDigestMinute] = useState(0);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r, m, dt, rt] = await Promise.all([
          AsyncStorage.getItem(KEY_REMINDERS),
          AsyncStorage.getItem(KEY_MORNING_DIGEST),
          getMorningDigestTime(),
          getReminderTime(),
        ]);
        if (r !== null) setRemindersEnabled(r === "true");
        if (m !== null) setMorningDigest(m === "true");
        setDigestHour(dt.hour);
        setDigestMinute(dt.minute);
        setReminderHour(rt.hour);
        setReminderMinute(rt.minute);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const toggle = async (key: string, value: boolean) => {
    await AsyncStorage.setItem(key, value.toString());
  };

  const saveDigestTime = async (h: number, m: number) => {
    setDigestHour(h);
    setDigestMinute(m);
    await setMorningDigestTime(h, m);
  };

  const saveReminderTime = async (h: number, m: number) => {
    setReminderHour(h);
    setReminderMinute(m);
    await setReminderTime(h, m);
  };

  if (!loaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
      <Header title="Notifications" showBack />
      <View className="px-5 pt-4">
        <Card padding="sm">
          <View className="flex-row items-center justify-between py-3 px-1">
            <View className="flex-1 mr-4">
              <Text className="text-sm">Rappels de relance</Text>
              <Text variant="muted" className="text-xs mt-0.5">
                Notifie-moi à la date de relance prévue
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={(v) => {
                setRemindersEnabled(v);
                toggle(KEY_REMINDERS, v);
              }}
              trackColor={{ true: "#6ee7b7", false: "#334155" }}
              thumbColor="#fff"
            />
          </View>
          <Divider />
          <View className="py-3 px-1">
            <Text className="text-sm">Heure des rappels</Text>
            <Text variant="muted" className="text-xs mt-0.5">
              Heure à laquelle tu veux être notifié le jour J (ex. 9h00)
            </Text>
            <View className="flex-row items-center gap-2 mt-2">
              <TextInput
                className="w-14 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg px-2 py-2 text-center text-textMain dark:text-textMain-dark"
                value={String(reminderHour)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!Number.isNaN(n)) saveReminderTime(Math.max(0, Math.min(23, n)), reminderMinute);
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="9"
              />
              <Text className="text-textMuted dark:text-textMuted-dark">h</Text>
              <TextInput
                className="w-14 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg px-2 py-2 text-center text-textMain dark:text-textMain-dark"
                value={String(reminderMinute)}
                onChangeText={(t) => {
                  const n = parseInt(t, 10);
                  if (!Number.isNaN(n)) saveReminderTime(reminderHour, Math.max(0, Math.min(59, n)));
                }}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="0"
              />
            </View>
          </View>
          <Divider />
          <View className="flex-row items-center justify-between py-3 px-1">
            <View className="flex-1 mr-4">
              <Text className="text-sm">Récap matinal</Text>
              <Text variant="muted" className="text-xs mt-0.5">
                Résumé des relances du jour
              </Text>
            </View>
            <Switch
              value={morningDigest}
              onValueChange={(v) => {
                setMorningDigest(v);
                toggle(KEY_MORNING_DIGEST, v);
                if (!v) cancelMorningDigest();
              }}
              trackColor={{ true: "#6ee7b7", false: "#334155" }}
              thumbColor="#fff"
            />
          </View>
          {morningDigest && (
            <>
              <Divider />
              <View className="py-3 px-1">
                <Text className="text-sm">Heure du récap</Text>
                <View className="flex-row items-center gap-2 mt-2">
                  <TextInput
                    className="w-14 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg px-2 py-2 text-center text-textMain dark:text-textMain-dark"
                    value={String(digestHour)}
                    onChangeText={(t) => {
                      const n = parseInt(t, 10);
                      if (!Number.isNaN(n)) saveDigestTime(Math.max(0, Math.min(23, n)), digestMinute);
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                  <Text className="text-textMuted dark:text-textMuted-dark">h</Text>
                  <TextInput
                    className="w-14 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg px-2 py-2 text-center text-textMain dark:text-textMain-dark"
                    value={String(digestMinute)}
                    onChangeText={(t) => {
                      const n = parseInt(t, 10);
                      if (!Number.isNaN(n)) saveDigestTime(digestHour, Math.max(0, Math.min(59, n)));
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
            </>
          )}
        </Card>
        <Card padding="sm" className="mt-4">
          <Text variant="muted" className="text-xs leading-relaxed">
            Les notifications respectent le mode Ne pas déranger et les réglages de ton appareil. Tu peux autoriser ou désactiver les sons par app dans les paramètres système.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}
