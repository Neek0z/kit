# KIT — etape_02 : Design system & Navigation principale

## Contexte

Auth fonctionnel (etape_01 validée).
On va maintenant construire le design system complet et la navigation principale avec tab bar.
À la fin de cette étape, l'app a sa structure visuelle définitive — toutes les étapes suivantes s'appuieront dessus.

---

## Ce que tu dois faire

### 1. Composants UI de base

Compléter le dossier `components/ui/` avec tous les composants réutilisables.

---

**`components/ui/Text.tsx`** — Texte typé :

```tsx
import { Text as RNText, TextProps } from "react-native";

interface KitTextProps extends TextProps {
  variant?: "h1" | "h2" | "h3" | "body" | "small" | "muted";
}

const variants = {
  h1: "text-2xl font-bold text-textMain tracking-tight",
  h2: "text-xl font-bold text-textMain tracking-tight",
  h3: "text-lg font-semibold text-textMain",
  body: "text-base text-textMain leading-relaxed",
  small: "text-sm text-textMain",
  muted: "text-sm text-textMuted",
};

export function Text({ variant = "body", className = "", ...props }: KitTextProps) {
  return (
    <RNText
      className={`${variants[variant]} ${className}`}
      {...props}
    />
  );
}
```

---

**`components/ui/Card.tsx`** — Carte de base :

```tsx
import { View, ViewProps } from "react-native";

interface CardProps extends ViewProps {
  padding?: "sm" | "md" | "lg";
}

const paddings = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export function Card({ padding = "md", className = "", children, ...props }: CardProps) {
  return (
    <View
      className={`bg-surface border border-border rounded-2xl ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
```

---

**`components/ui/Input.tsx`** — Champ de saisie :

```tsx
import { TextInput, TextInputProps, View, Text } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-textMuted text-sm font-medium">{label}</Text>
      )}
      <TextInput
        className={`bg-surface border rounded-xl px-4 py-4 text-textMain text-base
          ${error ? "border-danger" : "border-border"}
          ${className}`}
        placeholderTextColor="#94a3b8"
        {...props}
      />
      {error && (
        <Text className="text-danger text-xs">{error}</Text>
      )}
    </View>
  );
}
```

---

**`components/ui/Badge.tsx`** — Badge de statut :

```tsx
import { View, Text } from "react-native";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, { container: string; text: string }> = {
  success: { container: "bg-primary/10", text: "text-primary" },
  warning: { container: "bg-yellow-400/10", text: "text-yellow-400" },
  danger: { container: "bg-danger/10", text: "text-danger" },
  info: { container: "bg-secondary/10", text: "text-secondary" },
  neutral: { container: "bg-border", text: "text-textMuted" },
};

export function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <View className={`px-2.5 py-1 rounded-full self-start ${styles[variant].container}`}>
      <Text className={`text-xs font-semibold ${styles[variant].text}`}>{label}</Text>
    </View>
  );
}
```

---

**`components/ui/Avatar.tsx`** — Avatar utilisateur :

```tsx
import { View, Text, Image } from "react-native";

interface AvatarProps {
  name?: string;
  url?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-11 h-11", text: "text-base" },
  lg: { container: "w-16 h-16", text: "text-xl" },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ name, url, size = "md" }: AvatarProps) {
  const { container, text } = sizes[size];

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        className={`${container} rounded-full`}
      />
    );
  }

  return (
    <View className={`${container} rounded-full bg-primary/20 items-center justify-center`}>
      <Text className={`${text} font-bold text-primary`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
```

---

**`components/ui/Divider.tsx`** — Séparateur :

```tsx
import { View } from "react-native";

export function Divider({ className = "" }: { className?: string }) {
  return <View className={`h-px bg-border ${className}`} />;
}
```

---

**`components/ui/EmptyState.tsx`** — État vide :

```tsx
import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-3">
      {icon && <Text className="text-5xl">{icon}</Text>}
      <Text variant="h3" className="text-center">{title}</Text>
      {description && (
        <Text variant="muted" className="text-center leading-relaxed">{description}</Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-2 w-full">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}
```

---

### 2. Exporter tous les composants UI

Créer `components/ui/index.ts` :

```ts
export { Button } from "./Button";
export { Text } from "./Text";
export { Card } from "./Card";
export { Input } from "./Input";
export { Badge } from "./Badge";
export { Avatar } from "./Avatar";
export { Divider } from "./Divider";
export { EmptyState } from "./EmptyState";
```

---

### 3. Installer les icônes

```bash
npx expo install @expo/vector-icons
```

On utilisera `Feather` comme set d'icônes principal (propre, minimaliste).

---

### 4. Navigation principale avec Tab Bar

Remplacer `app/(app)/_layout.tsx` par la tab bar complète :

```tsx
import { Tabs } from "expo-router";
import { View } from "react-native";
import { Feather } from "@expo/vector-icons";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface TabIconProps {
  name: FeatherName;
  color: string;
  focused: boolean;
}

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View className="items-center justify-center">
      <Feather
        name={name}
        size={22}
        color={color}
      />
      {focused && (
        <View className="w-1 h-1 rounded-full bg-primary mt-1" />
      )}
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#13131a",
          borderTopColor: "#1e1e2e",
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarActiveTintColor: "#6ee7b7",
        tabBarInactiveTintColor: "#475569",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="users" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="activity" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

### 5. Écrans placeholder pour chaque onglet

**`app/(app)/index.tsx`** — Dashboard :

```tsx
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../components/ui";
import { useAuthContext } from "../../lib/AuthContext";

export default function DashboardScreen() {
  const { user } = useAuthContext();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="pt-6 pb-4">
          <Text variant="muted">Bonjour 👋</Text>
          <Text variant="h1" className="mt-1">Dashboard</Text>
        </View>
        {/* Contenu ajouté à etape_03+ */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

**`app/(app)/contacts.tsx`** — Contacts :

```tsx
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../components/ui";

export default function ContactsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-6">
        <Text variant="h1">Contacts</Text>
        {/* Contenu ajouté à etape_03 */}
      </View>
    </SafeAreaView>
  );
}
```

**`app/(app)/activity.tsx`** — Activité :

```tsx
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "../../components/ui";

export default function ActivityScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-6">
        <Text variant="h1">Activité</Text>
        {/* Contenu ajouté à etape_04 */}
      </View>
    </SafeAreaView>
  );
}
```

**`app/(app)/profile.tsx`** — Profil :

```tsx
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button } from "../../components/ui";
import { useAuthContext } from "../../lib/AuthContext";

export default function ProfileScreen() {
  const { user, signOut } = useAuthContext();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-5 pt-6 gap-4">
        <Text variant="h1">Profil</Text>
        <Text variant="muted">{user?.email}</Text>
        <Button label="Se déconnecter" onPress={signOut} variant="ghost" />
        {/* Contenu enrichi à etape_08 */}
      </View>
    </SafeAreaView>
  );
}
```

---

### 6. Composant Header réutilisable

Créer `components/layout/Header.tsx` :

```tsx
import { View, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: {
    icon: React.ComponentProps<typeof Feather>["name"];
    onPress: () => void;
  };
}

export function Header({ title, subtitle, showBack = false, rightAction }: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
      <View className="flex-row items-center gap-3 flex-1">
        {showBack && (
          <TouchableOpacity onPress={() => router.back()} className="mr-1">
            <Feather name="arrow-left" size={22} color="#f1f5f9" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text variant="h2">{title}</Text>
          {subtitle && <Text variant="muted" className="mt-0.5">{subtitle}</Text>}
        </View>
      </View>
      {rightAction && (
        <TouchableOpacity onPress={rightAction.onPress} className="p-1">
          <Feather name={rightAction.icon} size={22} color="#6ee7b7" />
        </TouchableOpacity>
      )}
    </View>
  );
}
```

Créer `components/layout/index.ts` :

```ts
export { Header } from "./Header";
```

---

### 7. Mettre à jour les types globaux

Mettre à jour `types/index.ts` :

```ts
export type UserId = string;
export type ContactId = string;

export interface UserProfile {
  id: UserId;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Pipeline statuts — sera enrichi à etape_04
export type PipelineStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "client"
  | "inactive";

export const PIPELINE_LABELS: Record<PipelineStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  interested: "Intéressé",
  follow_up: "À relancer",
  client: "Client",
  inactive: "Inactif",
};

// Contact — sera utilisé à etape_03
export interface Contact {
  id: ContactId;
  user_id: UserId;
  full_name: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: PipelineStatus;
  next_follow_up?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}
```

---

## Critères de validation

Avant de passer à etape_03, vérifier que :

- [ ] La tab bar s'affiche avec 4 onglets (Home, Contacts, Activité, Profil)
- [ ] Le point vert apparaît sous l'icône de l'onglet actif
- [ ] La navigation entre onglets fonctionne sans rechargement
- [ ] Tous les composants UI s'importent depuis `components/ui`
- [ ] Le Header s'affiche correctement sur le Dashboard
- [ ] Aucune erreur TypeScript

---

## Ce qu'on ne fait PAS dans cette étape

- Pas de données réelles (etape_03+)
- Pas de logique contacts ni pipeline (etape_03/04)
- Pas de notifications (etape_05)
- Les écrans sont des placeholders — juste le titre

---

## Prochaine étape

`etape_03` — Gestion des contacts (liste, fiche, ajout, édition, suppression)
