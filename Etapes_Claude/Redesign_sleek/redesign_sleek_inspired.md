# KIT — Redesign UI global inspiré Sleek

## Contexte

On refait l'UI de toute l'app en s'inspirant du style Sleek :
mode clair premium avec fond blanc/gris clair, typo bold, 
barres de progression colorées, photos de profil, pipeline avec chiffres.
Le dark mode existant est conservé — on améliore les deux thèmes.

---

## Nouveau design system

### Couleurs light mode (nouvelles valeurs dans lib/theme.ts)

```ts
// LIGHT MODE — nouvelles valeurs
bg:           "#f8f9fb"   // fond principal légèrement warm
surface:      "#ffffff"   // cards blanches
surfaceAlt:   "#f1f4f8"   // fond alternatif sections
border:       "rgba(0,0,0,0.08)"
borderAccent: "rgba(15,118,110,0.2)"
textPrimary:  "#0f172a"
textMuted:    "#64748b"
textHint:     "#94a3b8"
primary:      "#0d9488"   // vert teal plus profond en light
primaryBg:    "rgba(13,148,136,0.08)"
primaryBorder:"rgba(13,148,136,0.2)"

// DARK MODE — inchangé
bg:           "#080c12"
surface:      "#0e1420"
// ... existant
```

Mettre à jour `lib/theme.ts` avec ces valeurs pour le light mode.

### Couleurs statut — inchangées
```ts
new:        "#94a3b8"
contacted:  "#818cf8"
interested: "#fbbf24"
follow_up:  "#f87171"
client:     "#6ee7b7"
```

---

## PARTIE 1 — Dashboard redesign

### Nouvelles sections dans app/(app)/index.tsx

#### 1. Header avec citation motivationnelle

```tsx
// Tableau de citations MLM rotatives (1 par jour selon le jour de l'année)
const MLM_QUOTES = [
  "Votre réseau est votre valeur nette.",
  "Contactez 5 personnes aujourd'hui.",
  "Chaque non vous rapproche d'un oui.",
  "La régularité bat le talent.",
  "Un client satisfait vaut 10 prospects.",
  "Votre succès dépend de votre suivi.",
  "Construisez des relations, pas des ventes.",
];

const todayQuote = MLM_QUOTES[new Date().getDay() % MLM_QUOTES.length];

// Header JSX
<View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
  <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.8 }}>
    Bonjour, {firstName} 👋
  </Text>
  <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 5, fontStyle: "italic" }}>
    "{todayQuote}"
  </Text>
</View>
```

#### 2. Raccourcis rapides sous le header

```tsx
// 3 boutons pills horizontaux sous le greeting
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
  <View style={{ flexDirection: "row", gap: 8 }}>
    {[
      { label: "Nouveau contact", icon: "user-plus", color: theme.primary, route: "/(app)/contacts/new" },
      { label: "Relance",         icon: "bell",      color: "#f87171",      route: "/(app)/contacts" },
      { label: "Message",         icon: "message-circle", color: "#818cf8", route: "/(app)/messages" },
    ].map((btn) => (
      <TouchableOpacity
        key={btn.label}
        onPress={() => router.push(btn.route as any)}
        style={{
          flexDirection: "row", alignItems: "center", gap: 6,
          backgroundColor: `${btn.color}12`,
          borderWidth: 1, borderColor: `${btn.color}25`,
          borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8,
        }}
      >
        <Feather name={btn.icon as any} size={13} color={btn.color} />
        <Text style={{ fontSize: 12, fontWeight: "600", color: btn.color }}>{btn.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
</ScrollView>
```

#### 3. Pipeline avec chiffres par statut

Remplacer la barre pipeline actuelle par des cards de statut avec chiffres :

```tsx
<Card style={{ marginHorizontal: 20, marginBottom: 10 }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <Text style={{ fontSize: 11, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
      Pipeline
    </Text>
    <TouchableOpacity onPress={() => router.push("/(app)/contacts")}>
      <Text style={{ fontSize: 11, color: theme.primary }}>Voir tout →</Text>
    </TouchableOpacity>
  </View>
  <View style={{ flexDirection: "row", gap: 6 }}>
    {[
      { key: "new",        label: "Nouveau",   color: "#94a3b8" },
      { key: "contacted",  label: "Contacté",  color: "#818cf8" },
      { key: "interested", label: "Intéressé", color: "#fbbf24" },
      { key: "follow_up",  label: "Relance",   color: "#f87171" },
      { key: "client",     label: "Client",    color: "#6ee7b7" },
    ].map((s) => (
      <TouchableOpacity
        key={s.key}
        onPress={() => router.push("/(app)/contacts")}
        style={{
          flex: 1, alignItems: "center", paddingVertical: 10,
          backgroundColor: `${s.color}10`,
          borderRadius: 12,
          borderWidth: 1, borderColor: `${s.color}25`,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "800", color: s.color, lineHeight: 20 }}>
          {byStatus[s.key as PipelineStatus] ?? 0}
        </Text>
        <Text style={{ fontSize: 9, color: theme.textHint, marginTop: 3, textAlign: "center" }} numberOfLines={1}>
          {s.label}
        </Text>
        <View style={{ width: "60%", height: 3, borderRadius: 2, backgroundColor: s.color, marginTop: 5, opacity: 0.6 }} />
      </TouchableOpacity>
    ))}
  </View>
</Card>
```

#### 4. Section Performance

```tsx
<View style={{ flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 10 }}>
  <Card style={{ flex: 1 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.primaryBg, alignItems: "center", justifyContent: "center" }}>
        <Feather name="users" size={15} color={theme.primary} />
      </View>
      <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary }}>{weeklyNewContacts}</Text>
    </View>
    <Text style={{ fontSize: 11, color: theme.textMuted }}>CONTACTS AJOUTÉS</Text>
    <Text style={{ fontSize: 10, color: theme.primary, marginTop: 2, fontWeight: "600" }}>↑ Cette semaine</Text>
  </Card>
  <Card style={{ flex: 1 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(110,231,183,0.12)", alignItems: "center", justifyContent: "center" }}>
        <Feather name="star" size={15} color="#6ee7b7" />
      </View>
      <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary }}>{monthlyNewClients}</Text>
    </View>
    <Text style={{ fontSize: 11, color: theme.textMuted }}>NOUVEAUX CLIENTS</Text>
    <Text style={{ fontSize: 10, color: "#6ee7b7", marginTop: 2, fontWeight: "600" }}>↑ Ce mois</Text>
  </Card>
</View>
```

Ajouter dans `hooks/useDashboard.ts` :

```ts
// Contacts ajoutés cette semaine
const weekStart = new Date();
weekStart.setDate(weekStart.getDate() - weekStart.getDay());
const weeklyNewContacts = contacts.filter(
  (c) => new Date(c.created_at) >= weekStart
).length;

// Nouveaux clients ce mois
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);
const monthlyNewClients = contacts.filter(
  (c) => c.status === "client" && new Date(c.updated_at) >= monthStart
).length;

// Ajouter au return
return { ..., weeklyNewContacts, monthlyNewClients };
```

#### 5. Activité récente en bas

```tsx
{/* Activité récente */}
<View style={{ marginHorizontal: 20, marginBottom: 24 }}>
  <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary, marginBottom: 10 }}>
    Activité récente
  </Text>
  <Card padding="sm">
    {recentActivity.slice(0, 4).map((item, i) => (
      <View key={item.id}>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/contacts/${item.contact_id}`)}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9 }}
        >
          <View style={{
            width: 32, height: 32, borderRadius: 50%,
            backgroundColor: theme.primaryBg,
            borderWidth: 1, borderColor: theme.primaryBorder,
            alignItems: "center", justifyContent: "center",
          }}>
            <Feather name={INTERACTION_ICONS[item.type as InteractionType] as any} size={13} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: theme.textPrimary, fontWeight: "500" }}>{item.description}</Text>
            <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>{formatRelativeTime(item.created_at)}</Text>
          </View>
        </TouchableOpacity>
        {i < 3 && <View style={{ height: 1, backgroundColor: theme.border }} />}
      </View>
    ))}
  </Card>
</View>
```

Ajouter `formatRelativeTime` dans `lib/utils.ts` :

```ts
export function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}
```

---

## PARTIE 2 — Liste contacts redesign

### Bouton + flottant

Remplacer le bouton + dans le header par un FAB (Floating Action Button) :

```tsx
{/* FAB flottant */}
<TouchableOpacity
  onPress={() => canAddContact ? router.push("/(app)/contacts/new") : router.push("/(app)/subscription")}
  style={{
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    // Shadow iOS
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow Android
    elevation: 8,
  }}
>
  <Feather name="plus" size={24} color={theme.isDark ? "#0f172a" : "#ffffff"} />
</TouchableOpacity>
```

### Barre de progression colorée sous chaque contact

Modifier `components/contacts/ContactCard.tsx` pour ajouter
une barre de progression sous chaque ligne de contact :

```tsx
// Correspondance statut → position dans le pipeline (0 à 4)
const STATUS_PROGRESS: Record<PipelineStatus, number> = {
  new: 0,
  contacted: 1,
  interested: 2,
  follow_up: 3,
  client: 4,
  inactive: 0,
};

const TOTAL_STEPS = 4;
const statusColors = STATUS_COLORS[contact.status as StatusKey];
const progress = STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0;
const progressPercent = (progress / TOTAL_STEPS) * 100;

// Ajouter sous le contenu principal de la card, avant la fermeture
<View style={{ marginTop: 6, height: 3, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" }}>
  <View style={{
    height: 3,
    width: `${progressPercent}%`,
    backgroundColor: statusColors.text,
    borderRadius: 2,
  }} />
</View>
```

Nouvelle structure ContactCard :

```tsx
export function ContactCard({ contact }: ContactCardProps) {
  const theme = useTheme();
  const { pendingCount } = useContactTasks(contact.id);
  const statusColors = STATUS_COLORS[contact.status as StatusKey] ?? STATUS_COLORS.inactive;
  const progress = (STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0) / 4 * 100;

  return (
    <TouchableOpacity
      onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "transparent",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={contact.full_name} status={contact.status} size="md" url={contact.avatar_url} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textPrimary }}>
              {contact.full_name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {pendingCount > 0 && (
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: theme.primaryBg, borderWidth: 1, borderColor: theme.primaryBorder, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: theme.primary }}>{pendingCount}</Text>
                </View>
              )}
              <StatusPill status={contact.status} size="sm" />
            </View>
          </View>

          {contact.phone && (
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 1 }}>{contact.phone}</Text>
          )}

          {/* Barre de progression pipeline */}
          <View style={{ marginTop: 7, height: 3, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden" }}>
            <View style={{ height: 3, width: `${progress}%`, backgroundColor: statusColors.text, borderRadius: 2 }} />
          </View>

          {/* Date relance si définie */}
          {contact.next_follow_up && (
            <Text style={{
              fontSize: 10,
              color: new Date(contact.next_follow_up) < new Date() ? "#f87171" : theme.textHint,
              marginTop: 3,
            }}>
              {new Date(contact.next_follow_up) < new Date() ? "⚠ En retard · " : ""}
              {new Date(contact.next_follow_up).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

---

## PARTIE 3 — Ajustements light mode

Dans `lib/theme.ts`, mettre à jour les valeurs light mode pour un rendu
plus proche du style Sleek (fond chaud, cards blanches pures) :

```ts
// Light mode
bg:           "#f8f9fb",
surface:      "#ffffff",
border:       "rgba(0,0,0,0.07)",
textPrimary:  "#0f172a",
textMuted:    "#64748b",
textHint:     "#94a3b8",
primary:      "#0d9488",  // teal légèrement plus foncé en light pour contraste
primaryBg:    "rgba(13,148,136,0.08)",
primaryBorder:"rgba(13,148,136,0.18)",
```

---

## PARTIE 4 — Micro-détails

### Séparateurs dans les listes

Dans la liste contacts, remplacer les séparateurs full-width
par des séparateurs avec indent (comme iOS natif) :

```tsx
// Séparateur avec indent
<View style={{ height: 1, backgroundColor: theme.border, marginLeft: 72 }} />
```

### Cards sans bordure en light mode

En light mode, les cards peuvent se distinguer uniquement
par leur fond blanc sur le fond gris — sans bordure visible :

```tsx
// Dans Card.tsx
borderWidth: theme.isDark ? 1 : 0.5,
borderColor: theme.isDark ? theme.border : "rgba(0,0,0,0.06)",
// Ajouter une très légère ombre en light mode
...(theme.isDark ? {} : {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 1,
}),
```

---

## Critères de validation

- [ ] La citation du jour s'affiche sous le greeting
- [ ] Les 3 boutons pills de raccourci s'affichent sous la citation
- [ ] Le pipeline affiche les chiffres par statut en cards colorées
- [ ] La section Performance affiche contacts semaine + clients mois
- [ ] L'activité récente s'affiche en bas du dashboard
- [ ] Chaque contact dans la liste a une barre de progression colorée
- [ ] La barre de progression correspond bien au statut du contact
- [ ] Le bouton + est un FAB flottant en bas à droite
- [ ] Le light mode utilise les nouvelles couleurs (#f8f9fb, #0d9488)
- [ ] Les séparateurs dans la liste ont un indent de 72px
- [ ] Aucune régression fonctionnelle
- [ ] Aucune erreur TypeScript
