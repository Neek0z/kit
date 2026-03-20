-- Table subscriptions (etape_06)
create table public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free' not null,
  status text default 'active' not null,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create or replace function public.handle_new_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute procedure public.handle_new_subscription();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- Utilisateurs déjà existants : créer une ligne free pour chacun (à exécuter une fois)
insert into public.subscriptions (user_id, plan, status)
select id, 'free', 'active' from auth.users
on conflict (user_id) do nothing;
