import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

export type NotificationItem = {
  id: string;
  type: "follow_up" | "task" | "workflow" | "message" | "appointment";
  title: string;
  subtitle: string;
  contactId?: string;
  contactName?: string;
  route: string;
  createdAt: Date;
  isUrgent: boolean;
};

export function useNotificationCenter() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const items: NotificationItem[] = [];

    const [
      { data: overdueFollowUps },
      { data: overdueTasks },
      { data: overdueWorkflow },
      { data: unreadMessages },
      { data: todayAppts },
    ] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, full_name, next_follow_up")
        .eq("user_id", user.id)
        .lt("next_follow_up", now)
        .not("next_follow_up", "is", null)
        .order("next_follow_up", { ascending: true })
        .limit(10),
      supabase
        .from("contact_tasks")
        .select("id, title, due_date, contact_id, contacts(full_name)")
        .eq("user_id", user.id)
        .lt("due_date", now)
        .is("completed_at", null)
        .order("due_date", { ascending: true })
        .limit(10),
      supabase
        .from("workflow_tasks")
        .select("id, title, due_date, contact_id, contacts(full_name)")
        .eq("user_id", user.id)
        .lt("due_date", now)
        .is("completed_at", null)
        .order("due_date", { ascending: true })
        .limit(5),
      supabase
        .from("messages")
        .select("id, content, created_at, conversation_id, sender_id")
        .neq("sender_id", user.id)
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("appointments")
        .select("id, title, scheduled_at, contact_id, contacts(full_name)")
        .eq("user_id", user.id)
        .gte("scheduled_at", todayStart.toISOString())
        .lte("scheduled_at", todayEnd.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(5),
    ]);

    (overdueFollowUps ?? []).forEach((c: any) => {
      const daysLate = Math.floor(
        (Date.now() - new Date(c.next_follow_up).getTime()) / 86400000
      );
      items.push({
        id: `followup-${c.id}`,
        type: "follow_up",
        title: c.full_name,
        subtitle:
          daysLate === 0
            ? "Relance prévue aujourd'hui"
            : `En retard de ${daysLate} jour${daysLate > 1 ? "s" : ""}`,
        contactId: c.id,
        contactName: c.full_name,
        route: `/(app)/contacts/${c.id}`,
        createdAt: new Date(c.next_follow_up),
        isUrgent: daysLate >= 1,
      });
    });

    (overdueTasks ?? []).forEach((t: any) => {
      items.push({
        id: `task-${t.id}`,
        type: "task",
        title: t.title,
        subtitle: `Tâche en retard · ${t.contacts?.full_name ?? ""}`,
        contactId: t.contact_id,
        contactName: t.contacts?.full_name,
        route: `/(app)/contacts/${t.contact_id}`,
        createdAt: new Date(t.due_date),
        isUrgent: true,
      });
    });

    (overdueWorkflow ?? []).forEach((w: any) => {
      items.push({
        id: `workflow-${w.id}`,
        type: "workflow",
        title: w.title,
        subtitle: `Étape workflow · ${w.contacts?.full_name ?? ""}`,
        contactId: w.contact_id,
        contactName: w.contacts?.full_name,
        route: `/(app)/contacts/${w.contact_id}`,
        createdAt: new Date(w.due_date),
        isUrgent: true,
      });
    });

    (unreadMessages ?? []).forEach((m: any) => {
      items.push({
        id: `message-${m.id}`,
        type: "message",
        title: "Nouveau message",
        subtitle:
          m.content.length > 50
            ? `${m.content.substring(0, 50)}...`
            : m.content,
        route: `/(app)/messages/${m.conversation_id}`,
        createdAt: new Date(m.created_at),
        isUrgent: false,
      });
    });

    (todayAppts ?? []).forEach((a: any) => {
      const time = new Date(a.scheduled_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      items.push({
        id: `appt-${a.id}`,
        type: "appointment",
        title: a.contacts?.full_name ?? a.title ?? "Rendez-vous",
        subtitle: `RDV aujourd'hui à ${time}`,
        contactId: a.contact_id,
        contactName: a.contacts?.full_name,
        route: "/(app)/calendar",
        createdAt: new Date(a.scheduled_at),
        isUrgent: false,
      });
    });

    items.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    setNotifications(items);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const totalCount = notifications.length;
  const urgentCount = notifications.filter((n) => n.isUrgent).length;
  const hasUnread = totalCount > 0;

  return {
    notifications,
    loading,
    totalCount,
    urgentCount,
    hasUnread,
    refetch: fetchNotifications,
  };
}
