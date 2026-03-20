Pour lancer : 
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.160 npm run start


à faire 
- Stripe (ou autre plateforme ?)
- vérifier les photos de profiles (entre app vs bucket vs profiles)


Proposition Cursor améliorations : 
Améliorations proposées pour Keep in Touch (KIT)
FAIT - 1. Relances et rappels — FAIT
Récap matinal : notif locale 9h (nb relances du jour). Filtre « En retard » dans contacts. Récurrence (Aucune / Semaine / 2 sem. / Mois) + bouton Reprogrammer. Migration : kit/supabase_contacts_recurrence.sql.
---
Récap matinal (ancien)
Le switch « Récap matinal » est sauvegardé mais pas utilisé. À faire :

soit une notification programmée locale (ex. 9h) qui liste les relances du jour ;
soit un edge function + cron qui envoie une push si l’utilisateur a activé l’option (et que l’app envoie le push token / préférence au backend).
Rappels en retard
Tu affiches déjà « X relances en retard » sur le dashboard. Ajouter un filtre « En retard » dans la liste des contacts (comme « À relancer ») pour les voir d’un coup.

Répétition des relances
Aujourd’hui une relance = une date. Permettre une récurrence (ex. « tous les 2 mois », « dans 1 semaine si pas de réponse ») pour les contacts à suivre régulièrement.

FAIT - 2. Contacts et pipeline — FAIT (import carnet+CSV, tags éditables+filtre, lien contact↔conversation). Photo contact : optionnel.
Import de contacts
En plus de l’export CSV (Pro), proposer un import CSV (ou sélection du carnet d’adresses) pour peupler l’app sans tout ressaisir.

Tags / segmentation
Le champ tags existe en base. Exposer des tags éditables dans la fiche contact et un filtre par tag dans la liste (comme le filtre par statut).

Lien contact ↔ conversation
Si un contact a un email qui correspond à un utilisateur KIT, afficher un lien vers la conversation depuis la fiche contact (et inversement : depuis la conversation, lien vers le contact).

Photo / avatar contact
Optionnel : champ avatar_url ou photo stockée (Supabase Storage) pour reconnaître les contacts plus vite (à aligner avec la vérification « photos de profils » du README).

FAIT - 3. Activité et historique — FAIT
Activité (filtres + lien fiche), stats dashboard (7j/30j/ce mois).
L’écran Activité liste les interactions. Améliorations possibles :

Filtre par type (appel, email, etc.) et par contact.
Lien cliquable vers la fiche contact depuis chaque ligne.
Statistiques simples
Sur le dashboard ou un onglet dédié : nombre d’interactions sur les 7 / 30 derniers jours, ou « contacts contactés ce mois-ci » pour voir l’usage.

FAIT - 4. Messages in‑app
Notifications push
Vérifier que les push sont bien envoyées à la réception d’un message (Supabase + Expo push), et que le badge / compteur de conversations non lues est cohérent.

Lien message ↔ interaction
Quand on envoie ou reçoit un message avec un utilisateur qui est aussi un contact, proposer d’enregistrer une interaction « message » sur ce contact (depuis la conversation ou depuis la fiche contact).

Recherche de conversation
Si le nombre de conversations grandit : barre de recherche par nom/email pour retrouver une conversation rapidement.

FAIT - 5. Notifications et paramètres
Heure du récap matinal
Remplacer une heure fixe (9h) par un choix utilisateur (heure, voire fuseau) stocké en préférences et utilisé pour la notif ou le cron.

Rappels de relance
Option pour choisir l’heure du rappel (ex. 9h le jour J) au lieu d’une heure fixe par défaut.

Respect du « Ne pas déranger »
Vérifier que les notifications (Expo / native) respectent le mode Ne pas déranger et les réglages « Rappels » / « Récap » de l’app.

6. Monétisation et Stripe (aligné avec ton README)
Finaliser Stripe

Vérifier le flux complet : création de session, webhook, mise à jour subscriptions, retour dans l’app (deep link kit://subscription/success).
Gérer annulation / rétrofacturation (résiliation, limite 25 contacts réappliquée, etc.).
Alternative / complément
Si tu veux une alternative à Stripe : RevenueCat pour gérer abonnements in‑app (iOS/Android) + synchronisation avec ton backend (Pro / limites).

7. Technique et données
Photos de profils
Comme dans le README : clarifier la source de vérité (app, bucket Supabase, table profiles) et unifier affichage / upload / mise à jour pour éviter incohérences.

Offline / robustesse

Cache des contacts et des conversations (ex. Supabase + politique de cache ou persistance locale) pour que la liste reste utilisable sans réseau.
Gestion d’erreur plus claire (toast ou message) sur les écrans liste (contacts, messages, activité) en cas d’échec de chargement.
Export
Inclure les tags et la dernière interaction dans l’export CSV pour un usage CRM plus riche.

8. UX rapides
Pull-to-refresh
Sur les listes (contacts, messages, activité, dashboard) pour rafraîchir sans quitter l’écran.

Feedback après action
Après « Relance programmée », « Interaction ajoutée », « Contact créé », un petit toast ou message temporaire pour confirmer.

Empty states
Garder des textes courts et des CTA clairs (comme aujourd’hui) ; éventuellement un lien direct depuis l’empty state « Aucune activité » vers « Ajouter une interaction » sur un contact.

Accessibilité
Labels pour les boutons (ex. « Ajouter un contact »), contraste suffisant en mode sombre (déjà bien avancé avec le thème).



Améliorations persos : 
- stats
- FAIT - quand passage en client : incrémentation auto d'un workflow d'accompagnement
- possibilité de partager des fichiers/docs dans le chat (et aussi via les workflow d'accompagnement)
- FAIT(à améliorer) - possibilité de faire des groupes (par exemple équipe mlm et aussi pour les messages)
- cloche pour notif
- recherche dans l'app (à différents endroits ?)
- sync calendrier (prompt déjà dans les md)
- voir pour une version pc


.Call avec Célia #2
noter mes questions pour check par Célia
ajouter exemples photos dans prompt
ajouter une zone de texte dans les relances (fiche contact) (fusionner tâches ?)
workflow client actuel (pour le parrain) donc ajouté un workflow "vrai" client pour la todo sur l'app (à créer)
