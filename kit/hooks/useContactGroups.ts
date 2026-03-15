import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Group } from "../types";

export function useContactGroups(contactId: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contactId) return;
    supabase
      .from("contact_group_members")
      .select("group_id, groups(*)")
      .eq("contact_id", contactId)
      .then(({ data }) => {
        setGroups(
          (data ?? [])
            .map((d: any) => d.groups as Group)
            .filter(Boolean)
        );
        setLoading(false);
      });
  }, [contactId]);

  const addToGroup = async (groupId: string): Promise<boolean> => {
    const { error } = await supabase
      .from("contact_group_members")
      .insert({ group_id: groupId, contact_id: contactId });
    if (error) {
      console.log(
        "SUPABASE ERROR (addToGroup):",
        JSON.stringify(error)
      );
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
      console.log(
        "SUPABASE ERROR (removeFromGroup):",
        JSON.stringify(error)
      );
      return false;
    }
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    return true;
  };

  return { groups, loading, addToGroup, removeFromGroup };
}

