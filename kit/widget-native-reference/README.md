# Widget écran d'accueil (étape 07)

Le widget affiche les contacts à relancer aujourd'hui. Il est **réservé aux utilisateurs Pro**.

## Prérequis

1. **Exporter le projet** (génère `ios/` et `android/`) :
   ```bash
   npx expo prebuild --clean
   ```
   Après ça, tu ne pourras plus utiliser Expo Go — utilise un **development build** (`npx expo run:android` ou `npx expo run:ios`).

2. L’app met déjà à jour les données du widget :
   - à chaque changement de contacts (useContacts),
   - à chaque passage de l’app au premier plan (_layout.tsx).
   - Les données ne sont écrites que si l’utilisateur a le plan **Pro** (lib/widgetData.ts).

## Android

1. Après `npx expo prebuild`, copier les fichiers du dossier `widget-native-reference/android/` vers `android/app/src/main/` :
   - `KitWidget.kt`, `KitWidgetModule.kt`, `KitWidgetPackage.kt` → `java/com/kit/widget/` (adapter le package si différent, ex. `com.tonprojet.kit`).
   - `layout/kit_widget.xml` → `res/layout/`
   - `drawable/widget_background.xml` → `res/drawable/`
   - `xml/kit_widget_info.xml` → `res/xml/`
2. Dans `res/values/strings.xml`, ajouter :  
   `<string name="widget_description">Contacts à relancer aujourd\'hui</string>`
3. Dans `AndroidManifest.xml` (dans `<application>`), ajouter le `<receiver>` (voir `manifest-snippet.xml`).
4. **Enregistrer le module** : dans `android/app/src/main/java/.../MainApplication.kt`, dans `getPackages()`, ajouter `new com.kit.widget.KitWidgetPackage()` (ou le package que tu as utilisé).
5. Rebuild : `npx expo run:android`. Le widget « KIT » apparaît dans la liste des widgets.

Le module natif `KitWidgetModule` écrit les données dans `SharedPreferences` (nom `KitWidgetData`). Le widget `KitWidget` lit ces préférences et affiche le nombre + les noms.

## iOS (Mac + Xcode)

1. Ouvrir `ios/kit.xcworkspace` dans Xcode.
2. File → New → Target → **Widget Extension** → nom : `KitWidget`.
3. Remplacer le contenu de `KitWidget.swift` par celui du fichier `ios/KitWidget.swift` dans ce dossier.
4. **App Groups** : sur la target principale `kit` et sur la target `KitWidget`, ajouter la capability **App Groups** avec `group.com.kit.app`.
5. Créer un module natif (ou un bridge) qui expose `updateData(json: String)` et écrit dans `UserDefaults(suiteName: "group.com.kit.app")` avec les clés `followUpCount` (Int) et `followUpNames` ([String]).
6. Rebuild : `npx expo run:ios`. Le widget « KIT — Relances » sera disponible en small et medium.

## Fichiers de référence

- `android/` : Kotlin (widget + module), layout, drawable, xml.
- `ios/` : Swift WidgetKit (à coller dans l’extension créée par Xcode).

Les chemins indiqués sont relatifs à la racine du projet (après `expo prebuild`).
