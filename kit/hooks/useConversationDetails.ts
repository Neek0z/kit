import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { UserProfile } from "../types";

export function useConversationDetails(conversationId: string | null) {
  const { user } = useAuthContext();
  const [otherParticipant, setOtherParticipant] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!user || !conversationId) {
      setOtherParticipant(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const otherId = (participants || []).find((p) => p.user_id !== user.id)?.user_id;
    if (!otherId) {
      setOtherParticipant(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at, updated_at")
      .eq("id", otherId)
      .single();

    setOtherParticipant(profile as UserProfile | null);
    setLoading(false);
  }, [user, conversationId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { otherParticipant, loading, refetch: fetchDetails };
}
