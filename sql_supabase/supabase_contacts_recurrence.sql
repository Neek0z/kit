-- Récurrence des relances : option sur le contact
-- À exécuter dans Supabase Dashboard → SQL Editor (après supabase_contacts.sql)

alter table public.contacts
  add column if not exists follow_up_recurrence text default 'none';

comment on column public.contacts.follow_up_recurrence is 'none | weekly | biweekly | monthly';
