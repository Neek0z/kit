import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { ContactRelance, FollowUpRecurrence } from "../types";
import {
  cancelNotification,
  getReminderTime,
  scheduleFollowUpNotification,
} from "../lib/notifications";

function sortRelances(list: ContactRelance[]) {
  return [...list].sort((a, b) => {
    const aDone = !!a.done_at;
    const bDone = !!b.done_at;
    if (aDone !== bDone) return aDone ? 1 : -1;
    const at = new Date(aDone ? (a.done_at as string) : a.scheduled_at).getTime();
    const bt = new Date(bDone ? (b.done_at as string) : b.scheduled_at).getTime();
    return aDone ? bt - at : at - bt;
  });
}

export interface UseContactRelancesOptions {
  contactName: string;
  legacyNextFollowUp?: string | null;
  legacyNotificationId?: string | null;
  onContactsSynced?: () => void | Promise<void>;
}

async function syncContactNextFollowUp(
  contactId: string,
  userId: string,
  onContactsSynced?: () => void | Promise<void>
) {
  const { data: rows } = await supabase
    .from("contact_relances")
    .select("scheduled_at")
    .eq("contact_id", contactId)
    .eq("user_id", userId)
    .is("done_at", null)
    .order("scheduled_at", { ascending: true })
    .limit(1);

  const next = rows?.[0]?.scheduled_at ?? null;

  const { data: c } = await supabase
    .from("contacts")
    .select("notification_id")
    .eq("id", contactId)
    .maybeSingle();

  if (c?.notification_id) {
    try {
      await cancelNotification(c.notification_id);
    } catch {
      /* ignore */
    }
  }

  await supabase
    .from("contacts")
    .update({ next_follow_up: next, notification_id: null })
    .eq("id", contactId);

  await onContactsSynced?.();
}

export function useContactRelances(
  contactId: string,
  options: UseContactRelancesOptions
) {
  const { user } = useAuthContext();
  const {
    contactName,
    legacyNextFollowUp,
    legacyNotificationId,
    onContactsSynced,
  } = options;

  const [relances, setRelances] = useState<ContactRelance[]>([]);
  const [loading, setLoading] = useState(true);
  const migrationDoneRef = useRef(false);

  const applyReminderTime = useCallback(async (day: Date) => {
    const { hour, minute } = await getReminderTime();
    const d = new Date(day);
    d.setHours(hour, minute, 0, 0);
    return d;
  }, []);

  const reloadListOnly = useCallback(async () => {
    if (!user || !contactId) return;
    const { data, error } = await supabase
      .from("contact_relances")
      .select("*")
      .eq("contact_id", contactId)
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });
    if (!error) {
      setRelances(sortRelances((data ?? []) as ContactRelance[]));
    }
  }, [user, contactId]);

  const fetchRelances = useCallback(async () => {
    if (!user || !contactId) {
      setRelances([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("contact_relances")
      .select("*")
      .eq("contact_id", contactId)
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (error) {
      setRelances([]);
      setLoading(false);
      return;
    }

    let list = (data ?? []) as ContactRelance[];

    if (
      list.length === 0 &&
      legacyNextFollowUp &&
      !migrationDoneRef.current
    ) {
      migrationDoneRef.current = true;
      try {
        if (legacyNotificationId) {
          try {
            await cancelNotification(legacyNotificationId);
          } catch {
            /* ignore */
          }
        }
        const d = await applyReminderTime(new Date(legacyNextFollowUp));
        let notifId: string | null = null;
        try {
          notifId = await scheduleFollowUpNotification(
            contactName,
            contactId,
            d
          );
        } catch {
          notifId = null;
        }
        const { data: inserted, error: insErr } = await supabase
          .from("contact_relances")
          .insert({
            user_id: user.id,
            contact_id: contactId,
            scheduled_at: d.toISOString(),
            note: null,
            notification_id: notifId,
          })
          .select()
          .single();

        if (!insErr && inserted) {
          await syncContactNextFollowUp(
            contactId,
            user.id,
            onContactsSynced
          );
          const { data: data2 } = await supabase
            .from("contact_relances")
            .select("*")
            .eq("contact_id", contactId)
            .eq("user_id", user.id)
            .order("scheduled_at", { ascending: true });
          list = (data2 ?? []) as ContactRelance[];
        }
      } catch {
        migrationDoneRef.current = false;
      }
    }

    setRelances(sortRelances(list));
    setLoading(false);
  }, [
    user,
    contactId,
    legacyNextFollowUp,
    legacyNotificationId,
    contactName,
    applyReminderTime,
    onContactsSynced,
  ]);

  useEffect(() => {
    migrationDoneRef.current = false;
  }, [contactId]);

  useEffect(() => {
    fetchRelances();
  }, [fetchRelances]);

  const pendingRelances = useMemo(
    () => relances.filter((r) => !r.done_at),
    [relances]
  );
  const doneRelances = useMemo(
    () => relances.filter((r) => !!r.done_at),
    [relances]
  );
  const pendingCount = pendingRelances.length;

  const createRelance = useCallback(
    async (day: Date, note?: string): Promise<boolean> => {
      if (!user || !contactId) return false;
      try {
        const d = await applyReminderTime(day);
        let notifId: string | null = null;
        try {
          notifId = await scheduleFollowUpNotification(
            contactName,
            contactId,
            d
          );
        } catch {
          notifId = null;
        }
        const { data, error } = await supabase
          .from("contact_relances")
          .insert({
            user_id: user.id,
            contact_id: contactId,
            scheduled_at: d.toISOString(),
            note: note?.trim() || null,
            notification_id: notifId,
          })
          .select()
          .single();

        if (error || !data) return false;
        await syncContactNextFollowUp(contactId, user.id, onContactsSynced);
        await reloadListOnly();
        return true;
      } catch {
        return false;
      }
    },
    [
      user,
      contactId,
      contactName,
      applyReminderTime,
      onContactsSynced,
      reloadListOnly,
    ]
  );

  const updateRelance = useCallback(
    async (
      id: string,
      params: { scheduled_at?: Date; note?: string | null }
    ): Promise<boolean> => {
      if (!user || !contactId) return false;
      const current = relances.find((r) => r.id === id);
      if (!current) return false;

      try {
        let scheduledIso = current.scheduled_at;
        let notifId = current.notification_id;

        if (params.scheduled_at) {
          if (notifId) {
            try {
              await cancelNotification(notifId);
            } catch {
              /* ignore */
            }
          }
          const d = await applyReminderTime(params.scheduled_at);
          try {
            notifId = await scheduleFollowUpNotification(
              contactName,
              contactId,
              d
            );
          } catch {
            notifId = null;
          }
          scheduledIso = d.toISOString();
        }

        const patch: Record<string, unknown> = {};
        if (params.scheduled_at) {
          patch.scheduled_at = scheduledIso;
          patch.notification_id = notifId;
        }
        if (params.note !== undefined) {
          patch.note = params.note?.trim() || null;
        }

        const { error } = await supabase
          .from("contact_relances")
          .update(patch)
          .eq("id", id);

        if (error) return false;

        await syncContactNextFollowUp(contactId, user.id, onContactsSynced);
        await reloadListOnly();
        return true;
      } catch {
        return false;
      }
    },
    [
      user,
      contactId,
      contactName,
      relances,
      applyReminderTime,
      onContactsSynced,
      reloadListOnly,
    ]
  );

  const deleteRelance = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user || !contactId) return false;
      const row = relances.find((r) => r.id === id);
      if (row?.notification_id) {
        try {
          await cancelNotification(row.notification_id);
        } catch {
          /* ignore */
        }
      }
      const { error } = await supabase
        .from("contact_relances")
        .delete()
        .eq("id", id);
      if (error) return false;
      await syncContactNextFollowUp(contactId, user.id, onContactsSynced);
      await reloadListOnly();
      return true;
    },
    [user, contactId, relances, onContactsSynced, reloadListOnly]
  );

  const completeRelance = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user || !contactId) return false;
      const row = relances.find((r) => r.id === id);
      if (row?.notification_id) {
        try {
          await cancelNotification(row.notification_id);
        } catch {
          /* ignore */
        }
      }
      const doneAt = new Date().toISOString();
      const { error } = await supabase
        .from("contact_relances")
        .update({
          done_at: doneAt,
          notification_id: null,
        })
        .eq("id", id);
      if (error) return false;
      await syncContactNextFollowUp(contactId, user.id, onContactsSynced);
      await reloadListOnly();
      return true;
    },
    [user, contactId, relances, onContactsSynced, reloadListOnly]
  );

  const completeEarliest = useCallback(async (): Promise<boolean> => {
    const pending = [...pendingRelances].sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() -
        new Date(b.scheduled_at).getTime()
    );
    if (pending.length === 0) return false;
    return completeRelance(pending[0].id);
  }, [pendingRelances, completeRelance]);

  const reprogramEarliestByRecurrence = useCallback(
    async (recurrence: FollowUpRecurrence): Promise<boolean> => {
      if (!user || !contactId || recurrence === "none") return false;
      const pending = [...pendingRelances].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() -
          new Date(b.scheduled_at).getTime()
      );
      if (pending.length === 0) return false;
      const first = pending[0];
      const { hour, minute } = await getReminderTime();
      const d = new Date();
      d.setHours(hour, minute, 0, 0);
      if (recurrence === "weekly") d.setDate(d.getDate() + 7);
      else if (recurrence === "biweekly") d.setDate(d.getDate() + 14);
      else if (recurrence === "monthly") d.setMonth(d.getMonth() + 1);
      return updateRelance(first.id, { scheduled_at: d });
    },
    [user, contactId, pendingRelances, updateRelance]
  );

  return {
    relances,
    pendingRelances,
    doneRelances,
    pendingCount,
    loading,
    refetch: fetchRelances,
    createRelance,
    updateRelance,
    deleteRelance,
    completeRelance,
    completeEarliest,
    reprogramEarliestByRecurrence,
    applyReminderTime,
  };
}

export function usePendingRelancesCount(contactId: string) {
  const { user } = useAuthContext();
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!user || !contactId) {
      setCount(0);
      return;
    }
    const { count: c, error } = await supabase
      .from("contact_relances")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contactId)
      .eq("user_id", user.id)
      .is("done_at", null);
    if (error) {
      setCount(0);
      return;
    }
    setCount(c ?? 0);
  }, [user, contactId]);

  useEffect(() => {
    load();
  }, [load]);

  return { pendingCount: count, refetch: load };
}
