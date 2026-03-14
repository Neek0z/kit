-- Politiques Storage pour le bucket avatars (etape_08)
-- 1. Créer le bucket "avatars" (Public) dans Supabase → Storage → New bucket
-- 2. Exécuter ce script dans SQL Editor

-- Supprimer les anciennes politiques si tu les avais créées (noms identiques)
drop policy if exists "Users can upload own avatar" on storage.objects;
drop policy if exists "Users can update own avatar" on storage.objects;
drop policy if exists "Avatars are publicly accessible" on storage.objects;
drop policy if exists "Users can delete own avatar" on storage.objects;

-- Insert : les utilisateurs authentifiés peuvent upload dans leur dossier (auth.uid = premier segment du path)
create policy "Users can upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- Update : pour permettre l’upsert (écraser l’avatar existant)
create policy "Users can update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

-- Select : lecture publique des avatars (bucket public)
create policy "Avatars are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

-- Delete : supprimer son propre avatar (pour pouvoir le remplacer)
create policy "Users can delete own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);
