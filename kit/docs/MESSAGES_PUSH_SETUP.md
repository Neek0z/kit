# Notifications push pour les nouveaux messages

## Étape 1 — Politique « lu » (messages)

Si tu as exécuté `supabase_messages.sql` **avant** qu’on y ajoute la politique « mark as read », exécute uniquement ceci dans **SQL Editor** :

**Fichier à copier-coller :** `supabase_messages_policy_read.sql`

Ou exécute tout le fichier `supabase_messages.sql` à nouveau (les `drop policy if exists` évitent les doublons).

---

## Étape 2 — Colonne push token (profiles)

Dans **Supabase → SQL Editor**, exécute le contenu de :

**Fichier :** `supabase_messages_push.sql`

(Ça ajoute la colonne `expo_push_token` à la table `profiles`.)

---

## Étape 3 — Déployer l’Edge Function `send-message-push`

### 3.1 Installer le CLI Supabase (si besoin)

```bash
npm install -g supabase
```

Ou avec scoop (Windows) : `scoop install supabase`.

### 3.2 Se connecter (et lier le projet si besoin)

```bash
cd c:\Users\nicol\Desktop\App\Cursor\keep_in_touch_expo\kit
supabase login
```

**Où trouver ton Project Ref ?**  
Supabase Dashboard → **Settings** → **General** → **Reference ID** (ex. `abcdefghijklmnop`).

- Si ton projet est déjà lié (`supabase link` déjà fait dans ce dossier), passe à 3.3.
- Sinon, soit tu lies une fois :  
  `supabase link --project-ref TON_PROJECT_REF`  
  soit tu déploies en passant le ref à la commande (voir 3.3).

### 3.3 Déployer la fonction

Projet déjà lié :

```bash
supabase functions deploy send-message-push
```

Sans lien (remplace `TON_PROJECT_REF` par ton Reference ID) :

```bash
supabase functions deploy send-message-push --project-ref TON_PROJECT_REF
```

La première fois, Supabase peut te demander de confirmer. À la fin, tu verras l’URL de la fonction, du type :

`https://TON_PROJECT_REF.supabase.co/functions/v1/send-message-push`

Note cette URL pour l’étape 4.

---

## Étape 4 — Créer le webhook (Database Webhook)

Dans **Supabase Dashboard** :

1. Menu **Database** → onglet **Webhooks** (ou **Database** → **Webhooks** selon l’interface).
2. Cliquer **Create a new hook** (ou **Add webhook**).
3. Renseigner :
   - **Name** : `on_new_message_push` (ou un nom de ton choix).
   - **Table** : `messages`.
   - **Events** : cocher **Insert** uniquement.
   - **Type** : **HTTP Request**.
   - **URL** :  
     `https://TON_PROJECT_REF.supabase.co/functions/v1/send-message-push`  
     (remplace `TON_PROJECT_REF` par ton Reference ID).
   - **HTTP Headers** : laisser vide sauf si tu as protégé ta fonction par une clé (dans ce cas ajoute par ex. `Authorization: Bearer TA_CLE`).
4. Enregistrer.

Dès qu’une ligne est insérée dans `messages`, Supabase envoie un POST à cette URL avec le payload (ex. `type`, `table`, `record`). La fonction envoie alors la push au destinataire s’il a un `expo_push_token` dans `profiles`.

---

## Étape 5 — Côté app (rappel)

- Le token Expo est enregistré dans le profil à l’ouverture de l’app (`PushTokenSync`).
- Les push **ne marchent pas dans Expo Go** : il faut un **build EAS** (`eas build`) et avoir fait `eas init` (projectId dans `app.json`).
- Au tap sur la notification, l’app ouvre la conversation (géré dans `useNotifications`).

---

## Dépannage

- **La fonction ne reçoit rien** : vérifier que le webhook est bien sur la table `messages`, événement **Insert**, et que l’URL est exacte (pas d’espace, bon Reference ID).
- **Push non reçues** : vérifier que le destinataire a bien un `expo_push_token` dans `profiles` (après avoir ouvert l’app en build EAS au moins une fois). Vérifier aussi les logs de la fonction dans Supabase → Edge Functions → send-message-push → Logs.
