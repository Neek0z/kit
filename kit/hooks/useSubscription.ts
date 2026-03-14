import { useState, useEffect } from "react";
import { Linking } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

interface Subscription {
  plan: "free" | "pro";
  status: string;
  current_period_end?: string;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isPro: boolean;
  loading: boolean;
  startCheckout: () => Promise<void>;
  checkLimit: (
    type: "contacts" | "interactions" | "reminders",
    current: number
  ) => boolean;
}

const FREE_LIMITS = {
  contacts: 25,
  interactions: 50,
  reminders: 5,
};

const STRIPE_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_ID ?? "";
const SUCCESS_URL = "kit://subscription/success";
const CANCEL_URL = "kit://subscription/cancel";

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuthContext();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubscription(data ?? { plan: "free", status: "active" });
        setLoading(false);
      });

    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setSubscription(payload.new as Subscription);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isPro =
    subscription?.plan === "pro" && subscription?.status === "active";

  const startCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            priceId: STRIPE_PRICE_ID,
            successUrl: SUCCESS_URL,
            cancelUrl: CANCEL_URL,
          },
        }
      );

      if (error) throw error;
      if (data?.url) await Linking.openURL(data.url);
    } catch (err) {
      console.error("Erreur checkout :", err);
    }
  };

  const checkLimit = (
    type: "contacts" | "interactions" | "reminders",
    current: number
  ): boolean => {
    if (isPro) return true;
    return current < FREE_LIMITS[type];
  };

  return { subscription, isPro, loading, startCheckout, checkLimit };
}
