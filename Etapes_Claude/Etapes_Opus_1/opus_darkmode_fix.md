# KIT — Audit & Fix thème sombre/clair

## Contexte

App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
Le redesign UI global Sleek a été effectué avec des couleurs hardcodées
(`#fff`, `#f8f9fb`, `#0f172a`, `#10b981`, etc.) qui cassent le dark mode.

Tu vas auditer et corriger tous les fichiers pour que le dark mode
fonctionne correctement.

---

## Rappel du design system

Lire `lib/theme.ts` avant de commencer.

### Valeurs light mode
```ts
bg:           "#f8f9fb"
surface:      "#ffffff"
border:       "rgba(0,0,0,0.07)"
textPrimary:  "#0f172a"
textMuted:    "#64748b"
textHint:     "#94a3b8"
primary:      "#10b981"
primaryBg:    "rgba(16,185,129,0.08)"
primaryBorder:"rgba(16,185,129,0.2)"
danger:       "#f87171"
dangerBg:     "rgba(248,113,113,0.1)"
dangerBorder: "rgba(248,113,113,0.25)"
warning:      "#fbbf24"
warningBg:    "rgba(251,191,36,0.1)"
warningBorder:"rgba(251,191,36,0.25)"
accent:       "#818cf8"
accentBg:     "rgba(129,140,248,0.1)"
accentBorder: "rgba(129,140,248,0.25)"
success:      "#22c55e"
successBg:    "rgba(34,197,94,0.1)"
successBorder:"rgba(34,197,94,0.25)"
```

### Valeurs dark mode (à vérifier dans theme.ts et corriger si besoin)
```ts
bg:           "#080c12"
surface:      "#0e1420"
border:       "rgba(255,255,255,0.07)"
textPrimary:  "#f1f5f9"
textMuted:    "#64748b"
textHint:     "#334155"
primary:      "#6ee7b7"   // vert plus clair en dark
primaryBg:    "rgba(110,231,183,0.1)"
primaryBorder:"rgba(110,231,183,0.2)"
// danger, warning, accent, success — identiques dans les deux modes
```

---

## Règle absolue

**Aucune couleur hardcodée ne doit rester dans les fichiers `.tsx`.**

| ❌ Interdit | ✅ Correct |
|------------|-----------|
| `backgroundColor: "#fff"` | `backgroundColor: theme.surface` |
| `backgroundColor: "#f8f9fb"` | `backgroundColor: theme.bg` |
| `color: "#0f172a"` | `color: theme.textPrimary` |
| `color: "#64748b"` | `color: theme.textMuted` |
| `color: "#94a3b8"` | `color: theme.textHint` |
| `backgroundColor: "#f8fafc"` | `backgroundColor: theme.bg` |
| `borderColor: "#e2e8f0"` | `borderColor: theme.border` |
| `backgroundColor: "#f1f5f9"` | `backgroundColor: theme.border` (séparateur) |
| `color: "#10b981"` | `color: theme.primary` |
| `backgroundColor: "#f0fdf4"` | `backgroundColor: theme.primaryBg` |
| `borderColor: "#10b981"` | `borderColor: theme.primaryBorder` |
| `color: "#ef4444"` | `color: theme.danger` |
| `backgroundColor: "#fef2f2"` | `backgroundColor: theme.dangerBg` |

---

## Exceptions autorisées (ne pas modifier)

Ces couleurs peuvent rester hardcodées car elles sont identiques dark/light :
- `#f87171`, `#fbbf24`, `#818cf8`, `#22c55e`, `#10b981` quand utilisés
  comme couleurs de **statut contact** (via `STATUS_COLORS`)
- Les couleurs dans `STATUS_COLORS` dans `types/index.ts`
- Les couleurs dans `NOTIF_CONFIG` dans `notifications.tsx`
- `color: "#fff"` sur du texte **posé sur un fond coloré** (ex: texte blanc sur bouton vert)
- `color: "#0f172a"` sur du texte **posé sur un fond coloré clair** (ex: texte foncé sur chip vert clair)
- Les shadows : `shadowColor: "#000"` est OK

---

## ÉTAPE 1 — Audit complet

Faire une recherche dans tous les fichiers `app/(app)/`, `app/(auth)/`,
`components/` pour trouver toutes les couleurs hardcodées problématiques.

Chercher :
- `"#fff"` ou `"#ffffff"` comme backgroundColor
- `"#f8f9fb"`, `"#f8fafc"`, `"#f1f5f9"` comme backgroundColor
- `"#0f172a"` comme color
- `"#64748b"` comme color
- `"#94a3b8"` comme color
- `"#e2e8f0"` comme borderColor
- `"#10b981"` comme color (hors STATUS_COLORS et NOTIF_CONFIG)
- `"#f0fdf4"` comme backgroundColor

Lister tous les fichiers et lignes concernés avant de modifier.

---

## ÉTAPE 2 — Corrections prioritaires

### Fichiers les plus probablement cassés après le redesign Sleek

1. `app/(app)/index.tsx` — beaucoup de `#fff`, `#f8f9fb`, `#0f172a`
2. `app/(app)/contacts/index.tsx` — idem
3. `app/(app)/contacts/[id].tsx` — idem
4. `app/(app)/notifications.tsx` — tout récent, probablement hardcodé
5. `components/contacts/ContactCard.tsx` — redesigné avec Sleek
6. `components/ui/Card.tsx` — shadow et fond
7. `components/ui/Avatar.tsx` — fond coloré
8. `app/(app)/calendar.tsx` — redesigné récemment
9. Tous les bottom sheets — redesignés avec `#fff`, `#f8fafc`

### Cas spéciaux

**Shadows** — En dark mode, les shadows sont inutiles (fond sombre).
Adapter ainsi :

```tsx
// Avant
style={{
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
}}

// Après
style={{
  ...(theme.isDark ? {} : {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  }),
  borderWidth: theme.isDark ? 1 : 0,
  borderColor: theme.isDark ? theme.border : "transparent",
}}
```

**Fond des chips/pills** — En dark mode utiliser `theme.surface` au lieu de `#f8fafc` :

```tsx
backgroundColor: theme.isDark ? theme.surface : "#f8fafc"
// → simplifier en : backgroundColor: theme.bg
```

**Séparateurs** — `#f1f5f9` en light devient `theme.border` en dark :
```tsx
// Avant
backgroundColor: "#f1f5f9"
// Après
backgroundColor: theme.border
```

---

## ÉTAPE 3 — Vérifier theme.ts

S'assurer que `lib/theme.ts` a bien les deux modes correctement définis
avec toutes les nouvelles valeurs sémantiques (`danger`, `warning`, `accent`,
`success` et leurs variantes `Bg`/`Border`).

Si `isDark` n'est pas encore dans le retour de `useTheme()`, l'ajouter :

```ts
const isDark = colorScheme === "dark";
return {
  isDark,
  // ... reste des valeurs
};
```

---

## ÉTAPE 4 — Test des deux modes

Après les corrections :
1. Tester visuellement en mode clair — tout doit être identique à avant
2. Tester visuellement en mode sombre — tout doit être lisible, pas de
   texte noir sur fond noir, pas de cards invisibles
3. Vérifier les écrans : Dashboard, Contacts, Fiche contact, Calendrier,
   Profil, Notifications, tous les bottom sheets

---

## Critères de validation

- [ ] `lib/theme.ts` retourne `isDark` boolean
- [ ] Toutes les cards utilisent `theme.surface` (pas `#fff`)
- [ ] Tous les fonds d'écran utilisent `theme.bg` (pas `#f8f9fb`)
- [ ] Tous les textes primaires utilisent `theme.textPrimary` (pas `#0f172a`)
- [ ] Tous les séparateurs utilisent `theme.border` (pas `#e2e8f0` ou `#f1f5f9`)
- [ ] Les shadows sont désactivées en dark mode
- [ ] Les cards dark mode ont une bordure subtile à la place des shadows
- [ ] En dark mode, aucun texte n'est illisible
- [ ] En dark mode, aucune card n'est invisible (fond = fond)
- [ ] Le toggle dark/light dans le profil switche correctement
- [ ] Aucune erreur TypeScript
