-- À exécuter dans Supabase → SQL Editor si tu as déjà exécuté supabase_messages.sql
-- sans la politique "mark as read". Prérequis : fonction kit_conversation_has_participant
-- (voir supabase_messages.sql ou fix_messaging_rls_recursion.sql).

drop policy if exists "Users can mark received messages as read" on public.messages;
create policy "Users can mark received messages as read"
  on public.messages for update
  using (
    sender_id <> auth.uid()
    and public.kit_conversation_has_participant(conversation_id, auth.uid())
  )
  with check (true);
