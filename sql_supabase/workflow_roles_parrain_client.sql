-- KIT — Distinction workflow parrain / checklist arrivée client
-- Exécuter dans Supabase SQL Editor après les tables workflow_steps / workflow_tasks.

-- 1) Colonnes rôle (défaut parrain pour les lignes existantes)
alter table public.workflow_steps
  add column if not exists workflow_role text not null default 'parrain';

alter table public.workflow_steps
  drop constraint if exists workflow_steps_workflow_role_check;

alter table public.workflow_steps
  add constraint workflow_steps_workflow_role_check
  check (workflow_role in ('parrain', 'client_arrival'));

update public.workflow_steps
set workflow_role = 'parrain'
where workflow_role is null or workflow_role = '';

alter table public.workflow_tasks
  add column if not exists workflow_role text not null default 'parrain';

alter table public.workflow_tasks
  drop constraint if exists workflow_tasks_workflow_role_check;

alter table public.workflow_tasks
  add constraint workflow_tasks_workflow_role_check
  check (workflow_role in ('parrain', 'client_arrival'));

update public.workflow_tasks
set workflow_role = 'parrain'
where workflow_role is null or workflow_role = '';

create index if not exists workflow_steps_user_role_idx
  on public.workflow_steps (user_id, workflow_role);

create index if not exists workflow_tasks_contact_role_idx
  on public.workflow_tasks (contact_id, workflow_role);

-- 2) Étapes par défaut « arrivée client » pour les utilisateurs qui ont déjà un workflow parrain
insert into public.workflow_steps (
  user_id, name, description, delay_days, interaction_type, sort_order, workflow_role, is_active
)
select
  u.user_id,
  s.name,
  s.description,
  s.delay_days,
  s.interaction_type,
  s.sort_order,
  'client_arrival',
  true
from (select distinct user_id from public.workflow_steps where workflow_role = 'parrain') u
cross join (
  values
    ('Envoi des pièces demandées', 'Le client transmet les documents nécessaires à son dossier', 0, 'note', 0),
    ('Signature / validation administrative', 'Finaliser les formalités côté client', 3, 'note', 1),
    ('Rendez-vous d''accueil', 'Prévoir ou confirmer le premier rendez-vous d''arrivée', 7, 'meeting', 2),
    ('Installation pratique', 'Accompagner la mise en place (accès, matériel, premiers pas)', 14, 'call', 3)
) as s(name, description, delay_days, interaction_type, sort_order)
where not exists (
  select 1
  from public.workflow_steps w
  where w.user_id = u.user_id
    and w.workflow_role = 'client_arrival'
);

-- 3) (Optionnel) Nouveaux comptes : étendre la fonction de seed si tu l’utilises déjà.
-- Remplace le corps de create_default_workflow pour inclure les deux jeux d’étapes, ou appelle :
create or replace function public.create_default_client_arrival_workflow(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.workflow_steps
    where user_id = p_user_id and workflow_role = 'client_arrival'
  ) then
    return;
  end if;

  insert into public.workflow_steps (
    user_id, name, description, delay_days, interaction_type, sort_order, workflow_role
  )
  values
    (p_user_id, 'Envoi des pièces demandées', 'Le client transmet les documents nécessaires à son dossier', 0, 'note', 0, 'client_arrival'),
    (p_user_id, 'Signature / validation administrative', 'Finaliser les formalités côté client', 3, 'note', 1, 'client_arrival'),
    (p_user_id, 'Rendez-vous d''accueil', 'Prévoir ou confirmer le premier rendez-vous d''arrivée', 7, 'meeting', 2, 'client_arrival'),
    (p_user_id, 'Installation pratique', 'Accompagner la mise en place (accès, matériel, premiers pas)', 14, 'call', 3, 'client_arrival');
end;
$$;

-- Si tu as déjà create_default_workflow sur on_auth_user_created, ajoute à la fin du corps :
--   perform public.create_default_client_arrival_workflow(new.id);
