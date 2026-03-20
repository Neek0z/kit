-- Table rendez-vous (RDV) liés aux contacts
create table public.appointments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  scheduled_at timestamp with time zone not null,
  title text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index appointments_user_id_idx on public.appointments(user_id);
create index appointments_contact_id_idx on public.appointments(contact_id);
create index appointments_scheduled_at_idx on public.appointments(user_id, scheduled_at);

alter table public.appointments enable row level security;

create policy "Users can manage own appointments"
  on public.appointments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists appointments_updated_at on public.appointments;
create trigger appointments_updated_at
  before update on public.appointments
  for each row execute procedure public.handle_updated_at();
