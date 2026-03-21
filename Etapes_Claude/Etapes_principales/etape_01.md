# KIT — etape_01 : Connexion Supabase + Authentification

## Contexte

La base du projet est en place (etape_00 validée).
On va maintenant connecter Supabase et construire le système d'authentification complet :
inscription, connexion, session persistante, et protection des routes.

---

## Prérequis

- etape_00 validée (projet Expo qui tourne sur Expo Go)
- Un projet Supabase créé sur [supabase.com](https://supabase.com)
- Les clés Supabase disponibles (URL + anon key)

---

## Ce que tu dois faire

### 1. Remplir les variables d'environnement

Dans `.env.local`, remplacer les placeholders :

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

Mettre à jour `lib/supabase.ts` pour lire depuis les variables d'environnement Expo :

```ts
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

### 2. Table Supabase à créer

Dans le dashboard Supabase → SQL Editor, exécuter :

```sql
-- Table profils utilisateurs
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS activé
alter table public.profiles enable row level security;

-- Politique : un utilisateur ne voit que son propre profil
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger : crée automatiquement un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

> **Important :** Dans Supabase Dashboard → Authentication → Settings, désactiver "Email confirmation" pendant le développement.

---

### 3. Hook useAuth

Créer `hooks/useAuth.ts` :

```ts
import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session existante au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    loading,
  };
}
```

---

### 4. Context Auth global

Créer `lib/AuthContext.tsx` :

```tsx
import { createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useAuth } from "../hooks/useAuth";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, user, loading } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used inside AuthProvider");
  return context;
}
```

Mettre à jour `app/_layout.tsx` pour inclure le provider :

```tsx
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/AuthContext";
import "../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

---

### 5. Structure de navigation auth

Créer la structure suivante :

```
app/
├── _layout.tsx                  # Layout racine (déjà existant — à mettre à jour)
├── index.tsx                    # Redirect intelligent (auth check)
├── (auth)/
│   ├── _layout.tsx              # Layout groupe auth (fond sombre, pas de tab bar)
│   ├── login.tsx                # Écran de connexion
│   └── register.tsx             # Écran d'inscription
└── (app)/
    ├── _layout.tsx              # Layout groupe app (avec tab bar — étape 02)
    └── index.tsx                # Dashboard placeholder
```

**`app/index.tsx`** — Redirect intelligent :

```tsx
import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthContext } from "../lib/AuthContext";

export default function Index() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#6ee7b7" />
      </View>
    );
  }

  return session ? (
    <Redirect href="/(app)" />
  ) : (
    <Redirect href="/(auth)/login" />
  );
}
```

**`app/(auth)/_layout.tsx`** :

```tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
  );
}
```

**`app/(app)/_layout.tsx`** — Placeholder (sera remplacé à etape_02) :

```tsx
import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
```

**`app/(app)/index.tsx`** — Dashboard placeholder :

```tsx
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthContext } from "../../lib/AuthContext";
import { Button } from "../../components/ui/Button";

export default function Dashboard() {
  const { user, signOut } = useAuthContext();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6 gap-4">
        <Text className="text-primary text-2xl font-bold">KIT</Text>
        <Text className="text-textMuted text-sm">
          Connecté : {user?.email}
        </Text>
        <Button label="Se déconnecter" onPress={signOut} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}
```

---

### 6. Écran de connexion

**`app/(auth)/login.tsx`** :

```tsx
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Remplis tous les champs.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Email ou mot de passe incorrect.");
    }
    // Le redirect est géré automatiquement par le AuthContext + app/index.tsx
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">

          {/* Header */}
          <View className="mb-10">
            <Text className="text-primary text-4xl font-bold mb-2">KIT</Text>
            <Text className="text-textMuted text-base">Connecte-toi à ton compte</Text>
          </View>

          {/* Formulaire */}
          <View className="gap-4">
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-textMain text-base"
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-textMain text-base"
              placeholder="Mot de passe"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            {error && (
              <Text className="text-danger text-sm">{error}</Text>
            )}

            <Button label="Se connecter" onPress={handleLogin} loading={loading} />
          </View>

          {/* Lien inscription */}
          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.push("/(auth)/register")}
          >
            <Text className="text-textMuted text-sm">
              Pas de compte ?{" "}
              <Text className="text-primary font-semibold">S'inscrire</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

---

### 7. Écran d'inscription

**`app/(auth)/register.tsx`** :

```tsx
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setError("Remplis tous les champs.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">

          {/* Header */}
          <View className="mb-10">
            <Text className="text-primary text-4xl font-bold mb-2">KIT</Text>
            <Text className="text-textMuted text-base">Crée ton compte</Text>
          </View>

          {/* Formulaire */}
          <View className="gap-4">
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-textMain text-base"
              placeholder="Nom complet"
              placeholderTextColor="#94a3b8"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
            />
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-textMain text-base"
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-4 text-textMain text-base"
              placeholder="Mot de passe (6 caractères min.)"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            {error && (
              <Text className="text-danger text-sm">{error}</Text>
            )}

            <Button label="Créer mon compte" onPress={handleRegister} loading={loading} />
          </View>

          {/* Lien connexion */}
          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-textMuted text-sm">
              Déjà un compte ?{" "}
              <Text className="text-primary font-semibold">Se connecter</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

---

## Critères de validation

Avant de passer à etape_02, vérifier que :

- [ ] Le client Supabase se connecte sans erreur dans la console
- [ ] L'inscription crée bien un utilisateur dans Supabase Dashboard → Auth → Users
- [ ] La table `profiles` reçoit bien une ligne automatiquement après inscription
- [ ] La connexion fonctionne et redirige vers le Dashboard
- [ ] Le Dashboard affiche l'email de l'utilisateur connecté
- [ ] La déconnexion redirige vers le Login
- [ ] La session persiste après fermeture et réouverture de l'app (AsyncStorage)

---

## Ce qu'on ne fait PAS dans cette étape

- Pas de tab bar ni navigation complexe (etape_02)
- Pas de reset de mot de passe (peut être ajouté plus tard)
- Pas de connexion Google/Apple (peut être ajouté plus tard)
- Pas de logique contacts (etape_03)

---

## Prochaine étape

`etape_02` — Design system complet + navigation principale avec tab bar
