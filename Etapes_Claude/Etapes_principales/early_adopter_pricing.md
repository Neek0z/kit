# KIT — Pricing Early Adopter + Redesign écran abonnement

## Contexte

On met en place une stratégie de lancement avec un prix early adopter
limité aux 100 premiers abonnés, puis retour au prix normal.
L'écran d'abonnement est redesigné pour maximiser la conversion.

---

## Ce que tu dois faire

### 1. Table Supabase — compteur early adopter

```sql
-- Table pour gérer le compteur et la config pricing
create table public.pricing_config (
  id uuid default gen_random_uuid() primary key,
  early_adopter_price numeric default 4.99 not null,
  normal_price numeric default 7.99 not null,
  early_adopter_limit integer default 100 not null,
  early_adopter_count integer default 0 not null,
  early_adopter_active boolean default true not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insérer la config initiale
insert into public.pricing_config
  (early_adopter_price, normal_price, early_adopter_limit, early_adopter_count, early_adopter_active)
values (4.99, 7.99, 100, 0, true);

-- RLS — lecture publique, écriture interdite côté client
alter table public.pricing_config enable row level security;

create policy "Anyone can read pricing config"
  on public.pricing_config for select using (true);

-- Ajouter badge early adopter sur les subscriptions
alter table public.subscriptions
  add column if not exists is_early_adopter boolean default false,
  add column if not exists early_adopter_price numeric;
```

---

### 2. Mettre à jour la Supabase Edge Function create-checkout-session

Dans `supabase/functions/create-checkout-session/index.ts`,
modifier pour gérer les deux prix selon le stock early adopter :

```ts
// Récupérer la config pricing
const { data: pricingConfig } = await supabase
  .from("pricing_config")
  .select("*")
  .single();

const isEarlyAdopter = pricingConfig?.early_adopter_active &&
  pricingConfig?.early_adopter_count < pricingConfig?.early_adopter_limit;

// Utiliser le bon Price ID Stripe selon le contexte
const priceId = isEarlyAdopter
  ? Deno.env.get("STRIPE_EARLY_ADOPTER_PRICE_ID")
  : Deno.env.get("STRIPE_NORMAL_PRICE_ID");

// Après paiement réussi, incrémenter le compteur
// (géré dans le webhook stripe)
```

Dans le webhook Stripe, après `customer.subscription.created` :

```ts
// Si early adopter, incrémenter le compteur et marquer l'abonnement
if (isEarlyAdopter) {
  await supabase.rpc("increment_early_adopter_count");
  await supabase
    .from("subscriptions")
    .update({
      is_early_adopter: true,
      early_adopter_price: pricingConfig.early_adopter_price,
    })
    .eq("stripe_customer_id", customerId);
}
```

Créer la fonction SQL :

```sql
create or replace function public.increment_early_adopter_count()
returns void as $$
begin
  update public.pricing_config
  set early_adopter_count = early_adopter_count + 1,
      early_adopter_active = (early_adopter_count + 1 < early_adopter_limit);
end;
$$ language plpgsql security definer;
```

Ajouter dans les secrets Supabase Edge Functions :
- `STRIPE_EARLY_ADOPTER_PRICE_ID` — créer un prix 4,99€/mois dans Stripe
- `STRIPE_NORMAL_PRICE_ID` — créer un prix 7,99€/mois dans Stripe

---

### 3. Hook usePricing

Créer `hooks/usePricing.ts` :

```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface PricingConfig {
  early_adopter_price: number;
  normal_price: number;
  early_adopter_limit: number;
  early_adopter_count: number;
  early_adopter_active: boolean;
  spots_left: number;
}

export function usePricing() {
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("pricing_config")
      .select("*")
      .single()
      .then(({ data }) => {
        if (data) {
          setPricing({
            ...data,
            spots_left: Math.max(0, data.early_adopter_limit - data.early_adopter_count),
          });
        }
        setLoading(false);
      });
  }, []);

  const isEarlyAdopter = pricing?.early_adopter_active && (pricing?.spots_left ?? 0) > 0;
  const currentPrice = isEarlyAdopter
    ? pricing?.early_adopter_price ?? 4.99
    : pricing?.normal_price ?? 7.99;

  return { pricing, loading, isEarlyAdopter, currentPrice };
}
```

---

### 4. Redesign écran abonnement

Remplacer complètement `app/(app)/subscription.tsx` :

```tsx
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, Card } from "../../components/ui";
import { Header } from "../../components/layout";
import { useSubscription } from "../../hooks/useSubscription";
import { usePricing } from "../../hooks/usePricing";
import { useTheme } from "../../lib/theme";

const PRO_FEATURES = [
  { icon: "users",    label: "Contacts illimités",          desc: "Fini la limite des 25 contacts" },
  { icon: "activity", label: "Historique illimité",          desc: "Toutes tes interactions conservées" },
  { icon: "bell",     label: "Rappels illimités",            desc: "Autant de relances que tu veux" },
  { icon: "grid",     label: "Widget écran d'accueil",       desc: "Tes relances du jour en un coup d'œil" },
  { icon: "instagram",label: "Bibliothèque de prompts IA",   desc: "Contenu Instagram prêt à l'emploi" },
  { icon: "download", label: "Export de tes données",        desc: "CSV de tous tes contacts" },
];

export default function SubscriptionScreen() {
  const theme = useTheme();
  const { isPro, subscription, startCheckout, loading } = useSubscription();
  const { pricing, isEarlyAdopter, currentPrice } = usePricing();

  const spotsLeft = pricing?.spots_left ?? 0;
  const spotsPercent = pricing
    ? Math.round((pricing.early_adopter_count / pricing.early_adopter_limit) * 100)
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* Ligne décorative */}
      <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />

      <Header title="Abonnement" showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>

          {/* Statut actuel si Pro */}
          {isPro && (
            <Card accent>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={{ fontSize: 11, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 4 }}>
                    Plan actuel
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: "800", color: theme.primary, letterSpacing: -0.5 }}>
                    Pro ✨
                  </Text>
                  {subscription?.is_early_adopter && (
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 4,
                      marginTop: 4,
                    }}>
                      <Feather name="star" size={11} color="#fbbf24" />
                      <Text style={{ fontSize: 11, color: "#fbbf24", fontWeight: "600" }}>
                        Early Adopter — {subscription.early_adopter_price}€/mois à vie
                      </Text>
                    </View>
                  )}
                </View>
                {subscription?.current_period_end && (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 11, color: theme.textMuted }}>Renouvellement</Text>
                    <Text style={{ fontSize: 12, color: theme.textPrimary, fontWeight: "500", marginTop: 2 }}>
                      {new Date(subscription.current_period_end).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long",
                      })}
                    </Text>
                  </View>
                )}
              </View>
            </Card>
          )}

          {!isPro && (
            <>
              {/* Badge Early Adopter */}
              {isEarlyAdopter && (
                <View style={{
                  backgroundColor: "rgba(251,191,36,0.08)",
                  borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
                  borderRadius: 14, padding: 14,
                  flexDirection: "row", alignItems: "flex-start", gap: 10,
                }}>
                  <Text style={{ fontSize: 20 }}>⚡</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#fbbf24", marginBottom: 3 }}>
                      Offre Early Adopter
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textMuted, lineHeight: 17 }}>
                      Tu fais partie des premiers utilisateurs de KIT.
                      Bloque ton prix à {pricing?.early_adopter_price}€/mois pour toujours —
                      même quand le prix augmente.
                    </Text>

                    {/* Barre de progression des places */}
                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                        <Text style={{ fontSize: 11, color: theme.textMuted }}>
                          {pricing?.early_adopter_count}/{pricing?.early_adopter_limit} places prises
                        </Text>
                        <Text style={{ fontSize: 11, color: "#fbbf24", fontWeight: "600" }}>
                          {spotsLeft} restante{spotsLeft > 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={{ height: 5, backgroundColor: "rgba(251,191,36,0.15)", borderRadius: 3 }}>
                        <View style={{
                          height: 5, backgroundColor: "#fbbf24",
                          borderRadius: 3, width: `${spotsPercent}%`,
                        }} />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Prix */}
              <Card>
                <View style={{ alignItems: "center", paddingVertical: 8 }}>
                  {isEarlyAdopter && (
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 8,
                      marginBottom: 6,
                    }}>
                      <Text style={{
                        fontSize: 18, color: theme.textHint,
                        textDecorationLine: "line-through",
                      }}>
                        7,99€
                      </Text>
                      <View style={{
                        backgroundColor: "rgba(251,191,36,0.12)",
                        borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3,
                        borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
                      }}>
                        <Text style={{ fontSize: 11, color: "#fbbf24", fontWeight: "700" }}>
                          -38%
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
                    <Text style={{
                      fontSize: 48, fontWeight: "800",
                      color: isEarlyAdopter ? "#fbbf24" : theme.primary,
                      letterSpacing: -2, lineHeight: 52,
                    }}>
                      {currentPrice.toFixed(2).replace(".", ",")}€
                    </Text>
                    <Text style={{ fontSize: 14, color: theme.textMuted, marginBottom: 8 }}>
                      /mois
                    </Text>
                  </View>

                  <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
                    {isEarlyAdopter
                      ? "Prix garanti à vie · Sans engagement"
                      : "Sans engagement · Résilie quand tu veux"}
                  </Text>
                </View>
              </Card>

              {/* Features */}
              <Card>
                <Text style={{
                  fontSize: 11, color: theme.textHint,
                  textTransform: "uppercase", letterSpacing: 0.8,
                  fontWeight: "600", marginBottom: 12,
                }}>
                  Tout ce qui est inclus
                </Text>
                <View style={{ gap: 12 }}>
                  {PRO_FEATURES.map((feature, i) => (
                    <View key={feature.label}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <View style={{
                          width: 36, height: 36, borderRadius: 10,
                          backgroundColor: theme.primaryBg,
                          borderWidth: 1, borderColor: theme.primaryBorder,
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <Feather name={feature.icon as any} size={16} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>
                            {feature.label}
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>
                            {feature.desc}
                          </Text>
                        </View>
                        <Feather name="check" size={15} color={theme.primary} />
                      </View>
                      {i < PRO_FEATURES.length - 1 && (
                        <View style={{ height: 1, backgroundColor: theme.border, marginTop: 12 }} />
                      )}
                    </View>
                  ))}
                </View>
              </Card>

              {/* CTA */}
              <TouchableOpacity
                onPress={startCheckout}
                disabled={loading}
                style={{
                  backgroundColor: isEarlyAdopter
                    ? "rgba(251,191,36,0.15)"
                    : theme.primaryBg,
                  borderWidth: 1,
                  borderColor: isEarlyAdopter
                    ? "rgba(251,191,36,0.4)"
                    : theme.primaryBorder,
                  borderRadius: 14, padding: 16,
                  alignItems: "center",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={isEarlyAdopter ? "#fbbf24" : theme.primary} />
                ) : (
                  <>
                    <Text style={{
                      fontSize: 16, fontWeight: "800",
                      color: isEarlyAdopter ? "#fbbf24" : theme.primary,
                      letterSpacing: -0.3,
                    }}>
                      {isEarlyAdopter
                        ? `Bloquer mon prix à ${currentPrice.toFixed(2).replace(".", ",")}€/mois →`
                        : `Passer à Pro — ${currentPrice.toFixed(2).replace(".", ",")}€/mois →`}
                    </Text>
                    <Text style={{
                      fontSize: 11, color: theme.textMuted, marginTop: 4,
                    }}>
                      Paiement sécurisé par Stripe
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Annuel */}
              <TouchableOpacity
                style={{
                  backgroundColor: theme.surface,
                  borderWidth: 1, borderColor: theme.border,
                  borderRadius: 14, padding: 14,
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                }}
              >
                <View>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: theme.textPrimary }}>
                    Annuel — 59€/an
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    = 4,90€/mois · Économise 2 mois
                  </Text>
                </View>
                <View style={{
                  backgroundColor: "rgba(110,231,183,0.1)",
                  borderRadius: 100, paddingHorizontal: 8, paddingVertical: 4,
                  borderWidth: 1, borderColor: "rgba(110,231,183,0.2)",
                }}>
                  <Text style={{ fontSize: 11, color: theme.primary, fontWeight: "700" }}>
                    -38%
                  </Text>
                </View>
              </TouchableOpacity>

            </>
          )}

          {/* Si Pro — écran de confirmation */}
          {isPro && (
            <View style={{ alignItems: "center", paddingVertical: 20, gap: 10 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: theme.primaryBg,
                borderWidth: 1, borderColor: theme.primaryBorder,
                alignItems: "center", justifyContent: "center",
              }}>
                <Feather name="check" size={28} color={theme.primary} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: theme.textPrimary }}>
                Tu es Pro !
              </Text>
              <Text style={{ fontSize: 13, color: theme.textMuted, textAlign: "center" }}>
                Toutes les fonctionnalités sont débloquées.
              </Text>
            </View>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 5. Créer les deux prix dans Stripe Dashboard

Dans Stripe → Products :

1. Créer un produit **"KIT Pro"**
2. Ajouter deux prix récurrents :
   - **Early Adopter** : 4,99€/mois — copier le Price ID → `STRIPE_EARLY_ADOPTER_PRICE_ID`
   - **Normal** : 7,99€/mois — copier le Price ID → `STRIPE_NORMAL_PRICE_ID`
3. Mettre à jour les secrets Supabase Edge Functions avec ces deux IDs
4. Mettre à jour `.env.local` :

```
EXPO_PUBLIC_STRIPE_EARLY_ADOPTER_PRICE_ID=price_xxx
EXPO_PUBLIC_STRIPE_NORMAL_PRICE_ID=price_xxx
```

---

### 6. Mettre à jour le bandeau upgrade dans le Dashboard

Dans `app/(app)/index.tsx`, mettre à jour la bannière qui s'affiche
quand l'utilisateur approche la limite Free :

```tsx
import { usePricing } from "../../hooks/usePricing";

const { isEarlyAdopter, currentPrice, pricing } = usePricing();

{!isPro && totalContacts >= 20 && (
  <TouchableOpacity
    onPress={() => router.push("/(app)/subscription")}
    style={{
      backgroundColor: isEarlyAdopter
        ? "rgba(251,191,36,0.08)"
        : "rgba(129,140,248,0.08)",
      borderWidth: 1,
      borderColor: isEarlyAdopter
        ? "rgba(251,191,36,0.2)"
        : "rgba(129,140,248,0.2)",
      borderRadius: 14, padding: 12, marginBottom: 14,
      flexDirection: "row", alignItems: "center", gap: 10,
    }}
  >
    <Text style={{ fontSize: 16 }}>{isEarlyAdopter ? "⚡" : "✨"}</Text>
    <Text style={{
      flex: 1, fontSize: 13, fontWeight: "500",
      color: isEarlyAdopter ? "#fbbf24" : "#818cf8",
    }}>
      {isEarlyAdopter
        ? `${pricing?.spots_left} places Early Adopter restantes — ${currentPrice}€/mois`
        : `${totalContacts}/25 contacts · Passe à Pro`}
    </Text>
    <Feather
      name="chevron-right"
      size={14}
      color={isEarlyAdopter ? "#fbbf24" : "#818cf8"}
    />
  </TouchableOpacity>
)}
```

---

## Critères de validation

- [ ] La table `pricing_config` existe avec les bonnes valeurs initiales
- [ ] L'écran abonnement affiche le badge Early Adopter si des places restent
- [ ] La barre de progression des places s'affiche correctement
- [ ] Le prix barré (7,99€) + badge -38% s'affiche en mode Early Adopter
- [ ] Le bouton CTA change de couleur et de texte selon le mode
- [ ] L'option annuelle est visible en bas
- [ ] Les utilisateurs Pro Early Adopter voient leur prix garanti
- [ ] La bannière dashboard change selon le mode Early Adopter
- [ ] Aucune erreur TypeScript

---

## Note

Le compteur `early_adopter_count` doit être incrémenté côté serveur
(Edge Function webhook Stripe) — jamais côté client.
Quand `early_adopter_count >= early_adopter_limit`,
`early_adopter_active` passe automatiquement à `false`
et tous les nouveaux abonnés paient le prix normal.
