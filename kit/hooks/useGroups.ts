import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { Group, GroupType } from "../types";

interface CreateGroupInput {
  name: string;
  description?: string;
  color: string;
  emoji: string;
  type: GroupType;
}

export function useGroups(type?: GroupType) {
  const { user } = useAuthContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("groups")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });

    if (type) query = query.eq("type", type);

    const { data } = await query;
    setGroups((data ?? []) as Group[]);
    setLoading(false);
  }, [user, type]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (
    input: CreateGroupInput
  ): Promise<Group | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("groups")
      .insert({ ...input, owner_id: user.id })
      .select()
      .single();
    if (error || !data) {
      return null;
    }
    setGroups((prev) => [...prev, data as Group]);
    return data as Group;
  };

  const updateGroup = async (
    id: string,
    input: Partial<CreateGroupInput>
  ): Promise<boolean> => {
    const { error } = await supabase.from("groups").update(input).eq("id", id);
    if (error) {
      return false;
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? ({ ...g, ...input } as Group) : g))
    );
    return true;
  };

  const deleteGroup = async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) {
      return false;
    }
    setGroups((prev) => prev.filter((g) => g.id !== id));
    return true;
  };

  return { groups, loading, refetch: fetchGroups, createGroup, updateGroup, deleteGroup };
}

