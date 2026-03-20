import { useCallback, useEffect, useMemo, useState } from "react";
import { useContacts } from "./useContacts";
import { Contact, Interaction, PipelineStatus } from "../types";
import { useAuthContext } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

interface DashboardStats {
  totalContacts: number;
  toFollowUp: Contact[];
  byStatus: Record<PipelineStatus, number>;
  recentContacts: Contact[];
  overdueFollowUps: Contact[];
  weeklyNewContacts: number;
  monthlyNewClients: number;
  recentActivity: Interaction[];
  totalInteractions: number;
}

export function useDashboard(): DashboardStats & { loading: boolean; refetch: () => Promise<void> } {
  const { contacts, loading, refetch: refetchContacts } = useContacts();
  const { user } = useAuthContext();
  const [recentActivity, setRecentActivity] = useState<Interaction[]>([]);
  const [totalInteractions, setTotalInteractions] = useState(0);

  const fetchRecentActivity = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("interactions")
      .select("id, type, content, created_at, contact_id, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4);

    setRecentActivity((data ?? []) as Interaction[]);
  }, [user?.id]);

  useEffect(() => {
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  const fetchTotalInteractions = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    setTotalInteractions(count ?? 0);
  }, [user?.id]);

  useEffect(() => {
    fetchTotalInteractions();
  }, [fetchTotalInteractions]);

  const refetchAll = useCallback(async () => {
    await refetchContacts();
    await fetchRecentActivity();
    await fetchTotalInteractions();
  }, [fetchRecentActivity, fetchTotalInteractions, refetchContacts]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const toFollowUp = contacts.filter((c) => {
      if (!c.next_follow_up) return false;
      return new Date(c.next_follow_up) <= now;
    });

    const overdueFollowUps = contacts.filter((c) => {
      if (!c.next_follow_up) return false;
      return new Date(c.next_follow_up) < today;
    });

    const byStatus = contacts.reduce(
      (acc, c) => {
        const s = c.status as PipelineStatus;
        acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      },
      {} as Record<PipelineStatus, number>
    );

    const recentContacts = [...contacts]
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      .slice(0, 5);

    // Contacts ajoutés cette semaine
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weeklyNewContacts = contacts.filter(
      (c) => new Date(c.created_at) >= weekStart
    ).length;

    // Nouveaux clients ce mois
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyNewClients = contacts.filter(
      (c) => c.status === "client" && new Date(c.updated_at) >= monthStart
    ).length;

    return {
      totalContacts: contacts.length,
      toFollowUp,
      byStatus,
      recentContacts,
      overdueFollowUps,
      weeklyNewContacts,
      monthlyNewClients,
      recentActivity,
      totalInteractions,
    };
  }, [contacts, recentActivity, totalInteractions]);

  return { ...stats, loading, refetch: refetchAll };
}
