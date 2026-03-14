import { useMemo } from "react";
import { useContacts } from "./useContacts";
import { Contact, PipelineStatus } from "../types";

interface DashboardStats {
  totalContacts: number;
  toFollowUp: Contact[];
  byStatus: Record<PipelineStatus, number>;
  recentContacts: Contact[];
  overdueFollowUps: Contact[];
}

export function useDashboard(): DashboardStats & { loading: boolean; refetch: () => Promise<void> } {
  const { contacts, loading, refetch } = useContacts();

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

    return {
      totalContacts: contacts.length,
      toFollowUp,
      byStatus,
      recentContacts,
      overdueFollowUps,
    };
  }, [contacts]);

  return { ...stats, loading, refetch };
}
