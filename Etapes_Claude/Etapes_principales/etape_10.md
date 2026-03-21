# KIT — etape_10 : Publication App Store & Play Store

## Contexte

App testée et validée sur build preview (etape_09 validée).
On publie maintenant KIT sur les deux stores.

---

## Prérequis

- [ ] Compte Apple Developer actif (99$/an) — [developer.apple.com](https://developer.apple.com)
- [ ] Compte Google Play Developer actif (25$ unique) — [play.google.com/console](https://play.google.com/console)
- [ ] App Store Connect configuré
- [ ] Google Play Console configuré
- [ ] Assets visuels prêts (etape_09)
- [ ] Politique de confidentialité en ligne (etape_09)

---

## PARTIE 1 — Google Play Store (Android)

### 1. Build de production Android

```bash
eas build --platform android --profile production
```

Cela génère un **AAB (Android App Bundle)** — le format requis par Google Play.
Le build prend ~15 min dans le cloud EAS.

---

### 2. Créer l'app dans Google Play Console

1. Va sur [play.google.com/console](https://play.google.com/console)
2. **Créer une application**
3. Langue par défaut : Français
4. Type : Application
5. Gratuite ou payante : Gratuite (avec achats in-app)
6. Accepter les conditions

---

### 3. Remplir la fiche store Android

Dans **Présence sur le Play Store → Fiche principale** :

- Nom de l'application : `KIT — Keep in Touch`
- Description courte : `Gère tes contacts et ne rate plus jamais une relance.`
- Description complète : (texte préparé à etape_09)
- Icône : upload `assets/icon.png` (512x512px)
- Image de présentation (feature graphic) : 1024x500px — créer dans Canva
- Screenshots : 2 minimum (depuis l'APK preview)

Dans **Politique de confidentialité** : coller ton URL

---

### 4. Configuration de l'app Android

Dans **Configuration de l'app** :

- Catégorie : Productivité
- Coordonnées : ton email
- Public cible : adultes

Dans **Contenu de l'app** → remplir le questionnaire sur le contenu
(pas de contenu sensible pour KIT — tout est "Non")

---

### 5. Soumettre le build Android

Dans **Production → Versions** :
1. Créer une nouvelle version
2. Uploader l'AAB généré par EAS
3. Ajouter les notes de version : `Première version de KIT.`
4. Enregistrer et publier

> **Délai de review Google :** quelques heures à 3 jours pour une première soumission.

---

### 6. Alternative — EAS Submit (automatisé)

```bash
eas submit --platform android --latest
```

EAS Submit peut soumettre directement à Google Play si tu configures les credentials :

```json
// eas.json — dans submit.production
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## PARTIE 2 — Apple App Store (iOS)

### 1. Build de production iOS

```bash
eas build --platform ios --profile production
```

EAS gère automatiquement les certificats et provisioning profiles Apple.
Le build génère un fichier `.ipa`.

---

### 2. Créer l'app dans App Store Connect

1. Va sur [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Mes apps → +** → Nouvelle app
3. Plateforme : iOS
4. Nom : `KIT — Keep in Touch`
5. Langue principale : Français
6. Bundle ID : `com.tonnom.kit`
7. SKU : `kit-app-v1`

---

### 3. Remplir la fiche store iOS

Dans **Informations sur l'app** :
- Sous-titre : `CRM simple pour networkers`
- Catégorie principale : Productivité
- Politique de confidentialité : ton URL

Dans **Version 1.0.0** :
- Screenshots iPhone 6.7" : 3 minimum
- Description : (texte préparé à etape_09)
- Mots-clés : (mots-clés préparés à etape_09)
- URL d'assistance : ton site ou email
- Notes de version : `Première version de KIT.`

---

### 4. Configurer les achats in-app (si applicable)

Si tu utilises Stripe web uniquement (recommandé), **tu n'as pas besoin**
de configurer les achats in-app Apple. Stripe via lien web externe est autorisé.

Si tu veux quand même les achats in-app Apple (30% de commission) :
1. App Store Connect → Achats intégrés
2. Créer un abonnement auto-renouvelable
3. Configurer le prix (9,99€/mois)
4. Ajouter les textes de description

---

### 5. Soumettre pour review iOS

1. Dans **App Store Connect → Version 1.0.0**
2. Sélectionne le build uploadé par EAS
3. Réponds aux questions de conformité (chiffrement : Oui, standard iOS)
4. Clique **Soumettre pour review**

> **Délai de review Apple :** 24 à 48h en général, parfois jusqu'à 7 jours.
> Apple peut rejeter et demander des corrections — c'est normal, resoumets avec les corrections.

---

### 6. Alternative — EAS Submit pour iOS

```bash
eas submit --platform ios --latest
```

---

## PARTIE 3 — Mises à jour après publication

### OTA Updates (sans repasser par les stores)

Pour des corrections mineures (bug fixes, textes, couleurs) :

```bash
eas update --branch production --message "Fix: correction du bug de relance"
```

Les utilisateurs reçoivent la mise à jour au prochain lancement de l'app,
**sans avoir à mettre à jour depuis le store**.

> **Limitation :** Les OTA updates ne fonctionnent pas pour les changements de code natif
> (nouvelles permissions, nouveaux plugins Expo, modification du widget).
> Pour ces changements, il faut repasser par un build EAS complet.

---

### Nouveau build pour mise à jour majeure

1. Incrémente la version dans `app.json` :
   - `"version": "1.1.0"`
   - `"versionCode": 2` (Android)
   - `"buildNumber": "2"` (iOS)

2. Lance le build :
```bash
eas build --platform all --profile production
```

3. Soumets :
```bash
eas submit --platform all --latest
```

---

## Checklist finale de publication

**Android**
- [ ] Build AAB généré avec succès
- [ ] Fiche Play Store complète (icône, screenshots, description)
- [ ] Questionnaire contenu rempli
- [ ] Politique de confidentialité ajoutée
- [ ] Version soumise en production

**iOS**
- [ ] Build IPA généré avec succès
- [ ] Fiche App Store complète (screenshots 6.7", description, mots-clés)
- [ ] Informations de conformité remplies
- [ ] Politique de confidentialité ajoutée
- [ ] Version soumise pour review

**Post-publication**
- [ ] Tester le téléchargement depuis le store sur un appareil propre
- [ ] Vérifier que les notifications push fonctionnent en production
- [ ] Vérifier que Stripe Checkout fonctionne en production
- [ ] Configurer les OTA updates pour les prochaines corrections

---

## Félicitations 🎉

Si tu arrives ici, KIT est publié sur les deux stores.

**Récapitulatif de ce que tu as construit :**
- App native iOS + Android avec Expo React Native
- Auth Supabase avec session persistante
- CRM complet : contacts, pipeline, historique
- Notifications push natives avec rappels planifiés
- Abonnements Stripe (Free / Pro)
- Widget écran d'accueil
- Profil utilisateur avec photo
- Publication sur App Store et Play Store

**Prochaines étapes suggérées :**
- Analytics (Expo Analytics ou PostHog)
- Onboarding pour les nouveaux utilisateurs
- Mode sombre / clair
- Partage de contacts entre utilisateurs
- Intégration WhatsApp Business API
