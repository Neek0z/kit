import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Appointment } from "../types";
import { useAuthContext } from "../lib/AuthContext";

export interface AppointmentWithContact extends Appointment {
  /** Joined contact name for the primary contact_id (legacy) */
  contacts: { full_name: string } | null;
}

interface UseAppointmentsOptions {
  contactId?: string | null;
  /** If true and no contactId, select with contacts(full_name) for list views */
  withContactName?: boolean;
}

interface UseAppointmentsReturn {
  appointments: Appointment[] | AppointmentWithContact[];
  loading: boolean;
  refetch: () => Promise<void>;
  createAppointment: (params: {
    contact_ids: string[];
    scheduled_at: string;
    title?: string;
    notes?: string;
  }) => Promise<Appointment | null>;
  updateAppointment: (
    id: string,
    params: { scheduled_at?: string; title?: string; notes?: string }
  ) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
}

export function useAppointments(
  options: UseAppointmentsOptions = {}
): UseAppointmentsReturn {
  const { contactId, withContactName = false } = options;
  const { user } = useAuthContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const selectStr = withContactName && !contactId
      ? "*, contacts(full_name)"
      : "*";
    let query = supabase
      .from("appointments")
      .select(selectStr)
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (contactId) {
      query = query.contains("contact_ids", JSON.stringify([contactId]));
    }

    const { data } = await query;
    const list = (data ?? []) as (Appointment & { contacts?: { full_name: string } | null })[];
    setAppointments(list);
    setLoading(false);
  }, [user, contactId, withContactName]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createAppointment = async (params: {
    contact_ids: string[];
    scheduled_at: string;
    title?: string;
    notes?: string;
  }): Promise<Appointment | null> => {
    if (!user || params.contact_ids.length === 0) return null;
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        user_id: user.id,
        contact_id: params.contact_ids[0],
        contact_ids: params.contact_ids,
        scheduled_at: params.scheduled_at,
        title: params.title ?? null,
        notes: params.notes ?? null,
      })
      .select()
      .single();
    if (error) return null;
    setAppointments((prev) =>
      [...prev, data as Appointment].sort(
        (a, b) =>
          new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )
    );
    return data as Appointment;
  };

  const updateAppointment = async (
    id: string,
    params: { scheduled_at?: string; title?: string; notes?: string }
  ): Promise<boolean> => {
    const updates: Record<string, unknown> = {};
    if (params.scheduled_at != null) updates.scheduled_at = params.scheduled_at;
    if (params.title != null) updates.title = params.title;
    if (params.notes != null) updates.notes = params.notes;
    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) return false;
    setAppointments((prev) =>
      prev
        .map((a) => (a.id === id ? (data as Appointment) : a))
        .sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        )
    );
    return true;
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return false;
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    return true;
  };

  return {
    appointments,
    loading,
    refetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
