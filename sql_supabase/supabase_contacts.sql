-- Étape 03 — À exécuter dans Supabase Dashboard → SQL Editor
-- Table contacts
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  full_name text not null,
  phone text,
  email text,
  notes text,
  status text default 'new' not null,
  next_follow_up timestamp with time zone,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index pour les requêtes par user
create index contacts_user_id_idx on public.contacts(user_id);
create index contacts_status_idx on public.contacts(user_id, status);
create index contacts_follow_up_idx on public.contacts(user_id, next_follow_up);

-- RLS
alter table public.contacts enable row level security;

create policy "Users can manage own contacts"
  on public.contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trigger updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at
  before update on public.contacts
  for each row execute procedure public.handle_updated_at();
