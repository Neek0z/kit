import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

export function useStartConversation() {
  const { user } = useAuthContext();

  const startConversationByEmail = useCallback(
    async (email: string): Promise<{ conversationId: string | null; error?: string }> => {
      if (!user) return { conversationId: null, error: "Non connecté" };

      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return { conversationId: null, error: "Email requis" };

      if (normalizedEmail === user.email?.toLowerCase())
        return { conversationId: null, error: "Tu ne peux pas t’envoyer un message à toi-même." };

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", normalizedEmail)
        .single();

      if (profileError || !profile) {
        return {
          conversationId: null,
          error: "Aucun utilisateur KIT avec cet email.",
        };
      }

      const otherUserId = profile.id;

      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const myConvoIds = (myConvos || []).map((c) => c.conversation_id);
      if (!myConvoIds.length) {
        return createNewConversation(user.id, otherUserId);
      }

      const { data: otherInConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", myConvoIds);

      const existing = (otherInConvos || []).find((c) =>
        myConvoIds.includes(c.conversation_id)
      );
      if (existing) {
        return { conversationId: existing.conversation_id };
      }

      return createNewConversation(user.id, otherUserId);
    },
    [user]
  );

  return { startConversationByEmail };
}

async function createNewConversation(
  myId: string,
  otherUserId: string
): Promise<{ conversationId: string | null; error?: string }> {
  const { data: newConvo, error: insertConvoError } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();

  if (insertConvoError || !newConvo) {
    return {
      conversationId: null,
      error: insertConvoError?.message || "Impossible de créer la conversation.",
    };
  }

  const { error: insertPartsError } = await supabase
    .from("conversation_participants")
    .insert([
      { conversation_id: newConvo.id, user_id: myId },
      { conversation_id: newConvo.id, user_id: otherUserId },
    ]);

  if (insertPartsError) {
    await supabase.from("conversations").delete().eq("id", newConvo.id);
    return {
      conversationId: null,
      error: insertPartsError.message,
    };
  }

  return { conversationId: newConvo.id };
}
