-- Messagerie de groupe : conversation liée à un groupe de contacts
-- Les participants = toi + les utilisateurs KIT dont l’email correspond à un contact du groupe.

alter table public.conversations
  add column if not exists kind text not null default 'direct';

alter table public.conversations
  drop constraint if exists conversations_kind_check;

alter table public.conversations
  add constraint conversations_kind_check
  check (kind in ('direct', 'group'));

alter table public.conversations
  add column if not exists source_group_id uuid references public.groups (id) on delete set null;

create unique index if not exists conversations_one_chat_per_contact_group
  on public.conversations (source_group_id)
  where kind = 'group' and source_group_id is not null;

create index if not exists conversations_source_group_id_idx
  on public.conversations (source_group_id)
  where source_group_id is not null;

-- Les membres d’une conversation de groupe peuvent lire le groupe (nom, emoji…) même s’ils n’en sont pas propriétaires.
-- IMPORTANT : ne pas faire un JOIN direct sur conversation_participants ici (récursion RLS avec la politique SELECT de cette table).
-- Utiliser la fonction créée dans fix_messaging_rls_recursion.sql (ou ci-dessous si tu n’exécutes que ce fichier).
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

grant execute on function public.kit_user_in_group_conversation(uuid, uuid) to authenticated;

drop policy if exists "Group chat participants see contact group meta" on public.groups;
create policy "Group chat participants see contact group meta"
  on public.groups for select
  using (
    type = 'contact'
    and public.kit_user_in_group_conversation(id, auth.uid())
  );
