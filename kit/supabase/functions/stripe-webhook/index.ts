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
      const periodEnd = new Date(
        subscription.current_period_end * 1000
      ).toISOString();
      const isEarlyAdopter =
        subscription.metadata?.is_early_adopter === "true";
      const { data: pricingConfig } = await supabase
        .from("pricing_config")
        .select("early_adopter_price")
        .single();

      await supabase
        .from("subscriptions")
        .update({
          stripe_subscription_id: subscription.id,
          plan,
          status: subscription.status,
          current_period_end: periodEnd,
          is_early_adopter: isEarlyAdopter,
          early_adopter_price: isEarlyAdopter
            ? pricingConfig?.early_adopter_price ?? null
            : null,
        })
        .eq("stripe_customer_id", customerId);

      if (event.type === "customer.subscription.created" && isEarlyAdopter) {
        await supabase.rpc("increment_early_adopter_count");
      }
      break;
    }

    case "customer.subscription.deleted": {
      const customerId = subscription.customer as string;
      await supabase
        .from("subscriptions")
        .update({
          plan: "free",
          status: "canceled",
          stripe_subscription_id: null,
          is_early_adopter: false,
          early_adopter_price: null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
