-- Champ notification_id pour les rappels locaux (etape_05)
alter table public.contacts
  add column if not exists notification_id text;
