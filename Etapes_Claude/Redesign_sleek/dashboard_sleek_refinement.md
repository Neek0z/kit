# KIT — Dashboard : affinage style Sleek

## Contexte

Le dashboard fonctionne bien mais manque d'aération et d'impact visuel
comparé au style Sleek. On affine sans tout refaire.

---

## Corrections à apporter

### 1. Espacement général — plus aéré

Dans `app/(app)/index.tsx`, augmenter tous les espacements :

```tsx
// ScrollView contentContainerStyle
contentContainerStyle={{ 
  paddingHorizontal: 20,  // était 16
  paddingBottom: 40,
  gap: 20,                // gap entre toutes les sections (était 10-12)
}}

// Header
paddingTop: 24,           // était 18
paddingBottom: 16,        // était 14

// Titre
fontSize: 28,             // était 26
```

---

### 2. Pipeline — chiffres plus grands + point coloré au-dessus

Remplacer les mini cards pipeline actuelles par ce layout :

```tsx
<Card style={{ marginBottom: 0 }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
    <Text style={{ fontSize: 11, color: theme.textHint, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600" }}>
      Pipeline
    </Text>
    <TouchableOpacity onPress={() => router.push("/(app)/contacts")}>
      <Text style={{ fontSize: 12, color: theme.primary }}>Voir tout →</Text>
    </TouchableOpacity>
  </View>

  <View style={{ flexDirection: "row", gap: 6 }}>
    {[
      { key: "new",        label: "NEW",        color: "#94a3b8" },
      { key: "contacted",  label: "CONTACTED",  color: "#818cf8" },
      { key: "interested", label: "INTERESTED", color: "#fbbf24" },
      { key: "follow_up",  label: "FOLLOW-UP",  color: "#f87171" },
      { key: "client",     label: "CLIENT",     color: "#6ee7b7" },
    ].map((s) => (
      <TouchableOpacity
        key={s.key}
        onPress={() => router.push("/(app)/contacts")}
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: theme.border,
          padding: 10,
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        {/* Point coloré en haut */}
        <View style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: s.color,
        }} />

        {/* Chiffre grand */}
        <Text style={{
          fontSize: 22, fontWeight: "800",
          color: theme.textPrimary, lineHeight: 24,
        }}>
          {byStatus[s.key as PipelineStatus] ?? 0}
        </Text>

        {/* Label */}
        <Text style={{
          fontSize: 9, fontWeight: "600",
          color: theme.textHint,
          letterSpacing: 0.5,
        }} numberOfLines={1}>
          {s.label}
        </Text>

        {/* Barre couleur en bas */}
        <View style={{
          height: 2, width: "100%",
          backgroundColor: s.color,
          borderRadius: 1,
          opacity: 0.5,
        }} />
      </TouchableOpacity>
    ))}
  </View>
</Card>
```

---

### 3. Today's Focus — bordure colorée à gauche par contact

Chaque ligne de contact dans "Aujourd'hui" doit avoir
une bordure colorée à gauche selon son statut, comme Sleek :

```tsx
// Dans la liste todayContacts, remplacer le TouchableOpacity par :
<TouchableOpacity
  key={contact.id}
  onPress={() => router.push(`/(app)/contacts/${contact.id}`)}
  style={{
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingVertical: 12,
    paddingLeft: 12, paddingRight: 10,
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    // Bordure gauche colorée selon statut
    borderLeftWidth: 3,
    borderLeftColor: STATUS_COLORS[contact.status as StatusKey]?.text ?? theme.primary,
    marginBottom: 8,
  }}
  activeOpacity={0.7}
>
  <Avatar name={contact.full_name} status={contact.status} size="md" url={contact.avatar_url} />
  <View style={{ flex: 1 }}>
    <Text style={{ fontSize: 14, fontWeight: "600", color: theme.textPrimary }}>
      {contact.full_name}
    </Text>
    <Text style={{
      fontSize: 11, marginTop: 2,
      color: contact.next_follow_up && new Date(contact.next_follow_up) < new Date()
        ? "#f87171"
        : theme.textMuted,
    }}>
      {contact.next_follow_up && new Date(contact.next_follow_up) < new Date()
        ? `Overdue Follow-up · ${new Date(contact.next_follow_up).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
        : "Aujourd'hui"
      }
    </Text>

    {/* Barre de progression pipeline */}
    <View style={{ height: 3, backgroundColor: theme.border, borderRadius: 2, marginTop: 7, overflow: "hidden" }}>
      <View style={{
        height: 3,
        width: `${((STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0) / 4) * 100}%`,
        backgroundColor: STATUS_COLORS[contact.status as StatusKey]?.text ?? theme.primary,
        borderRadius: 2,
      }} />
    </View>
  </View>

  {/* Icône alerte si en retard */}
  {contact.next_follow_up && new Date(contact.next_follow_up) < new Date() && (
    <View style={{
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: "rgba(248,113,113,0.1)",
      borderWidth: 1, borderColor: "rgba(248,113,113,0.3)",
      alignItems: "center", justifyContent: "center",
    }}>
      <Feather name="alert-circle" size={14} color="#f87171" />
    </View>
  )}
</TouchableOpacity>
```

Retirer le wrapper card rouge autour de la section Today's Focus —
remplacer par un simple header sans card :

```tsx
{todayContacts.length > 0 && (
  <View>
    {/* Header section */}
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>
          Today's Focus
        </Text>
        {overdueFollowUps > 0 && (
          <View style={{
            backgroundColor: "rgba(248,113,113,0.12)",
            borderWidth: 1, borderColor: "rgba(248,113,113,0.3)",
            borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3,
            flexDirection: "row", alignItems: "center", gap: 4,
          }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#f87171" }}>
              {overdueFollowUps} URGENT
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity onPress={() => router.push("/(app)/contacts")}>
        <Text style={{ fontSize: 12, color: theme.textMuted }}>Voir tout →</Text>
      </TouchableOpacity>
    </View>

    {/* Liste contacts */}
    {todayContacts.map((contact) => (
      // ... card avec bordure gauche colorée (voir ci-dessus)
    ))}
  </View>
)}
```

---

### 4. Performance — plus grande, plus aérée

```tsx
<View style={{ flexDirection: "row", gap: 12 }}>
  {[
    { label: "CONTACTS ADDED", value: weeklyNewContacts, icon: "users",  color: theme.primary,  sub: "↑ This week" },
    { label: "NEW CLIENTS",    value: monthlyNewClients, icon: "star",   color: "#6ee7b7",      sub: "↑ This month" },
  ].map((stat) => (
    <View key={stat.label} style={{
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1, borderColor: theme.border,
      borderRadius: 18, padding: 16,
    }}>
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: `${stat.color}15`,
        alignItems: "center", justifyContent: "center",
        marginBottom: 12,
      }}>
        <Feather name={stat.icon as any} size={18} color={stat.color} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: "800", color: theme.textPrimary, lineHeight: 30, marginBottom: 4 }}>
        {stat.value}
      </Text>
      <Text style={{ fontSize: 10, color: theme.textHint, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 }}>
        {stat.label}
      </Text>
      <Text style={{ fontSize: 11, color: stat.color, fontWeight: "600" }}>
        {stat.sub}
      </Text>
    </View>
  ))}
</View>
```

---

### 5. Recent Activity — titre plus grand + items plus aérés

```tsx
{/* Titre section */}
<Text style={{ fontSize: 18, fontWeight: "700", color: theme.textPrimary, marginBottom: 12 }}>
  Recent Activity
</Text>

{/* Card activité */}
<Card>
  {recentActivity.slice(0, 4).map((item, i) => (
    <View key={item.id}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: theme.primaryBg,
          borderWidth: 1, borderColor: theme.primaryBorder,
          alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Feather name={INTERACTION_ICONS[item.type as InteractionType] as any} size={15} color={theme.primary} />
        </View>
        <View style={{ flex: 1, paddingTop: 2 }}>
          <Text style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 20 }}>
            {item.content}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>
      </View>
      {i < Math.min(recentActivity.length, 4) - 1 && (
        <View style={{ height: 1, backgroundColor: theme.border, marginLeft: 50 }} />
      )}
    </View>
  ))}
</Card>
```

---

### 6. Streak — plus compact, mieux intégré

Le bloc streak + stats actuel est bien mais les dots de la semaine
peuvent être légèrement plus grands :

```tsx
// Streak dots — augmenter la taille
width: "13%",   // au lieu de flex:1
height: 26,     // au lieu de aspectRatio:1
borderRadius: 8, // pill au lieu de cercle parfait
fontSize: 10,
```

---

## Critères de validation

- [ ] Gap entre toutes les sections du dashboard est de 20px minimum
- [ ] Pipeline : point coloré en haut + chiffre grand + label + barre en bas
- [ ] Today's Focus : cards individuelles avec bordure gauche colorée par statut
- [ ] Today's Focus : barre de progression dans chaque card contact
- [ ] La section Today's Focus n'a plus de wrapper card rouge
- [ ] Performance : icône dans carré + chiffre 28px + label + sous-label coloré
- [ ] Recent Activity : titre 18px + items avec plus de padding vertical
- [ ] Séparateurs dans Recent Activity avec indent (marginLeft: 50)
- [ ] Aucune régression fonctionnelle
- [ ] Aucune erreur TypeScript
