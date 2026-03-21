import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { UserProfile } from "../types";
import type { GroupChatPreview } from "./useConversations";

export function useConversationDetails(conversationId: string | null) {
  const { user } = useAuthContext();
  const [otherParticipant, setOtherParticipant] = useState<UserProfile | null>(
    null
  );
  const [isGroup, setIsGroup] = useState(false);
  const [groupPreview, setGroupPreview] = useState<GroupChatPreview | null>(
    null
  );
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = useCallback(async () => {
    if (!user || !conversationId) {
      setOtherParticipant(null);
      setIsGroup(false);
      setGroupPreview(null);
      setParticipants([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: convo } = await supabase
      .from("conversations")
      .select("kind, source_group_id")
      .eq("id", conversationId)
      .single();

    const kind = convo?.kind === "group" ? "group" : "direct";

    const { data: participantRows } = await supabase
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId);

    const userIds = (participantRows || []).map((p) => p.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at, updated_at")
      .in("id", userIds);

    const list = (profiles || []) as UserProfile[];
    setParticipants(list);

    if (kind === "group" && convo?.source_group_id) {
      setIsGroup(true);
      setOtherParticipant(null);
      const { data: g } = await supabase
        .from("groups")
        .select("id, name, emoji, color")
        .eq("id", convo.source_group_id)
        .maybeSingle();
      setGroupPreview((g as GroupChatPreview) ?? null);
    } else {
      setIsGroup(false);
      setGroupPreview(null);
      const otherId = userIds.find((id) => id !== user.id);
      if (!otherId) {
        setOtherParticipant(null);
      } else {
        const other = list.find((p) => p.id === otherId) ?? null;
        setOtherParticipant(other);
      }
    }

    setLoading(false);
  }, [user, conversationId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return {
    otherParticipant,
    isGroup,
    groupPreview,
    participants,
    loading,
    refetch: fetchDetails,
  };
}
