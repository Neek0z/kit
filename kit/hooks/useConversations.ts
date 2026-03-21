import { useState, useEffect, useCallback } from "react";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { Conversation, Message, UserProfile } from "../types";

export interface GroupChatPreview {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface ConversationWithDetails extends Conversation {
  otherParticipant: UserProfile | null;
  lastMessage: Message | null;
  unread_count: number;
  /** Présent si kind === "group" */
  groupPreview: GroupChatPreview | null;
  kind: "direct" | "group";
  participantCount: number;
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
      // Single query: conversations + participants via join (replaces 2 sequential queries)
      const { data: convosWithParticipants, error: err1 } = await supabase
        .from("conversations")
        .select(`
          id, created_at, updated_at, kind, source_group_id,
          conversation_participants!inner (user_id)
        `)
        .eq("conversation_participants.user_id", user.id)
        .order("updated_at", { ascending: false });

      if (err1 || !convosWithParticipants?.length) {
        if (err1) setError(err1.message);
        setConversations([]);
        setLoading(false);
        return;
      }

      const convoIds = convosWithParticipants.map((c: { id: string }) => c.id);

      // Fire all remaining queries in parallel (was 4-5 sequential queries)
      const [participantsRes, messagesRes, unreadRes] = await Promise.all([
        supabase
          .from("conversation_participants")
          .select("conversation_id, user_id")
          .in("conversation_id", convoIds),
        supabase
          .from("messages")
          .select("id, conversation_id, sender_id, content, created_at, read_at")
          .in("conversation_id", convoIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", convoIds)
          .neq("sender_id", user.id)
          .is("read_at", null),
      ]);

      const allParticipants = participantsRes.data || [];

      // Build participant maps
      const participantsByConvo = new Map<string, { user_id: string }[]>();
      allParticipants.forEach((p) => {
        const list = participantsByConvo.get(p.conversation_id) || [];
        list.push(p);
        participantsByConvo.set(p.conversation_id, list);
      });

      // Parallel: profiles + groups (depends on participants/convos data)
      const uniqueUserIds = [...new Set(allParticipants.map((p) => p.user_id))];
      const groupIds = [
        ...new Set(
          convosWithParticipants
            .filter(
              (c: { kind?: string | null; source_group_id?: string | null }) =>
                c.kind === "group" && c.source_group_id
            )
            .map(
              (c: { source_group_id?: string | null }) => c.source_group_id as string
            )
        ),
      ];

      const [profilesRes, groupsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, created_at, updated_at")
          .in("id", uniqueUserIds),
        groupIds.length > 0
          ? supabase.from("groups").select("id, name, emoji, color").in("id", groupIds)
          : Promise.resolve({ data: [] as GroupChatPreview[] }),
      ]);

      const profileMap = new Map<string, UserProfile>(
        (profilesRes.data || []).map((p) => [p.id, p as UserProfile])
      );

      const groupMap = new Map<string, GroupChatPreview>();
      ((groupsRes.data || []) as GroupChatPreview[]).forEach((g) =>
        groupMap.set(g.id, g)
      );

      // Build last-message map
      const lastByConvo = new Map<string, Message>();
      (messagesRes.data || []).forEach((m) => {
        if (!lastByConvo.has(m.conversation_id))
          lastByConvo.set(m.conversation_id, m as Message);
      });

      // Build unread map
      const unreadByConvo = new Map<string, number>();
      (unreadRes.data || []).forEach((r: { conversation_id: string }) => {
        unreadByConvo.set(
          r.conversation_id,
          (unreadByConvo.get(r.conversation_id) ?? 0) + 1
        );
      });

      const result: ConversationWithDetails[] = convosWithParticipants.map((c) => {
        const row = c as {
          id: string;
          created_at: string;
          updated_at: string;
          kind?: string | null;
          source_group_id?: string | null;
        };
        const participants = participantsByConvo.get(c.id) || [];
        const kind: "direct" | "group" =
          row.kind === "group" ? "group" : "direct";
        const participantCount = participants.length;

        const other = participants.find((p) => p.user_id !== user.id);
        const otherProfile =
          kind === "direct" && other
            ? profileMap.get(other.user_id) || null
            : null;

        const lastMessage = lastByConvo.get(c.id) || null;
        const unread_count = unreadByConvo.get(c.id) ?? 0;

        const groupPreview =
          kind === "group" && row.source_group_id
            ? groupMap.get(row.source_group_id) ?? null
            : null;

        return {
          id: c.id,
          created_at: c.created_at,
          updated_at: c.updated_at,
          kind,
          source_group_id: row.source_group_id ?? null,
          otherParticipant: otherProfile,
          lastMessage,
          unread_count,
          groupPreview,
          participantCount,
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
