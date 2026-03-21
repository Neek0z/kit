import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuthContext } from "../lib/AuthContext";

export type StartGroupConversationResult = {
  conversationId: string | null;
  error?: string;
  /** Contacts du groupe sans email ou sans compte KIT */
  skipped?: string[];
};

async function resolveProfileIdsByEmails(
  emails: string[]
): Promise<{ byEmail: Map<string, string>; skipped: string[] }> {
  const normalized = [
    ...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean)),
  ];
  const byEmail = new Map<string, string>();
  const skipped: string[] = [];

  await Promise.all(
    normalized.map(async (email) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email")
        .ilike("email", email)
        .maybeSingle();

      if (error || !data) {
        skipped.push(email);
        return;
      }
      byEmail.set(email, data.id);
    })
  );

  return { byEmail, skipped };
}

async function resolveKitParticipantsForContactGroup(
  groupId: string,
  ownerId: string
): Promise<{ userIds: Set<string>; skipped: string[] }> {
  const { data: memberRows, error: memErr } = await supabase
    .from("contact_group_members")
    .select("contact_id, contacts(email, full_name)")
    .eq("group_id", groupId);

  if (memErr || !memberRows?.length) {
    return {
      userIds: new Set([ownerId]),
      skipped: [],
    };
  }

  const emails: string[] = [];
  const skippedNoEmail: string[] = [];

  for (const row of memberRows as {
    contacts: { email?: string | null; full_name?: string } | null;
  }[]) {
    const c = row.contacts;
    const em = c?.email?.trim().toLowerCase();
    if (em) emails.push(em);
    else if (c?.full_name) skippedNoEmail.push(`${c.full_name} (pas d’email)`);
  }

  const { byEmail, skipped: skippedUnknown } = await resolveProfileIdsByEmails(
    emails
  );

  const userIds = new Set<string>([ownerId]);
  for (const em of emails) {
    const pid = byEmail.get(em);
    if (pid) userIds.add(pid);
  }

  const skipped = [
    ...skippedUnknown.map((e) => `${e} (pas sur KIT)`),
    ...skippedNoEmail,
  ];

  return { userIds, skipped };
}

async function syncConversationParticipants(
  conversationId: string,
  groupId: string,
  ownerId: string
): Promise<string[]> {
  const { userIds: desired, skipped } = await resolveKitParticipantsForContactGroup(
    groupId,
    ownerId
  );

  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);

  const have = new Set((parts ?? []).map((p) => p.user_id));
  const toAdd = [...desired].filter((id) => !have.has(id));

  if (toAdd.length > 0) {
    await supabase.from("conversation_participants").insert(
      toAdd.map((user_id) => ({
        conversation_id: conversationId,
        user_id,
      }))
    );
  }

  return skipped;
}

/**
 * Ouvre ou crée la conversation de groupe pour un groupe de contacts.
 * Création : réservée au propriétaire du groupe.
 * Si la conversation existe déjà : tu es ajouté comme participant si besoin ; le propriétaire synchronise les nouveaux comptes KIT.
 */
export async function openOrCreateGroupConversation(
  groupId: string,
  userId: string
): Promise<StartGroupConversationResult> {
  const { data: group, error: groupErr } = await supabase
    .from("groups")
    .select("id, owner_id, type")
    .eq("id", groupId)
    .single();

  if (groupErr || !group) {
    return { conversationId: null, error: "Groupe introuvable." };
  }
  if (group.type !== "contact") {
    return {
      conversationId: null,
      error: "Seuls les groupes de contacts peuvent être utilisés pour une messagerie de groupe.",
    };
  }

  const { data: existingConvo } = await supabase
    .from("conversations")
    .select("id")
    .eq("kind", "group")
    .eq("source_group_id", groupId)
    .maybeSingle();

  const ensureSelfParticipant = async (conversationId: string) => {
    const { data: already } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (!already) {
      const { error: joinErr } = await supabase
        .from("conversation_participants")
        .insert({ conversation_id: conversationId, user_id: userId });

      if (joinErr) {
        return joinErr.message;
      }
    }
    return null;
  };

  if (existingConvo?.id) {
    const joinErr = await ensureSelfParticipant(existingConvo.id);
    if (joinErr) {
      return { conversationId: null, error: joinErr };
    }
    let skipped: string[] | undefined;
    if (group.owner_id === userId) {
      skipped = await syncConversationParticipants(
        existingConvo.id,
        groupId,
        group.owner_id
      );
    }
    return { conversationId: existingConvo.id, skipped };
  }

  if (group.owner_id !== userId) {
    return {
      conversationId: null,
      error: "Seul le propriétaire du groupe peut créer la conversation de groupe.",
    };
  }

  const { userIds: participantIds, skipped } =
    await resolveKitParticipantsForContactGroup(groupId, userId);

  if (participantIds.size < 2) {
    return {
      conversationId: null,
      error:
        "Aucun autre membre du groupe n’a un compte KIT : ajoute des emails aux contacts ou invite-les sur KIT.",
      skipped,
    };
  }

  const { data: newConvo, error: convoErr } = await supabase
    .from("conversations")
    .insert({
      kind: "group",
      source_group_id: groupId,
    })
    .select("id")
    .single();

  if (convoErr || !newConvo) {
    if (
      convoErr?.code === "23505" ||
      (convoErr?.message && convoErr.message.includes("unique"))
    ) {
      const { data: again } = await supabase
        .from("conversations")
        .select("id")
        .eq("kind", "group")
        .eq("source_group_id", groupId)
        .maybeSingle();
      if (again?.id) {
        const j = await ensureSelfParticipant(again.id);
        if (j) return { conversationId: null, error: j };
        const sk =
          group.owner_id === userId
            ? await syncConversationParticipants(again.id, groupId, group.owner_id)
            : undefined;
        return { conversationId: again.id, skipped: sk };
      }
    }
    return {
      conversationId: null,
      error: convoErr?.message ?? "Impossible de créer la conversation.",
    };
  }

  const rows = [...participantIds].map((uid) => ({
    conversation_id: newConvo.id,
    user_id: uid,
  }));

  const { error: partErr } = await supabase
    .from("conversation_participants")
    .insert(rows);

  if (partErr) {
    await supabase.from("conversations").delete().eq("id", newConvo.id);
    return {
      conversationId: null,
      error: partErr.message,
    };
  }

  return { conversationId: newConvo.id, skipped };
}

export function useStartGroupConversation() {
  const { user } = useAuthContext();

  const startGroupChatFromContactGroup = useCallback(
    async (groupId: string): Promise<StartGroupConversationResult> => {
      if (!user) {
        return { conversationId: null, error: "Non connecté." };
      }
      return openOrCreateGroupConversation(groupId, user.id);
    },
    [user]
  );

  return { startGroupChatFromContactGroup };
}
