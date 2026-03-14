-- À exécuter dans Supabase → SQL Editor si tu as déjà exécuté supabase_messages.sql
-- sans la politique "mark as read". Sinon tu peux ré-exécuter tout supabase_messages.sql.

drop policy if exists "Users can mark received messages as read" on public.messages;
create policy "Users can mark received messages as read"
  on public.messages for update
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  )
  with check (true);
