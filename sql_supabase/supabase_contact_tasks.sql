-- Table contact_tasks (etape_contact_tasks)
create table public.contact_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  contact_id uuid references public.contacts on delete cascade not null,
  title text not null,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  priority text default 'normal' check (priority in ('low', 'normal', 'high')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index contact_tasks_contact_id_idx on public.contact_tasks(contact_id);
create index contact_tasks_user_id_idx on public.contact_tasks(user_id);
create index contact_tasks_due_date_idx on public.contact_tasks(user_id, due_date);

alter table public.contact_tasks enable row level security;

create policy "Users can manage own contact tasks"
  on public.contact_tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger contact_tasks_updated_at
  before update on public.contact_tasks
  for each row execute procedure public.handle_updated_at();

