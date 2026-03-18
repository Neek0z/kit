import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";
import type { Contact } from "../types";

export function useGroupMembers(groupId: string) {
  const { user } = useAuthContext();
  const [members, setMembers] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!user || !groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1) Tentative via jointure (contacts(*)) si Supabase a la relation FK
    const { data, error } = await supabase
      .from("contact_group_members")
      .select("contact_id, contacts(*)")
      .eq("group_id", groupId);

    if (error) {
      console.log("SUPABASE ERROR (fetchMembers):", JSON.stringify(error));
      setMembers([]);
      setLoading(false);
      return;
    }

    const joinedContacts = (data ?? [])
      .map((d: any) => d.contacts as Contact | null)
      .filter(Boolean) as Contact[];

    if (joinedContacts.length > 0) {
      setMembers(joinedContacts);
      setLoading(false);
      return;
    }

    // 2) Fallback: récupérer les IDs puis recharger `contacts`
    const ids = Array.from(
      new Set((data ?? []).map((d: any) => d.contact_id).filter(Boolean))
    ) as string[];

    if (ids.length === 0) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const { data: contactsData, error: contactsErr } = await supabase
      .from("contacts")
      .select("*")
      .in("id", ids)
      .order("full_name", { ascending: true });

    if (contactsErr) {
      console.log(
        "SUPABASE ERROR (fetchMembers contacts):",
        JSON.stringify(contactsErr)
      );
      setMembers([]);
      setLoading(false);
      return;
    }

    setMembers((contactsData ?? []) as Contact[]);
    setLoading(false);
  }, [groupId, user]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const addContactToGroup = useCallback(
    async (contactId: string): Promise<boolean> => {
      if (!user || !groupId) return false;

      const { error } = await supabase
        .from("contact_group_members")
        .insert({ group_id: groupId, contact_id: contactId });

      if (error) {
        console.log(
          "SUPABASE ERROR (addContactToGroup):",
          JSON.stringify(error)
        );
        return false;
      }

      const { data, error: fetchErr } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .single();

      if (fetchErr || !data) return false;

      setMembers((prev) => {
        if (prev.some((m) => m.id === contactId)) return prev;
        return [...prev, data as Contact];
      });

      return true;
    },
    [groupId, user]
  );

  const removeContactFromGroup = useCallback(
    async (contactId: string): Promise<boolean> => {
      if (!user || !groupId) return false;

      const { error } = await supabase
        .from("contact_group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("contact_id", contactId);

      if (error) {
        console.log(
          "SUPABASE ERROR (removeContactFromGroup):",
          JSON.stringify(error)
        );
        return false;
      }

      setMembers((prev) => prev.filter((m) => m.id !== contactId));
      return true;
    },
    [groupId, user]
  );

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  return {
    members,
    memberIds,
    loading,
    refetch: fetchMembers,
    addContactToGroup,
    removeContactFromGroup,
  };
}

