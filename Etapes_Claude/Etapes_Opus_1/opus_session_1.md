# KIT — Session Opus 1 : Sécurité + Nettoyage

## Contexte
App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
Tu vas corriger les problèmes de sécurité, memory leaks, et nettoyage général.
Ne touche pas à l'UI pour l'instant.

---

## TÂCHE 1 — Sécuriser le webhook send-message-push 🔴

Dans `supabase/functions/send-message-push/index.ts` :
- Ajouter une vérification que la requête vient bien de Supabase
- Utiliser un secret partagé via variable d'environnement `WEBHOOK_SECRET`
- Si le header `authorization` ne correspond pas au secret → retourner 401

```ts
const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
const authHeader = req.headers.get("authorization");
if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
  return new Response("Unauthorized", { status: 401 });
}
```

---

## TÂCHE 2 — Corriger les memory leaks dans les hooks 🟠

Dans chaque hook suivant, ajouter un `mounted` check pour éviter les setState après unmount.

Pattern à appliquer :

```ts
useEffect(() => {
  let mounted = true;

  const run = async () => {
    // ... logique async
    if (!mounted) return;
    setState(result);
  };

  run();

  return () => { mounted = false; };
}, [deps]);
```

Fichiers à corriger :
- `hooks/useActivityStats.ts`
- `hooks/useSubscription.ts`
- `hooks/useContactGroups.ts`
- `hooks/useProfile.ts`
- `components/profile/WorkflowStepsSettingsContent.tsx`
- `app/(app)/profile/notifications.tsx`

Pour les `setTimeout` non annulés :
- `lib/ToastContext.tsx` — stocker le timer dans une ref et le clear au unmount
- `app/(app)/content/index.tsx` — stocker le timer `setCopied` dans une ref et le clear

---

## TÂCHE 3 — Supprimer les console.log de debug 🟠

Supprimer tous les `console.log` (pas les `console.error` — ceux-là on les garde) dans :
- `hooks/useGroupMembers.ts` — lignes 27, 61-62, 87-88, 123-124
- `hooks/useNotifications.ts` — ligne 17
- `lib/workflowService.ts` — ligne 35
- `hooks/useGroups.ts` — lignes 51, 64, 76
- `hooks/useContactGroups.ts` — lignes 30-31, 52-53

---

## TÂCHE 4 — Typer les `any` TypeScript 🟠

Remplacer les `any` par des types appropriés dans :

- `hooks/useGroupMembers.ts` (l.34, 45) — typer avec les types Supabase existants dans `types/index.ts`
- `hooks/useUpcomingAppointments.ts` (l.43) — typer le retour de la requête Supabase
- `hooks/useContactGroups.ts` (l.18) — typer `.map((d: any) => d.groups as Group)`

Pour les `as any` dans les navigations (`router.push`) :
- Créer un type union `AppRoute` dans `types/index.ts` avec toutes les routes valides
- Remplacer les `as any` par ce type

Pour les `as any` sur les noms d'icônes Feather :
- Utiliser le type correct `keyof typeof Feather.glyphMap` ou garder `as any` uniquement là

---

## TÂCHE 5 — Supprimer les fichiers inutilisés 🟢

Supprimer ces fichiers qui ne sont jamais importés :
- `kit/App.tsx`
- `kit/index.ts`
- `kit/components/ui/Badge.tsx` (retirer aussi l'export de `components/ui/index.ts`)

Pour `kit/components/contacts/ContactTasksSection.tsx` — vérifier d'abord
s'il est vraiment inutilisé. Si oui, supprimer. Si non, ne pas toucher.

---

## TÂCHE 6 — Sécuriser le .gitignore 🟢

Dans `kit/.gitignore`, ajouter :
```
.env
.env.local
.env.*.local
```

---

## TÂCHE 7 — Corriger les useEffect avec mauvaises dépendances 🟠

- `app/(app)/groups/[id].tsx` (l.187) — ajouter les dépendances manquantes ou wrapper les fonctions dans `useCallback`
- `app/(app)/content/index.tsx` (l.257) — corriger les deps manquantes `activeCategory` et `categories`
- `hooks/useContactGroups.ts` — ajouter `.catch()` sur les promesses Supabase
- `hooks/useProfile.ts` — ajouter gestion d'erreur sur `fetchProfile`
- `hooks/useSubscription.ts` — ajouter gestion d'erreur sur le fetch initial

---

## TÂCHE 8 — Améliorer la gestion d'erreurs 🟠

Dans les hooks suivants, remplacer les `console.log` d'erreur par une vraie gestion :
- `hooks/useGroups.ts` — retourner `false` en cas d'erreur sur create/update/delete
- `hooks/useGroupMembers.ts` — retourner `false` en cas d'erreur
- `hooks/useSubscription.ts` — propager l'erreur à l'UI via un état `error`
- `app/(app)/content/index.tsx` (l.272) — remplacer `.catch(() => {})` par un catch avec log

---

## Validation finale

Après toutes les modifications :
1. Lance `npx tsc --noEmit` pour vérifier qu'il n'y a pas d'erreurs TypeScript
2. Liste tous les fichiers modifiés avec un résumé des changements
3. Signale si tu as rencontré des cas ambigus ou des décisions à valider
