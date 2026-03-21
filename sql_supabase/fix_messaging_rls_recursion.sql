-- Corrige l’erreur 42P17 « infinite recursion detected in policy for relation conversation_participants »
-- Cause : les politiques RLS qui font un sous-SELECT sur conversation_participants réévaluent RLS en boucle.
-- + la politique « Group chat participants see contact group meta » sur groups déclenche cette chaîne
--   lors de simples opérations (ex. création d’un groupe de contacts qui vérifie groups).
--
-- À exécuter une fois dans Supabase SQL Editor (après supabase_messages.sql et conversations_group_chat.sql).

-- 1) Helpers SECURITY DEFINER : lecture sans ré-appliquer RLS sur conversation_participants
create or replace function public.kit_conversation_has_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  );
$$;

create or replace function public.kit_user_in_group_conversation(
  p_group_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    join public.conversation_participants cp on cp.conversation_id = c.id
    where c.source_group_id = p_group_id
      and c.kind = 'group'
      and cp.user_id = p_user_id
  );
$$;

grant execute on function public.kit_conversation_has_participant(uuid, uuid) to authenticated;
grant execute on function public.kit_user_in_group_conversation(uuid, uuid) to authenticated;

-- 2) conversations
drop policy if exists "Users see own conversations" on public.conversations;
create policy "Users see own conversations"
  on public.conversations for select
  using (public.kit_conversation_has_participant(id, auth.uid()));

-- 3) conversation_participants
drop policy if exists "Users see participants of own conversations" on public.conversation_participants;
create policy "Users see participants of own conversations"
  on public.conversation_participants for select
  using (public.kit_conversation_has_participant(conversation_id, auth.uid()));

drop policy if exists "Users can insert participants" on public.conversation_participants;
create policy "Users can insert participants"
  on public.conversation_participants for insert
  with check (
    user_id = auth.uid()
    or public.kit_conversation_has_participant(conversation_id, auth.uid())
  );

-- 4) messages
drop policy if exists "Users see messages in own conversations" on public.messages;
create policy "Users see messages in own conversations"
  on public.messages for select
  using (public.kit_conversation_has_participant(conversation_id, auth.uid()));

drop policy if exists "Users can send messages in own conversations" on public.messages;
create policy "Users can send messages in own conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.kit_conversation_has_participant(conversation_id, auth.uid())
  );

drop policy if exists "Users can mark received messages as read" on public.messages;
create policy "Users can mark received messages as read"
  on public.messages for update
  using (
    sender_id <> auth.uid()
    and public.kit_conversation_has_participant(conversation_id, auth.uid())
  )
  with check (true);

-- 5) groups : éviter JOIN conversation_participants dans la politique (même problème)
drop policy if exists "Group chat participants see contact group meta" on public.groups;
create policy "Group chat participants see contact group meta"
  on public.groups for select
  using (
    type = 'contact'
    and public.kit_user_in_group_conversation(id, auth.uid())
  );
