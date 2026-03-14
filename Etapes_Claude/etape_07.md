# KIT — etape_07 : Widget écran d'accueil

## Contexte

Abonnements Stripe fonctionnels (etape_06 validée).
On ajoute le widget écran d'accueil — fonctionnalité Pro exclusive et vitrine de KIT.
Le widget affiche les contacts à relancer aujourd'hui directement sur l'écran d'accueil.

> ⚠️ Cette étape est la plus technique du projet. Elle nécessite d'exporter
> le projet Expo et d'écrire du code natif (Swift pour iOS, Kotlin pour Android).
> Cursor peut générer ce code, mais il faut un Mac pour builder la partie iOS.

---

## Architecture du widget

```
Supabase (données) → AsyncStorage (cache local) → Widget natif
                                                      ↓
                                              Écran d'accueil iOS/Android
```

Le widget ne peut pas appeler Supabase directement — il lit depuis un
stockage partagé entre l'app et le widget (`UserDefaults` sur iOS, `SharedPreferences` sur Android).
L'app met à jour ce stockage à chaque ouverture ou changement de données.

---

## Ce que tu dois faire

### 1. Installer expo-widgets et les dépendances

```bash
npx expo install expo-modules-core
npm install react-native-widget-kit --legacy-peer-deps
```

> **Note :** Si `react-native-widget-kit` n'est pas compatible avec ton SDK,
> utiliser directement le package `@birdwingo/react-native-instagram-widget`
> ou implémenter via du code natif pur (voir étape 3).

---

### 2. Exporter le projet Expo (prérequis)

Le widget nécessite du code natif — il faut exposer les dossiers `ios/` et `android/` :

```bash
npx expo prebuild --clean
```

Cela génère :
- `ios/` — projet Xcode avec le code Swift
- `android/` — projet Android Studio avec le code Kotlin

> ⚠️ Après le prebuild, tu ne peux plus utiliser Expo Go.
> Tu devras utiliser un **development build** à la place.
> Sur Android : `npx expo run:android`
> Sur iOS (Mac requis) : `npx expo run:ios`

---

### 3. Widget Android — Glance (Kotlin)

Créer `android/app/src/main/java/com/kit/widget/KitWidget.kt` :

```kotlin
package com.kit.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import org.json.JSONArray

class KitWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs: SharedPreferences = context.getSharedPreferences(
                "KitWidgetData", Context.MODE_PRIVATE
            )

            val count = prefs.getInt("followUpCount", 0)
            val contactsJson = prefs.getString("followUpContacts", "[]")
            val contacts = JSONArray(contactsJson)

            val views = RemoteViews(context.packageName, R.layout.kit_widget)

            views.setTextViewText(
                R.id.widget_count,
                if (count == 0) "✓ Tout est à jour" else "$count à relancer"
            )

            val line1 = if (contacts.length() > 0) contacts.getJSONObject(0).getString("full_name") else ""
            val line2 = if (contacts.length() > 1) contacts.getJSONObject(1).getString("full_name") else ""
            val line3 = if (contacts.length() > 2) "+ ${contacts.length() - 2} autres" else ""

            views.setTextViewText(R.id.contact_1, line1)
            views.setTextViewText(R.id.contact_2, line2)
            views.setTextViewText(R.id.contact_3, line3)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
```

Créer le layout `android/app/src/main/res/layout/kit_widget.xml` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="@drawable/widget_background"
    android:padding="16dp">

    <TextView
        android:id="@+id/widget_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="KIT"
        android:textColor="#6ee7b7"
        android:textSize="12sp"
        android:textStyle="bold"
        android:letterSpacing="0.1" />

    <TextView
        android:id="@+id/widget_count"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="4dp"
        android:textColor="#f1f5f9"
        android:textSize="18sp"
        android:textStyle="bold" />

    <TextView
        android:id="@+id/contact_1"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="8dp"
        android:textColor="#94a3b8"
        android:textSize="13sp" />

    <TextView
        android:id="@+id/contact_2"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="2dp"
        android:textColor="#94a3b8"
        android:textSize="13sp" />

    <TextView
        android:id="@+id/contact_3"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:layout_marginTop="2dp"
        android:textColor="#475569"
        android:textSize="12sp" />

</LinearLayout>
```

Créer le drawable `android/app/src/main/res/drawable/widget_background.xml` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#1e293b" />
    <corners android:radius="16dp" />
</shape>
```

Créer le widget info `android/app/src/main/res/xml/kit_widget_info.xml` :

```xml
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/kit_widget"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:description="@string/widget_description" />
```

Ajouter dans `android/app/src/main/AndroidManifest.xml`, dans la balise `<application>` :

```xml
<receiver
    android:name=".widget.KitWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/kit_widget_info" />
</receiver>
```

---

### 4. Widget iOS — WidgetKit (Swift)

Sur Mac uniquement — ouvrir `ios/kit.xcworkspace` dans Xcode.

Dans Xcode : File → New → Target → Widget Extension → nom : `KitWidget`

Remplacer le contenu de `ios/KitWidget/KitWidget.swift` :

```swift
import WidgetKit
import SwiftUI

struct FollowUpContact: Identifiable {
    let id = UUID()
    let name: String
}

struct KitEntry: TimelineEntry {
    let date: Date
    let count: Int
    let contacts: [FollowUpContact]
}

struct KitProvider: TimelineProvider {
    func placeholder(in context: Context) -> KitEntry {
        KitEntry(date: Date(), count: 3, contacts: [
            FollowUpContact(name: "Marie Dupont"),
            FollowUpContact(name: "Jean Martin"),
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (KitEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<KitEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadEntry() -> KitEntry {
        let userDefaults = UserDefaults(suiteName: "group.com.kit.app")
        let count = userDefaults?.integer(forKey: "followUpCount") ?? 0
        let names = userDefaults?.array(forKey: "followUpNames") as? [String] ?? []
        let contacts = names.prefix(3).map { FollowUpContact(name: $0) }
        return KitEntry(date: Date(), count: count, contacts: Array(contacts))
    }
}

struct KitWidgetView: View {
    var entry: KitEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("KIT")
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(Color(hex: "#6ee7b7"))
                .tracking(2)

            Text(entry.count == 0 ? "✓ Tout est à jour" : "\(entry.count) à relancer")
                .font(.system(size: 17, weight: .bold))
                .foregroundColor(.white)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 2) {
                ForEach(entry.contacts) { contact in
                    Text(contact.name)
                        .font(.system(size: 13))
                        .foregroundColor(Color(hex: "#94a3b8"))
                }
            }
            .padding(.top, 4)

            Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .containerBackground(Color(hex: "#1e293b"), for: .widget)
    }
}

// Helper extension pour les couleurs hex
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}

@main
struct KitWidget: Widget {
    let kind = "KitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: KitProvider()) { entry in
            KitWidgetView(entry: entry)
        }
        .configurationDisplayName("KIT — Relances")
        .description("Tes contacts à relancer aujourd'hui.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
```

Configurer le App Group dans Xcode :
1. Sélectionne la target principale `kit`
2. Signing & Capabilities → + Capability → App Groups
3. Ajoute `group.com.kit.app`
4. Fais pareil pour la target `KitWidget`

---

### 5. Module natif — partager les données avec le widget

Créer `lib/widgetData.ts` :

```ts
import { Platform } from "react-native";
import { Contact } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clé partagée entre l'app et le widget
const WIDGET_KEY = "kit_widget_follow_up";

export async function updateWidgetData(contacts: Contact[]): Promise<void> {
  const now = new Date();
  const toFollowUp = contacts.filter((c) => {
    if (!c.next_follow_up) return false;
    return new Date(c.next_follow_up) <= now;
  });

  const payload = {
    count: toFollowUp.length,
    contacts: toFollowUp.slice(0, 5).map((c) => ({
      id: c.id,
      full_name: c.full_name,
    })),
    updated_at: now.toISOString(),
  };

  // Stocker dans AsyncStorage (lu par le module natif)
  await AsyncStorage.setItem(WIDGET_KEY, JSON.stringify(payload));

  // Sur iOS : écrire dans UserDefaults via le module natif
  if (Platform.OS === "ios") {
    try {
      const { NativeModules } = require("react-native");
      NativeModules.KitWidget?.updateData(JSON.stringify(payload));
    } catch (e) {
      // Module natif non disponible en dev
    }
  }

  // Sur Android : écrire dans SharedPreferences via le module natif
  if (Platform.OS === "android") {
    try {
      const { NativeModules } = require("react-native");
      NativeModules.KitWidgetModule?.updateData(JSON.stringify(payload));
    } catch (e) {
      // Module natif non disponible en dev
    }
  }
}
```

---

### 6. Déclencher la mise à jour du widget

Dans `hooks/useContacts.ts`, après chaque opération qui modifie les contacts,
appeler `updateWidgetData` :

```ts
import { updateWidgetData } from "../lib/widgetData";

// Dans createContact, updateContact, deleteContact — ajouter à la fin :
updateWidgetData(contacts); // mise à jour silencieuse du widget
```

Dans `app/_layout.tsx`, mettre à jour le widget au démarrage de l'app :

```tsx
import { useEffect } from "react";
import { AppState } from "react-native";
import { updateWidgetData } from "../lib/widgetData";
import { supabase } from "../lib/supabase";

// Dans AppWithNotifications, ajouter :
useEffect(() => {
  const subscription = AppState.addEventListener("change", async (state) => {
    if (state === "active") {
      // App revenue au premier plan → mettre à jour le widget
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("contacts")
          .select("*")
          .eq("user_id", session.user.id);
        if (data) updateWidgetData(data);
      }
    }
  });
  return () => subscription.remove();
}, []);
```

---

### 7. Réserver le widget aux utilisateurs Pro

Dans `lib/widgetData.ts`, vérifier l'abonnement avant de mettre à jour :

```ts
import { supabase } from "./supabase";

export async function updateWidgetData(contacts: Contact[]): Promise<void> {
  // Vérifier le plan Pro
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", session.user.id)
    .single();

  if (sub?.plan !== "pro") return; // Widget Pro uniquement

  // ... reste du code
}
```

---

## Critères de validation

Avant de passer à etape_08, vérifier que :

- [ ] `npx expo prebuild --clean` génère bien les dossiers `ios/` et `android/`
- [ ] Sur Android : le widget apparaît dans la liste des widgets après `npx expo run:android`
- [ ] Le widget affiche le bon nombre de contacts à relancer
- [ ] Quand on ajoute un contact avec une relance, le widget se met à jour
- [ ] Le widget n'apparaît pas / est désactivé pour les utilisateurs Free
- [ ] Sur iOS (Mac requis) : le widget s'affiche en small et medium

---

## Ce qu'on ne fait PAS dans cette étape

- Pas d'interaction tap sur le widget pour iOS (limite WidgetKit)
- Pas de widget configurable par l'utilisateur (peut être ajouté plus tard)
- Pas de widget Android interactif (Glance — peut être ajouté plus tard)

---

## Note importante sur le développement

Après `expo prebuild`, le workflow change :
- **Plus d'Expo Go** — il faut builder l'app
- Android : `npx expo run:android` (nécessite Android Studio)
- iOS : `npx expo run:ios` (nécessite Mac + Xcode)
- Les mises à jour JS restent rapides grâce au Fast Refresh
- Seuls les changements natifs nécessitent un rebuild complet

---

## Prochaine étape

`etape_08` — Profil utilisateur + paramètres complets
