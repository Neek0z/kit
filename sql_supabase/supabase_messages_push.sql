-- Token push pour les notifications de messages (à exécuter après supabase_messages.sql)
-- Ajoute la colonne expo_push_token au profil pour recevoir les push quand quelqu'un t'envoie un message

alter table public.profiles
  add column if not exists expo_push_token text;

comment on column public.profiles.expo_push_token is 'Expo Push Token pour envoyer des notifications (ex: nouveau message).';
