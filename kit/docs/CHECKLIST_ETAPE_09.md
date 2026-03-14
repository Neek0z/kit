# Checklist etape_09 — Préparation à la publication

## À faire une fois (à la main)

1. **EAS CLI**
   ```bash
   npm install -g eas-cli
   eas login
   ```
   (Compte gratuit sur [expo.dev](https://expo.dev))

2. **Lier le projet à Expo**
   ```bash
   cd kit
   eas init
   ```
   Cela ajoute un `projectId` dans `app.json`.

3. **Build preview Android (test sur appareil)**
   ```bash
   eas build --platform android --profile preview
   ```
   ~10–15 min, lien APK par email.

4. **Politique de confidentialité**  
   Créer une page (Notion, Carrd, etc.) et noter l’URL pour etape_10.

## Checklist qualité (à valider sur l’app / l’APK)

- [ ] Auth : login, inscription, session persistante, déconnexion
- [ ] Contacts : ajout, recherche, filtres, appels/WhatsApp/email, import, suppression
- [ ] Suivi : interactions, relances, dashboard, alertes
- [ ] Notifications : permission, notification à l’heure, tap ouvre le bon contact
- [ ] Abonnements : limite 25 contacts Free, paywall, Stripe Checkout
- [ ] Profil : photo, nom, export CSV

## Critères de validation etape_09

- [ ] `eas build --platform android --profile preview` réussit
- [ ] L’APK s’installe et les fonctionnalités marchent
- [ ] Icône et splash s’affichent correctement
- [ ] Textes stores prêts (voir `docs/STORE_TEXTS.md`)
- [ ] Politique de confidentialité en ligne
