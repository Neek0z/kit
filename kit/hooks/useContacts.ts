import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { updateWidgetData } from "../lib/widgetData";
import { Contact } from "../types";
import { useAuthContext } from "../lib/AuthContext";
import { triggerClientWorkflow, cancelClientWorkflow } from "../lib/workflowService";
import { Alert } from "react-native";

interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createContact: (data: CreateContactInput) => Promise<Contact | null>;
  updateContact: (
    id: string,
    data: Partial<CreateContactInput>
  ) => Promise<{ ok: boolean; errorMessage?: string }>;
  deleteContact: (id: string) => Promise<boolean>;
}

export interface CreateContactInput {
  full_name: string;
  phone?: string;
  email?: string;
  notes?: string;
  status?: string;
  next_follow_up?: string | null;
  follow_up_recurrence?: string | null;
  notification_id?: string | null;
  tags?: string[];
}

export function useContacts(): UseContactsReturn {
  const { user } = useAuthContext();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const { data, err } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("full_name", { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setContacts((data ?? []) as Contact[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (!user || loading) return;
    updateWidgetData(contacts);
  }, [contacts, user, loading]);

  const createContact = async (
    data: CreateContactInput
  ): Promise<Contact | null> => {
    if (!user) return null;

    const { data: contact, error: err } = await supabase
      .from("contacts")
      .insert({ ...data, user_id: user.id })
      .select()
      .single();

    if (err) {
      setError(err.message);
      return null;
    }

    setContacts((prev) =>
      [...prev, contact as Contact].sort((a, b) =>
        a.full_name.localeCompare(b.full_name)
      )
    );
    return contact as Contact;
  };

  const updateContact = async (
    id: string,
    data: Partial<CreateContactInput>
  ): Promise<{ ok: boolean; errorMessage?: string }> => {
    const currentContact = contacts.find((c) => c.id === id);

    const { error: err } = await supabase
      .from("contacts")
      .update(data)
      .eq("id", id);

    if (err) {
      setError(err.message);
      return { ok: false, errorMessage: err.message };
    }

    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...data } : c))
    );

    // Passage vers Client → proposer de créer le workflow d'accompagnement
    if (data.status === "client" && currentContact?.status !== "client" && user) {
      Alert.alert(
        "Activer le workflow Client ?",
        "En passant ce contact en Client, KIT peut créer automatiquement une série de relances planifiées avec notifications. Veux-tu activer ce workflow pour ce contact ?",
        [
          { text: "Non", style: "cancel" },
          {
            text: "Oui",
            onPress: () => {
              triggerClientWorkflow(user.id, id, currentContact?.full_name ?? "");
            },
          },
        ]
      );
    }

    // Sortie du statut Client → proposer d'annuler le workflow existant
    if (
      data.status &&
      data.status !== "client" &&
      currentContact?.status === "client"
    ) {
      Alert.alert(
        "Retirer le statut Client ?",
        "Le workflow d'accompagnement en cours pour ce contact sera annulé.",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Confirmer",
            style: "destructive",
            onPress: () => {
              cancelClientWorkflow(id);
            },
          },
        ]
      );
    }

    return { ok: true };
  };

  const deleteContact = async (id: string): Promise<boolean> => {
    const { error: err } = await supabase.from("contacts").delete().eq("id", id);

    if (err) {
      setError(err.message);
      return false;
    }

    setContacts((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  return {
    contacts,
    loading,
    error,
    refetch: fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  };
}
