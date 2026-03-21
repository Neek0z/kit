# KIT — etape_06 : Abonnements Stripe (Free / Pro)

## Contexte

Notifications push fonctionnelles (etape_05 validée).
On ajoute maintenant la monétisation : un plan Free limité et un plan Pro illimité.
La logique de paiement passe par Stripe via des Supabase Edge Functions — jamais côté client.

---

## Architecture de la monétisation

```
Utilisateur → Stripe Checkout (web) → Webhook Stripe
                                            ↓
                                  Supabase Edge Function
                                            ↓
                                  Table subscriptions
                                            ↓
                                  App vérifie le statut
```

> **Pourquoi pas les achats in-app Apple/Google ?**
> Apple et Google prennent 15 à 30% de commission sur les achats in-app.
> Stripe via un lien web externe est autorisé par Apple pour les apps SaaS
> et évite cette commission. C'est le choix de Notion, Linear, et la plupart des SaaS.

---

## Limites du plan Free

À définir selon ta stratégie — exemple pour KIT :

| Fonctionnalité | Free | Pro |
|---|---|---|
| Contacts | 25 max | Illimité |
| Interactions | 50 max | Illimité |
| Rappels | 5 actifs max | Illimité |
| Export des données | ❌ | ✅ |
| Widget écran d'accueil | ❌ | ✅ |

---

## Ce que tu dois faire

### 1. Table Supabase — subscriptions

Dans Supabase → SQL Editor :

```sql
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free' not null, -- 'free' | 'pro'
  status text default 'active' not null, -- 'active' | 'canceled' | 'past_due'
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Trigger : créer une subscription free à l'inscription
create or replace function public.handle_new_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_subscription();

-- Trigger updated_at
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();
```

---

### 2. Supabase Edge Functions

Dans le dashboard Supabase → Edge Functions, créer deux fonctions.

---

**Fonction 1 : `create-checkout-session`**

```ts
// supabase/functions/create-checkout-session/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Vérifier l'auth
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { priceId, successUrl, cancelUrl } = await req.json();

    // Récupérer ou créer le customer Stripe
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    let customerId = sub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("subscriptions")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

**Fonction 2 : `stripe-webhook`**

```ts
// supabase/functions/stripe-webhook/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch {
    return new Response("Webhook signature invalide", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const subscription = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const customerId = subscription.customer as string;
      const plan = subscription.status === "active" ? "pro" : "free";
      const periodEnd = new Date(subscription.current_period_end * 1000).toISOString();

      await supabase
        .from("subscriptions")
        .update({
          stripe_subscription_id: subscription.id,
          plan,
          status: subscription.status,
          current_period_end: periodEnd,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const customerId = subscription.customer as string;
      await supabase
        .from("subscriptions")
        .update({ plan: "free", status: "canceled", stripe_subscription_id: null })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

Configurer les secrets dans Supabase → Edge Functions → Secrets :
- `STRIPE_SECRET_KEY` — clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` — secret du webhook Stripe
- Configurer le webhook Stripe pour pointer vers l'URL de ta fonction `stripe-webhook`

---

### 3. Hook useSubscription

Créer `hooks/useSubscription.ts` :

```ts
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
  checkLimit: (type: "contacts" | "interactions" | "reminders", current: number) => boolean;
}

const FREE_LIMITS = {
  contacts: 25,
  interactions: 50,
  reminders: 5,
};

const STRIPE_PRICE_ID = process.env.EXPO_PUBLIC_STRIPE_PRICE_ID!;
const SUCCESS_URL = "kit://subscription/success";
const CANCEL_URL = "kit://subscription/cancel";

export function useSubscription(): UseSubscriptionReturn {
  const { user, session } = useAuthContext();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setSubscription(data);
        setLoading(false);
      });

    // Écouter les changements en temps réel
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setSubscription(payload.new as Subscription);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";

  const startCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId: STRIPE_PRICE_ID,
          successUrl: SUCCESS_URL,
          cancelUrl: CANCEL_URL,
        },
      });

      if (error) throw error;
      if (data?.url) await Linking.openURL(data.url);
    } catch (err) {
      console.error("Erreur checkout :", err);
    }
  };

  const checkLimit = (type: "contacts" | "interactions" | "reminders", current: number): boolean => {
    if (isPro) return true;
    return current < FREE_LIMITS[type];
  };

  return { subscription, isPro, loading, startCheckout, checkLimit };
}
```

Ajouter dans `.env.local` :

```
EXPO_PUBLIC_STRIPE_PRICE_ID=price_xxx
```

---

### 4. Écran Paywall

Créer `app/(app)/subscription.tsx` :

```tsx
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Text, Button, Card } from "../../components/ui";
import { Header } from "../../components/layout";
import { useSubscription } from "../../hooks/useSubscription";

const PRO_FEATURES = [
  { icon: "users", label: "Contacts illimités" },
  { icon: "activity", label: "Historique illimité" },
  { icon: "bell", label: "Rappels illimités" },
  { icon: "grid", label: "Widget écran d'accueil" },
  { icon: "download", label: "Export des données" },
  { icon: "zap", label: "Priorité support" },
];

export default function SubscriptionScreen() {
  const { isPro, subscription, startCheckout, loading } = useSubscription();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Mon abonnement" showBack />

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Statut actuel */}
        <Card className="mb-6 mt-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text variant="muted" className="text-xs mb-1">Plan actuel</Text>
              <Text variant="h2" className={isPro ? "text-primary" : "text-textMain"}>
                {isPro ? "Pro ✨" : "Free"}
              </Text>
            </View>
            {isPro && subscription?.current_period_end && (
              <View className="items-end">
                <Text variant="muted" className="text-xs">Renouvellement</Text>
                <Text className="text-sm mt-0.5">
                  {new Date(subscription.current_period_end).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {!isPro && (
          <>
            {/* Hero */}
            <View className="items-center py-6 mb-6">
              <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                <Feather name="zap" size={32} color="#6ee7b7" />
              </View>
              <Text variant="h2" className="text-center mb-2">Passe à Pro</Text>
              <Text variant="muted" className="text-center leading-relaxed">
                Débloques toutes les fonctionnalités et développe ton réseau sans limite.
              </Text>
            </View>

            {/* Prix */}
            <Card className="mb-6 items-center">
              <View className="flex-row items-end gap-1 mb-1">
                <Text className="text-4xl font-bold text-primary">9€</Text>
                <Text variant="muted" className="mb-1.5">/mois</Text>
              </View>
              <Text variant="muted" className="text-xs">Sans engagement · Résilie quand tu veux</Text>
            </Card>

            {/* Features */}
            <View className="gap-3 mb-8">
              {PRO_FEATURES.map((feature) => (
                <View key={feature.label} className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                    <Feather name={feature.icon as any} size={15} color="#6ee7b7" />
                  </View>
                  <Text className="text-sm">{feature.label}</Text>
                </View>
              ))}
            </View>

            <Button
              label="Commencer Pro — 9€/mois"
              onPress={startCheckout}
              loading={loading}
            />

            <Text variant="muted" className="text-xs text-center mt-3 mb-8">
              Paiement sécurisé par Stripe. Tu seras redirigé vers une page web.
            </Text>
          </>
        )}

        {isPro && (
          <View className="items-center py-8 gap-3">
            <Feather name="check-circle" size={48} color="#6ee7b7" />
            <Text variant="h3" className="text-center">Tu es Pro !</Text>
            <Text variant="muted" className="text-center">
              Toutes les fonctionnalités sont débloquées.
            </Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 5. Intégrer les limites Free dans l'app

Mettre à jour `app/(app)/contacts.tsx` — bloquer l'ajout si limite atteinte :

```tsx
// Ajouter en haut du composant
const { checkLimit, isPro } = useSubscription();
const canAddContact = checkLimit("contacts", contacts.length);

// Modifier le bouton d'ajout
<TouchableOpacity
  onPress={() => {
    if (!canAddContact) {
      router.push("/(app)/subscription");
      return;
    }
    router.push("/(app)/contacts/new");
  }}
  className="bg-primary w-9 h-9 rounded-full items-center justify-center"
>
  <Feather name="plus" size={20} color="#0f172a" />
</TouchableOpacity>
```

Ajouter une bannière Free dans le Dashboard si l'utilisateur approche la limite :

```tsx
// Dans app/(app)/index.tsx, après les stats rapides
{!isPro && totalContacts >= 20 && (
  <TouchableOpacity
    onPress={() => router.push("/(app)/subscription")}
    className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 mb-4 flex-row items-center gap-3"
  >
    <Feather name="zap" size={16} color="#818cf8" />
    <Text className="text-secondary text-sm flex-1">
      {totalContacts}/25 contacts utilisés · Passe à Pro
    </Text>
    <Feather name="chevron-right" size={14} color="#818cf8" />
  </TouchableOpacity>
)}
```

---

### 6. Lien vers l'abonnement depuis le Profil

Mettre à jour `app/(app)/profile.tsx` — ajouter le lien :

```tsx
import { useSubscription } from "../../hooks/useSubscription";
import { router } from "expo-router";

// Dans le composant
const { isPro } = useSubscription();

// Dans le JSX, avant la déconnexion
<TouchableOpacity
  onPress={() => router.push("/(app)/subscription")}
  className="flex-row items-center justify-between py-4 border-b border-border"
>
  <View className="flex-row items-center gap-3">
    <Feather name="zap" size={18} color={isPro ? "#6ee7b7" : "#475569"} />
    <Text className="text-sm">Mon abonnement</Text>
  </View>
  <View className="flex-row items-center gap-2">
    <Text className={`text-xs font-semibold ${isPro ? "text-primary" : "text-textMuted"}`}>
      {isPro ? "Pro ✨" : "Free"}
    </Text>
    <Feather name="chevron-right" size={14} color="#475569" />
  </View>
</TouchableOpacity>
```

---

## Critères de validation

Avant de passer à etape_07, vérifier que :

- [ ] Chaque nouvel utilisateur a bien une ligne `free` dans la table `subscriptions`
- [ ] L'écran Profil affiche le statut de l'abonnement (Free / Pro)
- [ ] L'écran Paywall s'affiche avec les features Pro listées
- [ ] Le bouton "Commencer Pro" ouvre Stripe Checkout dans le navigateur
- [ ] Après paiement test Stripe, le plan passe à `pro` dans Supabase
- [ ] La bannière d'upgrade apparaît dans le Dashboard quand on approche 25 contacts
- [ ] Le bouton d'ajout redirige vers le paywall si la limite Free est atteinte
- [ ] Aucune erreur TypeScript

---

## Ce qu'on ne fait PAS dans cette étape

- Pas de gestion du restore purchase iOS (peut être ajouté si tu choisis les in-app purchases)
- Pas de coupon / code promo (peut être ajouté dans Stripe Dashboard)
- Pas de portail client Stripe (gestion auto-service — peut être ajouté plus tard)
- Pas de widget (etape_07)

---

## Prochaine étape

`etape_07` — Widget écran d'accueil iOS et Android
