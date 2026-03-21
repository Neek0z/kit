-- Relances planifiées par contact (plusieurs par contact, avec note)
-- À exécuter dans Supabase Dashboard → SQL Editor

create table public.contact_relances (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  scheduled_at timestamp with time zone not null,
  note text,
  notification_id text,
  done_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index contact_relances_contact_id_idx on public.contact_relances(contact_id);
create index contact_relances_user_id_idx on public.contact_relances(user_id);
create index contact_relances_scheduled_idx
  on public.contact_relances(user_id, contact_id, scheduled_at)
  where done_at is null;

alter table public.contact_relances enable row level security;

create policy "Users can manage own contact relances"
  on public.contact_relances for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists contact_relances_updated_at on public.contact_relances;
create trigger contact_relances_updated_at
  before update on public.contact_relances
  for each row execute procedure public.handle_updated_at();
