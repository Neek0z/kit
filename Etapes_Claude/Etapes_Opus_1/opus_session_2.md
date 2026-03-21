# KIT — Session Opus 2 : Design System Unifié

## Contexte
App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
La session 1 a été complétée. Tu vas maintenant unifier le design system
et standardiser tous les écrans.

---

## ÉTAPE 0 — Lire et comprendre le design system existant

Avant de modifier quoi que ce soit, lis ces fichiers :
- `lib/theme.ts` — le hook `useTheme()` et toutes les valeurs
- `types/index.ts` — `STATUS_COLORS`, `STATUS_PROGRESS`, `PipelineStatus`
- `components/ui/index.ts` — tous les composants exportés
- `components/ui/Card.tsx`, `Button.tsx`, `Input.tsx`, `Text.tsx`, `Avatar.tsx`

C'est ta référence absolue. Ne crée pas de nouvelles valeurs — utilise celles qui existent.

---

## ÉTAPE 1 — Enrichir theme.ts avec une échelle de tailles

Ajouter dans `lib/theme.ts` une échelle standardisée :

```ts
// Ajouter dans le retour de useTheme()
spacing: {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
},
fontSize: {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  title: 26,
  hero: 28,
},
borderRadius: {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 18,
  full: 100,
},
```

---

## ÉTAPE 2 — Éliminer les couleurs hardcodées 🟠

Remplacer toutes les couleurs hardcodées par des références au thème.

### Règle de correspondance :

| Couleur hardcodée | Remplacer par |
|-------------------|---------------|
| `#f87171` | `"#f87171"` → créer `theme.danger` dans theme.ts |
| `#fbbf24` | `"#fbbf24"` → créer `theme.warning` dans theme.ts |
| `#818cf8` | `"#818cf8"` → créer `theme.accent` dans theme.ts |
| `#22c55e` | `"#22c55e"` → créer `theme.success` dans theme.ts |
| `#6ee7b7` | `theme.primary` |
| `#94a3b8` | `theme.textMuted` |
| `#334155` | `theme.textHint` |
| `#64748b` | `theme.textMuted` |
| `#0f172a` | `theme.textPrimary` |
| `rgba(110,231,183,...)` | `theme.primaryBg` ou `theme.primaryBorder` |

Ajouter dans `lib/theme.ts` les nouvelles valeurs sémantiques :

```ts
// Dans les deux modes (dark et light)
danger:        "#f87171",
dangerBg:      "rgba(248,113,113,0.1)",
dangerBorder:  "rgba(248,113,113,0.25)",
warning:       "#fbbf24",
warningBg:     "rgba(251,191,36,0.1)",
warningBorder: "rgba(251,191,36,0.25)",
accent:        "#818cf8",
accentBg:      "rgba(129,140,248,0.1)",
accentBorder:  "rgba(129,140,248,0.25)",
success:       "#22c55e",
successBg:     "rgba(34,197,94,0.1)",
successBorder: "rgba(34,197,94,0.25)",
```

### Fichiers à corriger en priorité :
1. `app/(app)/index.tsx` — 10+ couleurs hardcodées
2. `app/(app)/profile/index.tsx` — le plus touché
3. `app/(app)/contacts/[id].tsx`
4. `components/contacts/PipelineArc.tsx` — palette totalement indépendante
5. `app/(app)/content/index.tsx`
6. `components/contacts/ContactRelancesSection.tsx`
7. `components/calendar/CalendarMonthView.tsx`
8. `app/(auth)/login.tsx` et `register.tsx`

---

## ÉTAPE 3 — Créer un composant Divider 🟠

Le pattern `height: 1, backgroundColor: theme.border` est dupliqué partout.
Créer `components/ui/Divider.tsx` :

```tsx
import { View } from "react-native";
import { useTheme } from "../../lib/theme";

interface DividerProps {
  indent?: number; // marginLeft pour le style iOS
}

export function Divider({ indent = 0 }: DividerProps) {
  const theme = useTheme();
  return (
    <View style={{
      height: 1,
      backgroundColor: theme.border,
      marginLeft: indent,
    }} />
  );
}
```

L'exporter depuis `components/ui/index.ts`.
Remplacer tous les `<View style={{ height: 1, backgroundColor: theme.border }} />` par `<Divider />`.

---

## ÉTAPE 4 — Standardiser les composants UI 🟠

### 4a. Remplacer les TextInput natifs par <Input />

Dans `app/(auth)/login.tsx` et `app/(auth)/register.tsx` :
- Remplacer `TextInput` natif par le composant `<Input />` existant
- Conserver toute la logique (onChangeText, secureTextEntry, etc.)

Dans `app/(app)/contacts/index.tsx` :
- Remplacer la search bar custom par `<Input />`

### 4b. Standardiser les cards dans profile/index.tsx

Dans `app/(app)/profile/index.tsx` :
- Remplacer les `TouchableOpacity` avec styles inline par le pattern
  `<Card>` + rows standardisées
- Utiliser le composant `SettingsRow` si déjà créé, sinon créer un composant
  `ProfileRow` réutilisable :

```tsx
function ProfileRow({ icon, label, value, onPress, rightElement, danger }: ProfileRowProps) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 }}
    >
      <View style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: danger ? theme.dangerBg : `${color}15`,
        alignItems: "center", justifyContent: "center",
      }}>
        <Feather name={icon} size={15} color={danger ? theme.danger : color} />
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: danger ? theme.danger : theme.textPrimary }}>
        {label}
      </Text>
      {value && <Text style={{ fontSize: 13, color: theme.textMuted }}>{value}</Text>}
      {rightElement ?? (onPress && <Feather name="chevron-right" size={15} color={theme.textHint} />)}
    </TouchableOpacity>
  );
}
```

### 4c. Standardiser les cards dans groups/index.tsx

Remplacer les cards inline par le composant `<Card>` existant.

---

## ÉTAPE 5 — Standardiser les tailles 🟢

Appliquer l'échelle définie dans theme.ts à tous les écrans.

Règles strictes :
- **Titre d'écran** : `fontSize: 26` ou `28`, `fontWeight: "800"`, `letterSpacing: -1`
- **Sous-titre section** : `fontSize: 11`, `textTransform: "uppercase"`, `letterSpacing: 0.8`, `fontWeight: "600"`, couleur `theme.textHint`
- **Body** : `fontSize: 14`, couleur `theme.textPrimary`
- **Secondaire** : `fontSize: 12` ou `13`, couleur `theme.textMuted`
- **Padding horizontal écran** : `20` partout (pas 16, pas 18)
- **Padding interne card** : `14` partout
- **BorderRadius card** : `16` ou `18` (choisir une valeur et s'y tenir)
- **BorderRadius pill** : `100`
- **BorderRadius bouton** : `12`
- **BorderRadius input** : `12`

---

## ÉTAPE 6 — Ajouter la ligne décorative manquante 🟢

Ajouter `<View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />`
juste après le `<SafeAreaView>` dans :
- `app/(app)/contacts/new.tsx`
- `app/(app)/profile/workflow.tsx`
- `app/(app)/profile/workflow-client.tsx`

---

## ÉTAPE 7 — Corriger PipelineArc 🟠

`components/contacts/PipelineArc.tsx` utilise une palette de couleurs totalement
indépendante du thème (`#378ADD`, `#1D9E75`, `#BA7517`, etc.).

Remplacer par les couleurs de `STATUS_COLORS` depuis `types/index.ts` :
- Lire `STATUS_COLORS` et mapper chaque statut à sa couleur
- Adapter le rendu SVG pour utiliser ces couleurs

---

## Validation finale

Après toutes les modifications :
1. Lance `npx tsc --noEmit` — zéro erreur TypeScript attendu
2. Vérifie que l'app se lance sans crash avec `npm run start`
3. Liste tous les fichiers modifiés
4. Signale les cas où tu as fait des choix — pour qu'on puisse les valider
