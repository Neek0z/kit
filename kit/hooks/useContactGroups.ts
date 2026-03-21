import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Group } from "../types";

export function useContactGroups(contactId: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contactId) return;
    let mounted = true;

    supabase
      .from("contact_group_members")
      .select("group_id, groups(*)")
      .eq("contact_id", contactId)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error("Erreur chargement groupes du contact :", error.message);
        }
        setGroups(
          (data ?? [])
            .map((d) => (d as Record<string, unknown>).groups as Group)
            .filter(Boolean)
        );
        setLoading(false);
      });

    return () => { mounted = false; };
  }, [contactId]);

  const addToGroup = async (groupId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("contact_group_members")
      .insert({ group_id: groupId, contact_id: contactId });
    if (error) {
      return false;
    }
    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("id", groupId)
      .single();
    if (data) setGroups((prev) => [...prev, data as Group]);
    return true;
  };

  const removeFromGroup = async (groupId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("contact_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("contact_id", contactId);
    if (error) {
      return false;
    }
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return true;
  };

  return { groups, loading, addToGroup, removeFromGroup };
}

