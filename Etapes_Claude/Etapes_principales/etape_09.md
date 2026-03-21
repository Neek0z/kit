# KIT — etape_09 : Préparation à la publication

## Contexte

Toutes les fonctionnalités sont en place (etape_08 validée).
Cette étape prépare l'app pour la publication : assets visuels, tests sur vrai appareil
via EAS Build, et vérifications finales avant soumission aux stores.

---

## Ce que tu dois faire

### 1. Installer EAS CLI

```bash
npm install -g eas-cli
eas login
```

> Tu as besoin d'un compte sur [expo.dev](https://expo.dev) — gratuit.

---

### 2. Initialiser EAS dans le projet

```bash
eas init
```

Cela crée un `projectId` dans `app.json` et lie ton projet à Expo.

---

### 3. Créer eas.json

Créer `eas.json` à la racine :

```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### 4. Assets visuels à créer

Créer ou remplacer ces fichiers dans `assets/` :

**`assets/icon.png`** — Icône app
- Taille : 1024x1024px
- Fond : `#0f172a` (bleu nuit)
- Contenu : lettre "K" en `#6ee7b7` (vert menthe), police bold
- Coins : pas arrondis (iOS/Android les arrondissent automatiquement)

**`assets/splash.png`** — Écran de démarrage
- Taille : 1284x2778px (iPhone 15 Pro Max)
- Fond : `#0f172a`
- Contenu centré : logo KIT + tagline "Keep in Touch"

**`assets/adaptive-icon.png`** — Icône Android adaptative
- Taille : 1024x1024px
- Même contenu que icon.png mais avec marges (le fond sera `#0f172a`)

**`assets/notification-icon.png`** — Icône notification
- Taille : 96x96px
- Blanc sur fond transparent

> **Astuce :** Utilise [Figma](https://figma.com) ou [Canva](https://canva.com) pour créer ces assets rapidement.
> Il existe aussi des templates Expo sur Figma Community.

Mettre à jour `app.json` avec les assets :

```json
{
  "expo": {
    "name": "KIT — Keep in Touch",
    "slug": "kit",
    "version": "1.0.0",
    "scheme": "kit",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.tonnom.kit",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      },
      "package": "com.tonnom.kit",
      "versionCode": 1
    }
  }
}
```

---

### 5. Checklist de qualité avant build

Vérifier dans l'app (avec Expo Go ou development build) :

**Auth**
- [ ] Login fonctionne
- [ ] Inscription crée bien un profil dans Supabase
- [ ] La session persiste après fermeture de l'app
- [ ] La déconnexion redirige vers le login

**Contacts**
- [ ] Ajout d'un contact fonctionne
- [ ] La recherche filtre correctement
- [ ] Les filtres par statut fonctionnent
- [ ] Appeler / WhatsApp / Email ouvrent les bonnes apps
- [ ] L'import depuis les contacts du téléphone fonctionne
- [ ] La suppression demande confirmation

**Suivi**
- [ ] Ajouter une interaction se sauvegarde et apparaît dans l'historique
- [ ] Planifier une relance met à jour `next_follow_up`
- [ ] Le Dashboard affiche les bonnes stats
- [ ] L'alerte rouge apparaît pour les relances en retard

**Notifications**
- [ ] L'app demande la permission au premier lancement
- [ ] Une notification arrive à l'heure planifiée
- [ ] Taper sur la notification ouvre le bon contact

**Abonnements**
- [ ] Le plan Free est bien limité à 25 contacts
- [ ] Le paywall s'affiche quand la limite est atteinte
- [ ] Le lien Stripe Checkout s'ouvre dans le navigateur

**Profil**
- [ ] La photo de profil peut être changée
- [ ] Le nom peut être modifié
- [ ] L'export CSV fonctionne

---

### 6. Build de preview Android (test sur vrai appareil)

```bash
eas build --platform android --profile preview
```

EAS va :
1. Compiler l'app dans le cloud (~10-15 min)
2. Générer un fichier `.apk`
3. T'envoyer un lien QR code par email

Installe l'APK sur ton Android via le lien — c'est une vraie app native, sans Expo Go.

---

### 7. Corriger les derniers bugs

Après avoir testé l'APK preview sur ton téléphone :
- Note tous les bugs visuels ou fonctionnels
- Corrige-les dans Cursor
- Relance un build preview pour valider

---

### 8. Screenshots pour les stores

Une fois l'APK stable, prendre des screenshots dans l'app pour les stores.

**Android Play Store — obligatoire :**
- 2 screenshots minimum, 8 maximum
- Format : 16:9 ou 9:16
- Taille min : 320px, max : 3840px

**Apple App Store — obligatoire :**
- 3 screenshots minimum par taille d'écran
- iPhone 6.7" (1290x2796px) — obligatoire
- iPhone 6.5" (1242x2688px) — recommandé

> **Astuce :** Utilise [Previewed.app](https://previewed.app) ou [AppMockUp](https://app-mockup.com)
> pour créer de beaux screenshots avec des cadres téléphone.

---

### 9. Textes stores à préparer

**Nom de l'app :** KIT — Keep in Touch

**Sous-titre (iOS) :** CRM simple pour networkers

**Description courte (Play Store, 80 chars max) :**
```
Gère tes contacts et ne rate plus jamais une relance.
```

**Description longue :**
```
KIT est le CRM mobile pensé pour les networkers et entrepreneurs.

✓ Gère tes contacts en un endroit
✓ Suis ton pipeline de relances
✓ Reçois des rappels au bon moment
✓ Historique de toutes tes interactions
✓ Import depuis tes contacts téléphone
✓ Widget écran d'accueil (Pro)

Simple, rapide, efficace. Fini les contacts oubliés.
```

**Mots-clés (iOS, séparés par virgules) :**
```
CRM,networker,contacts,relance,suivi,MLM,réseau,prospection,pipeline
```

---

### 10. Politique de confidentialité

Apple et Google exigent une URL de politique de confidentialité.

Crée une page simple sur [Notion](https://notion.so) ou [Carrd](https://carrd.co) avec :
- Quelles données tu collectes (email, contacts)
- Comment tu les utilises (fonctionnement de l'app)
- Que tu utilises Supabase pour le stockage
- Comment contacter pour suppression de données

Publie-la en public et note l'URL — tu en auras besoin à etape_10.

---

## Critères de validation

Avant de passer à etape_10 :

- [ ] `eas build --platform android --profile preview` réussit
- [ ] L'APK s'installe sur le téléphone sans erreur
- [ ] Toutes les fonctionnalités de la checklist fonctionnent sur l'APK natif
- [ ] Les assets visuels (icône, splash) s'affichent correctement
- [ ] Les textes stores sont rédigés
- [ ] La politique de confidentialité est en ligne

---

## Prochaine étape

`etape_10` — Publication sur App Store et Play Store
