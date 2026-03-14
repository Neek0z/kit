import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface WebhookPayload {
  type?: string;
  table?: string;
  record?: {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    created_at: string;
  };
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (payload?.table !== "messages" || payload?.type !== "INSERT" || !payload?.record) {
    return new Response("Ignored", { status: 200 });
  }

  const { conversation_id, sender_id, content } = payload.record;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversation_id);

  const recipientId = (participants || []).find((p) => p.user_id !== sender_id)?.user_id;
  if (!recipientId) {
    return new Response("OK", { status: 200 });
  }

  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("expo_push_token")
    .eq("id", recipientId)
    .single();

  const token = recipientProfile?.expo_push_token;
  if (!token || typeof token !== "string") {
    return new Response("OK", { status: 200 });
  }

  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", sender_id)
    .single();

  const senderName = senderProfile?.full_name || "Quelqu'un";
  const bodyPreview = content.length > 80 ? content.slice(0, 77) + "…" : content;

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      to: token,
      title: `Nouveau message de ${senderName}`,
      body: bodyPreview,
      data: { conversationId: conversation_id },
      channelId: "messages",
      sound: "default",
    }),
  });

  if (!res.ok) {
    console.error("Expo push failed:", await res.text());
  }

  return new Response("OK", { status: 200 });
});
