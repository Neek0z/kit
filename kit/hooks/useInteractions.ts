import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { Interaction, InteractionType } from "../types";
import { useAuthContext } from "../lib/AuthContext";

interface UseInteractionsReturn {
  interactions: Interaction[];
  loading: boolean;
  addInteraction: (
    contactId: string,
    type: InteractionType,
    content?: string
  ) => Promise<boolean>;
  deleteInteraction: (id: string) => Promise<boolean>;
}

export function useInteractions(
  contactId: string
): UseInteractionsReturn {
  const { user } = useAuthContext();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInteractions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("interactions")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false });

    setInteractions((data ?? []) as Interaction[]);
    setLoading(false);
  }, [contactId, user]);

  useEffect(() => {
    fetchInteractions();
  }, [fetchInteractions]);

  const addInteraction = async (
    contactId: string,
    type: InteractionType,
    content?: string
  ): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from("interactions")
      .insert({ contact_id: contactId, user_id: user.id, type, content })
      .select()
      .single();

    if (error) return false;

    setInteractions((prev) => [data as Interaction, ...prev]);

    await supabase
      .from("contacts")
      .update({ last_interaction_at: new Date().toISOString() })
      .eq("id", contactId);

    return true;
  };

  const deleteInteraction = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from("interactions")
      .delete()
      .eq("id", id);

    if (error) return false;
    setInteractions((prev) => prev.filter((i) => i.id !== id));
    return true;
  };

  return { interactions, loading, addInteraction, deleteInteraction };
}
