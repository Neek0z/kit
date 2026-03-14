import { useState, useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { Conversation, Message, UserProfile } from "../types";

export interface ConversationWithDetails extends Conversation {
  otherParticipant: UserProfile | null;
  lastMessage: Message | null;
  unread_count: number;
}

export function useConversations() {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: myParticipation, error: err1 } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (err1 || !myParticipation?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const convoIds = myParticipation.map((p) => p.conversation_id);

      const { data: convos, error: err2 } = await supabase
        .from("conversations")
        .select("id, created_at, updated_at")
        .in("id", convoIds)
        .order("updated_at", { ascending: false });

      if (err2) {
        setError(err2.message);
        setLoading(false);
        return;
      }

      if (!convos?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("conversation_id, user_id")
        .in("conversation_id", convoIds);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, created_at, updated_at")
        .in(
          "id",
          [...new Set((allParticipants || []).map((p) => p.user_id))]
        );

      const profileMap = new Map<string, UserProfile>(
        (profiles || []).map((p) => [p.id, p as UserProfile])
      );

      const { data: recentMessages } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, content, created_at, read_at")
        .in("conversation_id", convoIds)
        .order("created_at", { ascending: false });

      const lastByConvo = new Map<string, Message>();
      (recentMessages || []).forEach((m) => {
        if (!lastByConvo.has(m.conversation_id))
          lastByConvo.set(m.conversation_id, m as Message);
      });

      const participantsByConvo = new Map<string, { user_id: string }[]>();
      (allParticipants || []).forEach((p) => {
        const list = participantsByConvo.get(p.conversation_id) || [];
        list.push(p);
        participantsByConvo.set(p.conversation_id, list);
      });

      const { data: unreadRows } = await supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convoIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      const unreadByConvo = new Map<string, number>();
      (unreadRows || []).forEach((r: { conversation_id: string }) => {
        unreadByConvo.set(
          r.conversation_id,
          (unreadByConvo.get(r.conversation_id) ?? 0) + 1
        );
      });

      const result: ConversationWithDetails[] = convos.map((c) => {
        const participants = participantsByConvo.get(c.id) || [];
        const other = participants.find((p) => p.user_id !== user.id);
        const otherProfile = other
          ? profileMap.get(other.user_id) || null
          : null;
        const lastMessage = lastByConvo.get(c.id) || null;
        const unread_count = unreadByConvo.get(c.id) ?? 0;

        return {
          id: c.id,
          created_at: c.created_at,
          updated_at: c.updated_at,
          otherParticipant: otherProfile,
          lastMessage,
          unread_count,
        };
      });

      setConversations(result);

      const totalUnread = result.reduce((acc, c) => acc + c.unread_count, 0);
      try {
        await Notifications.setBadgeCountAsync(totalUnread);
      } catch {
        // ignore on platforms that don't support badge
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations,
  };
}
