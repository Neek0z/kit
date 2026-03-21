import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

/**
 * Fetches pending relance counts for ALL given contacts in a single query
 * instead of N individual queries (one per ContactCard).
 */
export function usePendingRelancesCounts(contactIds: string[]) {
  const { user } = useAuthContext();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user || contactIds.length === 0) {
      setCounts({});
      return;
    }
    let mounted = true;

    supabase
      .from("contact_relances")
      .select("contact_id")
      .eq("user_id", user.id)
      .is("done_at", null)
      .in("contact_id", contactIds)
      .then(({ data }) => {
        if (!mounted || !data) return;
        const result: Record<string, number> = {};
        contactIds.forEach((id) => {
          result[id] = 0;
        });
        data.forEach((row) => {
          result[row.contact_id] = (result[row.contact_id] ?? 0) + 1;
        });
        setCounts(result);
      });

    return () => {
      mounted = false;
    };
  }, [user, contactIds.join(",")]);

  return counts;
}
