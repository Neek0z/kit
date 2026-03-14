import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { registerForPushNotifications } from "../lib/notifications";

export function useNotifications() {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // En Expo Go, la demande de permission peut lever "No projectId" ; on ignore l'erreur.
    registerForPushNotifications().catch(() => {});

    try {
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notification reçue :", notification);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as
            | { contactId?: string; conversationId?: string }
            | undefined;
          if (data?.contactId) {
            router.push(`/(app)/contacts/${data.contactId}`);
          } else if (data?.conversationId) {
            router.push(`/(app)/messages/${data.conversationId}`);
          }
        });
    } catch (e) {
      console.warn("Notifications (listeners):", e);
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
