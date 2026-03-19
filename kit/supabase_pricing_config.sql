-- Pricing config for early adopter launch strategy
create table if not exists public.pricing_config (
  id uuid default gen_random_uuid() primary key,
  early_adopter_price numeric default 4.99 not null,
  normal_price numeric default 7.99 not null,
  early_adopter_limit integer default 100 not null,
  early_adopter_count integer default 0 not null,
  early_adopter_active boolean default true not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert initial config row only if table is empty
insert into public.pricing_config
  (early_adopter_price, normal_price, early_adopter_limit, early_adopter_count, early_adopter_active)
select 4.99, 7.99, 100, 0, true
where not exists (select 1 from public.pricing_config);

alter table public.pricing_config enable row level security;

drop policy if exists "Anyone can read pricing config" on public.pricing_config;
create policy "Anyone can read pricing config"
  on public.pricing_config for select using (true);

alter table public.subscriptions
  add column if not exists is_early_adopter boolean default false,
  add column if not exists early_adopter_price numeric;

create or replace function public.increment_early_adopter_count()
returns void as $$
begin
  update public.pricing_config
  set early_adopter_count = early_adopter_count + 1,
      early_adopter_active = (early_adopter_count + 1 < early_adopter_limit),
      updated_at = timezone('utc'::text, now())
  where id = (
    select id
    from public.pricing_config
    order by updated_at desc
    limit 1
  );
end;
$$ language plpgsql security definer;

