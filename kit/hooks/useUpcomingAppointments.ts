import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

export interface UpcomingAppointment {
  id: string;
  title: string;
  start_date: string;
  contact_name?: string;
  contact_id?: string;
}

export function useUpcomingAppointments(limit = 3) {
  const { user } = useAuthContext();
  const [appointments, setAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const run = async () => {
      const now = new Date().toISOString();
      setLoading(true);

      try {
        const { data } = await supabase
          .from("appointments")
          .select("id, title, scheduled_at, contact_id, contacts(full_name)")
          .eq("user_id", user.id)
          .gte("scheduled_at", now)
          .order("scheduled_at", { ascending: true })
          .limit(limit);

        const list = (data ?? []) as Array<{
          id: string;
          title?: string | null;
          scheduled_at: string;
          contact_id?: string;
          contacts?: { full_name: string }[] | { full_name: string } | null;
        }>;

        const normalized: UpcomingAppointment[] = list.map((a: any) => {
          const contact = Array.isArray(a.contacts) ? a.contacts[0] : a.contacts;

          return {
            id: a.id,
            title: a.title ?? "Rendez-vous",
            start_date: a.scheduled_at,
            contact_name: contact?.full_name,
            contact_id: a.contact_id,
          };
        });

        if (mounted) setAppointments(normalized);
      } catch {
        if (mounted) setAppointments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [user, limit]);

  return { appointments, loading };
}

