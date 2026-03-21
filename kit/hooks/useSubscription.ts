import { useState, useEffect } from "react";
import { Linking } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

interface Subscription {
  plan: "free" | "pro";
  status: string;
  current_period_end?: string;
  is_early_adopter?: boolean;
  early_adopter_price?: number;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isPro: boolean;
  loading: boolean;
  error: string | null;
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

const SUCCESS_URL = "kit://subscription/success";
const CANCEL_URL = "kit://subscription/cancel";

export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuthContext();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    supabase
      .from("subscriptions")
      .select(
        "plan, status, current_period_end, is_early_adopter, early_adopter_price"
      )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Erreur chargement subscription :", error.message);
        }
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
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const isPro =
    subscription?.plan === "pro" && subscription?.status === "active";

  const startCheckout = async () => {
    try {
      setError(null);
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            successUrl: SUCCESS_URL,
            cancelUrl: CANCEL_URL,
          },
        }
      );

      if (invokeError) throw invokeError;
      if (data?.url) await Linking.openURL(data.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur lors du checkout";
      setError(message);
    }
  };

  const checkLimit = (
    type: "contacts" | "interactions" | "reminders",
    current: number
  ): boolean => {
    if (isPro) return true;
    return current < FREE_LIMITS[type];
  };

  return { subscription, isPro, loading, error, startCheckout, checkLimit };
}
