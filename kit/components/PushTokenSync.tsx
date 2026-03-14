import { useEffect, useRef } from "react";
import { registerForPushNotifications } from "../lib/notifications";
import { useAuthContext } from "../lib/AuthContext";
import { useProfile } from "../hooks/useProfile";

/**
 * Enregistre le token push au profil pour recevoir les notifications (ex: nouveaux messages).
 * Monté dans l'app une fois connecté.
 */
export function PushTokenSync() {
  const { user } = useAuthContext();
  const { updateProfile } = useProfile();
  const done = useRef(false);

  useEffect(() => {
    if (!user || done.current) return;

    let cancelled = false;
    done.current = true;

    registerForPushNotifications()
      .then((token) => {
        if (cancelled || !token) return;
        updateProfile({ expo_push_token: token });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user, updateProfile]);

  return null;
}
