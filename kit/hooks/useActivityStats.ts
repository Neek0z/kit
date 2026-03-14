import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

export interface ActivityStats {
  countLast7Days: number;
  countLast30Days: number;
  contactsContactedThisMonth: number;
}

export function useActivityStats(): ActivityStats & { loading: boolean } {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ActivityStats>({
    countLast7Days: 0,
    countLast30Days: 0,
    contactsContactedThisMonth: 0,
  });

  useEffect(() => {
    if (!user) return;

    const run = async () => {
      setLoading(true);
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const iso7 = sevenDaysAgo.toISOString();
      const iso30 = thirtyDaysAgo.toISOString();
      const isoMonth = startOfMonth.toISOString();

      const [
        { count: count7 },
        { count: count30 },
        { data: monthData },
      ] = await Promise.all([
        supabase
          .from("interactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", iso7),
        supabase
          .from("interactions")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", iso30),
        supabase
          .from("interactions")
          .select("contact_id")
          .eq("user_id", user.id)
          .gte("created_at", isoMonth),
      ]);

      const contactIds = new Set<string>();
      monthData?.forEach((row) => {
        if (row.contact_id) contactIds.add(row.contact_id);
      });
      const uniqueContacts = contactIds.size;

      setStats({
        countLast7Days: count7 ?? 0,
        countLast30Days: count30 ?? 0,
        contactsContactedThisMonth: uniqueContacts,
      });
      setLoading(false);
    };

    run();
  }, [user?.id]);

  return { ...stats, loading };
}
