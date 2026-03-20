-- Messagerie in-app : conversations 1-to-1 entre utilisateurs KIT

-- Conversations (sans colonnes user: on passe par la table de participation)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Qui participe à quelle conversation (exactement 2 pour du 1-to-1)
create table if not exists public.conversation_participants (
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  primary key (conversation_id, user_id)
);

create index if not exists idx_conversation_participants_user
  on public.conversation_participants (user_id);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  read_at timestamp with time zone
);

create index if not exists idx_messages_conversation_created
  on public.messages (conversation_id, created_at desc);

-- RLS
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Conversations : voir uniquement celles où on participe
drop policy if exists "Users see own conversations" on public.conversations;
create policy "Users see own conversations"
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert conversations" on public.conversations;
create policy "Users can insert conversations"
  on public.conversations for insert
  with check (true);

-- Participants : voir / ajouter pour ses conversations
drop policy if exists "Users see participants of own conversations" on public.conversation_participants;
create policy "Users see participants of own conversations"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert participants" on public.conversation_participants;
create policy "Users can insert participants"
  on public.conversation_participants for insert
  with check (user_id = auth.uid() or exists (
    select 1 from public.conversation_participants cp
    where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
  ));

-- Messages : voir ceux des conversations où on participe ; insérer si on participe
drop policy if exists "Users see messages in own conversations" on public.messages;
create policy "Users see messages in own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

drop policy if exists "Users can send messages in own conversations" on public.messages;
create policy "Users can send messages in own conversations"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );

-- Marquer un message comme lu : uniquement les messages reçus (pas les siens) dans ses conversations
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

-- Mettre à jour updated_at sur une conversation à chaque nouveau message
create or replace function public.set_conversation_updated_at()
returns trigger as $$
begin
  update public.conversations
  set updated_at = timezone('utc'::text, now())
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_message_created on public.messages;
create trigger on_message_created
  after insert on public.messages
  for each row execute procedure public.set_conversation_updated_at();

-- Realtime : pour recevoir les nouveaux messages en direct
-- Dans Supabase Dashboard → Database → Replication → activer la réplication pour la table "messages"
