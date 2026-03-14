-- Table interactions (etape_04)
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  type text not null,
  content text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index interactions_contact_id_idx on public.interactions(contact_id);
create index interactions_user_id_idx on public.interactions(user_id);

alter table public.interactions enable row level security;

create policy "Users can manage own interactions"
  on public.interactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Champ last_interaction_at sur contacts
alter table public.contacts
  add column if not exists last_interaction_at timestamp with time zone;
