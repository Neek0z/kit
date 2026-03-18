# KIT — Redesign visuel : Modern Dark/Light

## Contexte

L'app est fonctionnelle. On refait entièrement le design visuel pour les 3 écrans
prioritaires : Dashboard, Liste contacts, Fiche contact.
Le style cible : **soft dark premium + typographie bold + couleurs sémantiques par statut**.
Compatible mode sombre ET mode clair (l'app a déjà un toggle dark/light).

---

## PARTIE 1 — Nouveau système de couleurs

### Remplacer complètement `tailwind.config.js`

```js
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // === DARK MODE ===
        dark: {
          bg:       "#080c12",   // fond principal — quasi noir
          surface:  "#0e1420",   // cards et surfaces
          border:   "rgba(255,255,255,0.07)",  // bordures subtiles
          muted:    "#334155",   // texte très discret
        },

        // === LIGHT MODE ===
        light: {
          bg:       "#f4f6f9",   // fond principal — gris très doux
          surface:  "#ffffff",   // cards blanches
          border:   "rgba(0,0,0,0.07)",
          muted:    "#94a3b8",
        },

        // === COULEURS SÉMANTIQUES (identiques dark/light) ===
        // Accent principal
        primary:   "#6ee7b7",   // dark: vert menthe vif
        "primary-light": "#059669", // light: vert plus profond

        // Statuts pipeline
        status: {
          new:       { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.2)"  },
          contacted: { color: "#818cf8", bg: "rgba(129,140,248,0.1)",  border: "rgba(129,140,248,0.2)"  },
          interested:{ color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.2)"   },
          follow_up: { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.2)"  },
          client:    { color: "#6ee7b7", bg: "rgba(110,231,183,0.1)",  border: "rgba(110,231,183,0.2)"  },
          inactive:  { color: "#475569", bg: "rgba(71,85,105,0.1)",    border: "rgba(71,85,105,0.2)"    },
        },
      },
    },
  },
  plugins: [],
};
```

---

### Créer `lib/theme.ts` — tokens centralisés

```ts
import { useColorScheme } from "react-native";

// Couleurs statiques par statut — utilisées dans tout l'app
export const STATUS_COLORS = {
  new:        { text: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)"  },
  contacted:  { text: "#818cf8", bg: "rgba(129,140,248,0.1)",  border: "rgba(129,140,248,0.25)"  },
  interested: { text: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)"   },
  follow_up:  { text: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.25)"  },
  client:     { text: "#6ee7b7", bg: "rgba(110,231,183,0.1)",  border: "rgba(110,231,183,0.25)"  },
  inactive:   { text: "#475569", bg: "rgba(71,85,105,0.1)",    border: "rgba(71,85,105,0.2)"     },
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

// Hook pour les tokens dynamiques dark/light
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return {
    isDark,

    // Fonds
    bg:          isDark ? "#080c12"  : "#f4f6f9",
    surface:     isDark ? "#0e1420"  : "#ffffff",
    surfaceHover:isDark ? "#131b28"  : "#f8fafc",

    // Textes
    textPrimary: isDark ? "#f1f5f9"  : "#0f172a",
    textMuted:   isDark ? "#64748b"  : "#94a3b8",
    textHint:    isDark ? "#334155"  : "#cbd5e1",

    // Bordures
    border:      isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    borderAccent:isDark ? "rgba(110,231,183,0.2)"  : "rgba(5,150,105,0.2)",

    // Accent
    primary:     isDark ? "#6ee7b7"  : "#059669",
    primaryBg:   isDark ? "rgba(110,231,183,0.12)" : "rgba(5,150,105,0.1)",
    primaryBorder:isDark? "rgba(110,231,183,0.3)"  : "rgba(5,150,105,0.25)",

    // Ligne décorative en haut des écrans
    accentLine:  isDark
      ? "linear-gradient(90deg, transparent, rgba(110,231,183,0.4), transparent)"
      : "linear-gradient(90deg, transparent, rgba(5,150,105,0.35), transparent)",
  };
}
```

---

### Mettre à jour `components/ui/StatusPill.tsx`

Remplacer/créer ce composant — utilisé partout pour afficher les statuts :

```tsx
import { View, Text } from "react-native";
import { STATUS_COLORS, StatusKey } from "../../lib/theme";
import { PIPELINE_LABELS } from "../../types";

interface StatusPillProps {
  status: string;
  size?: "sm" | "md";
}

export function StatusPill({ status, size = "md" }: StatusPillProps) {
  const colors = STATUS_COLORS[status as StatusKey] ?? STATUS_COLORS.inactive;
  const label = PIPELINE_LABELS[status as StatusKey] ?? status;

  return (
    <View style={{
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 100,
      paddingHorizontal: size === "sm" ? 8 : 10,
      paddingVertical: size === "sm" ? 2 : 3,
      alignSelf: "flex-start",
    }}>
      <Text style={{
        color: colors.text,
        fontSize: size === "sm" ? 10 : 11,
        fontWeight: "600",
        letterSpacing: 0.2,
      }}>
        {label}
      </Text>
    </View>
  );
}
```

---

### Mettre à jour `components/ui/Avatar.tsx`

L'avatar prend maintenant la couleur du statut du contact :

```tsx
import { View, Text, Image } from "react-native";
import { STATUS_COLORS, StatusKey } from "../../lib/theme";

interface AvatarProps {
  name?: string;
  url?: string | null;
  status?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm:  { container: 32, text: 12, border: 1   },
  md:  { container: 40, text: 14, border: 1.5 },
  lg:  { container: 60, text: 20, border: 2   },
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function Avatar({ name, url, status, size = "md" }: AvatarProps) {
  const s = SIZES[size];
  const colors = status
    ? STATUS_COLORS[status as StatusKey] ?? STATUS_COLORS.inactive
    : { text: "#6ee7b7", bg: "rgba(110,231,183,0.1)", border: "rgba(110,231,183,0.25)" };

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: s.container, height: s.container, borderRadius: s.container / 2 }}
      />
    );
  }

  return (
    <View style={{
      width: s.container,
      height: s.container,
      borderRadius: s.container / 2,
      backgroundColor: colors.bg,
      borderWidth: s.border,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Text style={{ color: colors.text, fontSize: s.text, fontWeight: "700" }}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
```

---

### Mettre à jour `components/ui/Card.tsx`

```tsx
import { View, ViewProps } from "react-native";
import { useTheme } from "../../lib/theme";

interface CardProps extends ViewProps {
  padding?: "sm" | "md" | "lg";
  accent?: boolean; // bordure verte si true
}

const PADDINGS = { sm: 10, md: 14, lg: 20 };

export function Card({ padding = "md", accent = false, style, children, ...props }: CardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: accent ? theme.borderAccent : theme.border,
          borderRadius: 18,
          padding: PADDINGS[padding],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
```

---

## PARTIE 2 — Redesign Dashboard

### Remplacer `app/(app)/index.tsx`

```tsx
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../lib/theme";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuthContext } from "../../lib/AuthContext";
import { Card, StatusPill, Avatar } from "../../components/ui";
import { PipelineBar } from "../../components/dashboard/PipelineBar";
import { Contact, PipelineStatus } from "../../types";

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { totalContacts, toFollowUp, byStatus, recentContacts, overdueFollowUps, loading } = useDashboard();

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? "toi";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Ligne décorative haut d'écran */}
        <View style={{ height: 1, marginHorizontal: 24, backgroundColor: theme.primary, opacity: 0.25 }} />

        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <View>
              <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 3 }}>
                Bonjour {firstName} 👋
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1, lineHeight: 32 }}>
                Dashboard
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(app)/contacts/new")}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: theme.primaryBg,
                borderWidth: 1, borderColor: theme.primaryBorder,
                alignItems: "center", justifyContent: "center",
                marginTop: 4,
              }}
            >
              <Feather name="plus" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Alerte relances en retard */}
          {overdueFollowUps.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/(app)/contacts")}
              style={{
                backgroundColor: "rgba(248,113,113,0.08)",
                borderWidth: 1, borderColor: "rgba(248,113,113,0.2)",
                borderRadius: 14, padding: 12,
                flexDirection: "row", alignItems: "center", gap: 10,
                marginBottom: 14,
              }}
            >
              <Feather name="alert-circle" size={16} color="#f87171" />
              <Text style={{ flex: 1, color: "#f87171", fontSize: 13, fontWeight: "600" }}>
                {overdueFollowUps.length} relance{overdueFollowUps.length > 1 ? "s" : ""} en retard
              </Text>
              <Feather name="chevron-right" size={14} color="#f87171" />
            </TouchableOpacity>
          )}

          {/* Stats — gros chiffres */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Contacts", value: totalContacts, accent: false },
              { label: "À relancer", value: toFollowUp.length, accent: toFollowUp.length > 0 },
              { label: "Clients", value: byStatus.client ?? 0, accent: true },
            ].map((stat) => (
              <View key={stat.label} style={{
                flex: 1,
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: stat.accent ? theme.borderAccent : theme.border,
                borderRadius: 14, padding: 12,
                alignItems: "center",
              }}>
                <Text style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>{stat.label}</Text>
                <Text style={{ fontSize: 26, fontWeight: "800", color: stat.accent ? theme.primary : theme.textPrimary, lineHeight: 28 }}>
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Pipeline */}
          {totalContacts > 0 && (
            <Card style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 10, letterSpacing: 0.8, color: theme.textHint, textTransform: "uppercase", marginBottom: 10, fontWeight: "600" }}>
                Pipeline
              </Text>
              <PipelineBar byStatus={byStatus} total={totalContacts} />
            </Card>
          )}

          {/* À relancer */}
          {toFollowUp.length > 0 && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary, marginBottom: 10, letterSpacing: -0.3 }}>
                À relancer
              </Text>
              <Card padding="sm">
                {toFollowUp.slice(0, 5).map((contact, i) => (
                  <ContactRow key={contact.id} contact={contact} showDivider={i < toFollowUp.length - 1 && i < 4} theme={theme} />
                ))}
              </Card>
            </View>
          )}

          {/* Récents */}
          {recentContacts.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary, marginBottom: 10, letterSpacing: -0.3 }}>
                Récents
              </Text>
              <Card padding="sm">
                {recentContacts.map((contact, i) => (
                  <ContactRow key={contact.id} contact={contact} showDivider={i < recentContacts.length - 1} theme={theme} />
                ))}
              </Card>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ContactRow({ contact, showDivider, theme }: { contact: Contact; showDivider: boolean; theme: ReturnType<typeof useTheme> }) {
  return (
    <>
      <TouchableOpacity
        onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 4 }}
        activeOpacity={0.7}
      >
        <Avatar name={contact.full_name} status={contact.status} size="md" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>{contact.full_name}</Text>
          {contact.phone && <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>{contact.phone}</Text>}
        </View>
        <StatusPill status={contact.status} size="sm" />
        <Feather name="chevron-right" size={14} color={theme.textHint} />
      </TouchableOpacity>
      {showDivider && <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 4 }} />}
    </>
  );
}
```

---

## PARTIE 3 — Redesign Liste contacts

### Remplacer l'UI dans `app/(app)/contacts.tsx`

Garder toute la logique existante (hooks, filtres, swipe mode, etc.).
Remplacer uniquement les styles visuels :

```tsx
// Ajouter en haut du composant
const theme = useTheme();

// Header
<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
  <Text style={{ fontSize: 28, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>Contacts</Text>
  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
    <TouchableOpacity
      onPress={() => setSwipeMode(!swipeMode)}
      style={{
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
        backgroundColor: swipeMode ? theme.primaryBg : theme.surface,
        borderWidth: 1,
        borderColor: swipeMode ? theme.primaryBorder : theme.border,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "600", color: swipeMode ? theme.primary : theme.textMuted }}>
        {swipeMode ? "Mode swipe" : "Mode liste"}
      </Text>
    </TouchableOpacity>
    {!swipeMode && (
      <TouchableOpacity
        onPress={() => router.push("/(app)/contacts/new")}
        style={{
          width: 32, height: 32, borderRadius: 16,
          backgroundColor: theme.primaryBg,
          borderWidth: 1, borderColor: theme.primaryBorder,
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Feather name="plus" size={16} color={theme.primary} />
      </TouchableOpacity>
    )}
  </View>
</View>

// Barre de recherche
<View style={{
  flexDirection: "row", alignItems: "center", gap: 8,
  backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border,
  borderRadius: 14, paddingHorizontal: 14, marginHorizontal: 20, marginBottom: 10,
}}>
  <Feather name="search" size={15} color={theme.textHint} />
  <TextInput
    style={{ flex: 1, paddingVertical: 11, fontSize: 14, color: theme.textPrimary }}
    placeholder="Rechercher..."
    placeholderTextColor={theme.textHint}
    value={search}
    onChangeText={setSearch}
    autoCapitalize="none"
  />
  {search.length > 0 && (
    <TouchableOpacity onPress={() => setSearch("")}>
      <Feather name="x" size={15} color={theme.textHint} />
    </TouchableOpacity>
  )}
</View>

// Row contact — remplacer ContactCard par ce rendu inline plus compact :
// Dans le FlatList renderItem, remplacer par :
renderItem={({ item }) => (
  <TouchableOpacity
    onPress={() => router.push(`/(app)/contacts/${item.id}`)}
    activeOpacity={0.7}
    style={{
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingVertical: 11, paddingHorizontal: 20,
      backgroundColor: item.status === "client" ? `rgba(110,231,183,0.03)` : "transparent",
      borderBottomWidth: 1, borderBottomColor: theme.border,
    }}
  >
    <Avatar name={item.full_name} status={item.status} size="md" />
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textPrimary }}>{item.full_name}</Text>
      {item.phone && <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{item.phone}</Text>}
    </View>
    <StatusPill status={item.status} size="sm" />
    <Feather name="chevron-right" size={14} color={theme.textHint} />
  </TouchableOpacity>
)}
```

---

## PARTIE 4 — Redesign Fiche contact

### Mettre à jour `app/(app)/contacts/[id].tsx`

Garder toute la logique existante. Remplacer uniquement les styles :

```tsx
const theme = useTheme();
const statusColors = STATUS_COLORS[contact.status as StatusKey] ?? STATUS_COLORS.inactive;

// Hero section
<View style={{ alignItems: "center", paddingVertical: 24, paddingHorizontal: 20 }}>
  <Avatar name={contact.full_name} status={contact.status} size="lg" url={contact.avatar_url} />
  <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary, marginTop: 12, letterSpacing: -0.5 }}>
    {contact.full_name}
  </Text>
  <StatusPill status={contact.status} style={{ marginTop: 8 }} />
</View>

// Actions rapides — grid 4 colonnes avec coins arrondis carrés
<View style={{ flexDirection: "row", justifyContent: "center", gap: 12, paddingHorizontal: 20, marginBottom: 20 }}>
  {[
    { icon: "phone",          label: "Appeler",   color: theme.primary,  onPress: handleCall },
    { icon: "message-circle", label: "WhatsApp",  color: "#22c55e",      onPress: handleWhatsApp },
    { icon: "mail",           label: "Email",     color: "#818cf8",      onPress: handleEmail },
    { icon: "message-square", label: "KIT",       color: theme.primary,  onPress: handleKitMessage },
  ].map((action) => (
    <TouchableOpacity
      key={action.label}
      onPress={action.onPress}
      style={{ alignItems: "center", gap: 5 }}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: theme.surface,
        borderWidth: 1, borderColor: `${action.color}25`,
        alignItems: "center", justifyContent: "center",
      }}>
        <Feather name={action.icon as any} size={17} color={action.color} />
      </View>
      <Text style={{ fontSize: 10, color: theme.textMuted }}>{action.label}</Text>
    </TouchableOpacity>
  ))}
</View>
```

---

## PARTIE 5 — Tab bar et navigation

### Mettre à jour `app/(app)/_layout.tsx`

```tsx
tabBarStyle: {
  backgroundColor: theme.isDark ? "#080c12" : "#ffffff",
  borderTopWidth: 1,
  borderTopColor: theme.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
  paddingTop: 8,
  paddingBottom: 8,
  height: 64,
},
tabBarActiveTintColor: theme.isDark ? "#6ee7b7" : "#059669",
tabBarInactiveTintColor: theme.isDark ? "#334155" : "#cbd5e1",
```

---

## PARTIE 6 — Ligne décorative en haut de chaque écran

Ajouter systématiquement en haut de chaque `SafeAreaView` pour tous les écrans :

```tsx
{/* Accent line */}
<View style={{
  height: 1,
  marginHorizontal: 32,
  backgroundColor: theme.isDark ? "rgba(110,231,183,0.3)" : "rgba(5,150,105,0.25)",
}} />
```

---

## Critères de validation

- [ ] Les 3 écrans (Dashboard, Contacts, Fiche) ont le nouveau style
- [ ] Le mode clair ET le mode sombre sont cohérents et lisibles
- [ ] Chaque avatar a la couleur de son statut
- [ ] Les StatusPill remplacent tous les anciens Badge/chips de statut
- [ ] La tab bar est proprement stylée dans les deux modes
- [ ] La ligne décorative apparaît en haut de chaque écran
- [ ] Les gros chiffres du dashboard sont bien en fontWeight 800
- [ ] Aucune régression fonctionnelle (toute la logique existante est préservée)
- [ ] Aucune erreur TypeScript

---

## Important

Ne pas toucher à la logique métier — uniquement les styles.
Ne pas modifier les hooks, les appels Supabase, ni la navigation.
Si un composant existant est réutilisé ailleurs (ex: ContactCard dans SwipeMode),
mettre à jour ses styles aussi pour la cohérence.
