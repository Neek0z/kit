# KIT — etape_00 : Initialisation du projet Expo

## Contexte

Tu vas m'aider à construire **KIT (Keep in Touch)**, une application mobile native iOS et Android.
KIT est un CRM simple pour networkers : gérer ses contacts, suivre les relances, recevoir des rappels.

Cette étape 00 est la fondation du projet. On ne construit aucune feature ici — on pose une base propre, scalable, prête pour les étapes suivantes.

---

## Stack technique

- **Expo SDK 51+** avec Expo Router (navigation basée sur les fichiers)
- **React Native** + **TypeScript** (strict)
- **NativeWind v4** (classes Tailwind dans React Native)
- **Supabase** (sera branché à l'étape 01 — préparer uniquement le client)
- **Expo Go** pour tester sur téléphone pendant le développement

---

## Ce que tu dois faire

### 1. Créer le projet

```bash
npx create-expo-app@latest kit --template blank-typescript
cd kit
```

### 2. Installer les dépendances

```bash
# Navigation
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar

# NativeWind + Tailwind
npm install nativewind
npm install --save-dev tailwindcss

# Supabase (client uniquement pour l'instant)
npm install @supabase/supabase-js
npx expo install expo-secure-store @react-native-async-storage/async-storage
```

### 3. Configurer Expo Router

Dans `app.json`, modifier l'entrée principale :

```json
{
  "expo": {
    "scheme": "kit",
    "web": {
      "bundler": "metro"
    }
  }
}
```

Dans `package.json`, changer le main :

```json
{
  "main": "expo-router/entry"
}
```

### 4. Configurer NativeWind

Créer `tailwind.config.js` à la racine :

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6ee7b7",
        secondary: "#818cf8",
        danger: "#f87171",
        background: "#0f172a",
        surface: "#1e293b",
        border: "#334155",
        textMain: "#f1f5f9",
        textMuted: "#94a3b8",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
```

Créer `babel.config.js` :

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: ["nativewind/babel"],
  };
};
```

Créer `metro.config.js` :

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

Créer `global.css` à la racine :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Structure de dossiers à créer

```
kit/
├── app/
│   ├── _layout.tsx          # Layout racine (providers globaux)
│   ├── index.tsx            # Écran d'accueil temporaire
│   └── (auth)/
│       └── login.tsx        # Placeholder login (étape 01)
├── components/
│   └── ui/
│       ├── Button.tsx       # Composant bouton de base
│       ├── Card.tsx         # Composant carte de base
│       └── Text.tsx         # Composant texte typé
├── lib/
│   └── supabase.ts          # Client Supabase (initialisé, non connecté)
├── types/
│   └── index.ts             # Types globaux TypeScript
├── hooks/
│   └── .gitkeep
├── global.css
├── tailwind.config.js
├── babel.config.js
└── metro.config.js
```

### 6. Fichiers à créer

**`app/_layout.tsx`** — Layout racine :

```tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

**`app/index.tsx`** — Écran temporaire de test :

```tsx
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-primary text-2xl font-bold">KIT</Text>
        <Text className="text-textMuted text-sm mt-2">Keep in Touch</Text>
      </View>
    </SafeAreaView>
  );
}
```

**`lib/supabase.ts`** — Client Supabase :

```ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ?? "";
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**`types/index.ts`** — Types de base :

```ts
// Sera enrichi à chaque étape

export type UserId = string;

export interface UserProfile {
  id: UserId;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}
```

**`components/ui/Button.tsx`** — Bouton de base :

```tsx
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}: ButtonProps) {
  const base = "rounded-xl px-6 py-4 items-center justify-center";
  const variants = {
    primary: "bg-primary",
    secondary: "bg-surface border border-border",
    ghost: "bg-transparent",
  };
  const textColors = {
    primary: "text-background font-bold",
    secondary: "text-textMain",
    ghost: "text-primary",
  };

  return (
    <TouchableOpacity
      className={`${base} ${variants[variant]} ${disabled || loading ? "opacity-50" : ""}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#0f172a" : "#6ee7b7"} />
      ) : (
        <Text className={textColors[variant]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
```

### 7. Variables d'environnement

Créer `.env.local` à la racine (ne pas commit) :

```
EXPO_PUBLIC_SUPABASE_URL=à_remplir_étape_01
EXPO_PUBLIC_SUPABASE_ANON_KEY=à_remplir_étape_01
```

Ajouter `.env.local` dans `.gitignore`.

---

## Critères de validation

Avant de passer à etape_01, vérifier que :

- [ ] `npx expo start` lance sans erreur
- [ ] L'écran de test s'affiche sur Expo Go (texte "KIT" vert sur fond sombre)
- [ ] NativeWind fonctionne (les classes Tailwind appliquent bien les styles)
- [ ] La structure de dossiers est en place
- [ ] Aucune erreur TypeScript

---

## Ce qu'on ne fait PAS dans cette étape

- Pas de connexion Supabase réelle (étape 01)
- Pas d'écrans fonctionnels (étape 01+)
- Pas de navigation complexe (étape 02)
- Pas de logique métier

---

## Prochaine étape

`etape_01` — Connexion Supabase + authentification (login, inscription, session persistante)
