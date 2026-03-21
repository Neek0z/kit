# KIT — Redesign UI Global inspiré Sleek

## Contexte

App mobile React Native, Expo SDK 54, NativeWind, Supabase, Stripe.
Code dans le dossier `kit/`.
Les sessions 1, 2 et 3 de refacto ont été complétées — le code est propre.

Tu vas maintenant faire un redesign UI complet de l'app en t'inspirant
du style Sleek.design tel que décrit ci-dessous et sur l'image.

---

## Style de référence Sleek

**Palette**
- Fond principal : `#f8f9fb` (gris très clair warm, pas blanc pur)
- Cards : `#ffffff` (blanc pur avec légère ombre)
- Accent principal : `#10b981` (vert émeraude — légèrement plus saturé que l'actuel)
- Texte principal : `#0f172a`
- Texte secondaire : `#64748b`
- Texte hint : `#94a3b8`
- Danger : `#f87171`
- Warning : `#fbbf24`
- Accent indigo : `#818cf8`

**Typographie**
- Titres écran : `fontSize: 28-32`, `fontWeight: "800"`, `letterSpacing: -1`
- Titres section : `fontSize: 17-18`, `fontWeight: "700"`
- Sous-titres section : `fontSize: 11`, uppercase, `letterSpacing: 1`, `fontWeight: "600"`
- Body : `fontSize: 14`, weight 400
- Small : `fontSize: 12`, weight 400

**Spacing — PLUS AÉRÉ que l'actuel**
- Padding horizontal écran : `20`
- Gap entre sections : `24` minimum
- Padding card : `16`
- Gap entre items de liste : `12`

**Cards**
- `backgroundColor: "#ffffff"`
- `borderRadius: 16`
- `shadowColor: "#000"`, `shadowOffset: {width:0, height:2}`, `shadowOpacity: 0.06`, `shadowRadius: 8`, `elevation: 2`
- Pas de border visible en light mode — la shadow suffit

**Boutons action rapide**
- Fond coloré (pas outline) : `backgroundColor: color`, `borderRadius: 100` (pill)
- Texte blanc ou foncé selon la couleur

**Avatars**
- Fond coloré selon statut du contact
- Initiales en blanc bold
- Taille `md` : 44x44, `sm` : 32x32, `lg` : 64x64

**Barres de progression**
- Hauteur : `3`
- Multi-segment : une couleur par statut pipeline
- Fond : `#e2e8f0`

**FAB (Floating Action Button)**
- `backgroundColor: "#10b981"`
- `width: 56`, `height: 56`, `borderRadius: 28`
- Shadow verte
- Icône `+` blanche, taille 26

---

## ÉCRAN 1 — Dashboard (app/(app)/index.tsx)

### Layout

```
SafeAreaView
  └── ScrollView
        ├── Header (greeting + avatar)
        ├── Citation motivationnelle
        ├── Raccourcis rapides (3 pills)
        ├── Pipeline (chiffres par statut)
        ├── Today's Focus
        ├── Performance
        └── Recent Activity
```

### Header

```tsx
<View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
  <View>
    <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 4 }}>
      {getGreeting()}, {firstName}
    </Text>
    <Text style={{ fontSize: 30, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>
      Dashboard
    </Text>
  </View>
  {/* Avatar utilisateur */}
  <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#10b981", alignItems: "center", justifyContent: "center" }}>
    <Text style={{ fontSize: 16, fontWeight: "800", color: "#fff" }}>
      {firstName?.[0]?.toUpperCase()}
    </Text>
  </View>
</View>
```

Créer `getGreeting()` :
```ts
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
```

### Citation motivationnelle

```tsx
<Text style={{ fontSize: 13, color: theme.textMuted, fontStyle: "italic", paddingHorizontal: 20, marginBottom: 16 }}>
  "{todayQuote}"
</Text>
```

### Raccourcis rapides (pills colorés, fond plein)

```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 20 }}>
  {[
    { label: "New Contact", icon: "user-plus", bg: "#10b981", fg: "#fff", route: "/(app)/contacts/new" },
    { label: "Follow-up",   icon: "bell",      bg: "#fef3c7", fg: "#92400e", route: "/(app)/contacts" },
    { label: "Message",     icon: "message-circle", bg: "#ede9fe", fg: "#5b21b6", route: "/(app)/messages" },
  ].map((btn) => (
    <TouchableOpacity
      key={btn.label}
      onPress={() => router.push(btn.route as AppRoute)}
      style={{
        flexDirection: "row", alignItems: "center", gap: 7,
        backgroundColor: btn.bg,
        borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10,
      }}
    >
      <Feather name={btn.icon as FeatherIconName} size={14} color={btn.fg} />
      <Text style={{ fontSize: 13, fontWeight: "600", color: btn.fg }}>{btn.label}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

### Pipeline

```tsx
<View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
    <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary }}>Pipeline</Text>
    <TouchableOpacity onPress={() => router.push("/(app)/contacts" as AppRoute)}>
      <Text style={{ fontSize: 13, color: "#10b981", fontWeight: "600" }}>View All ›</Text>
    </TouchableOpacity>
  </View>
  <View style={{ flexDirection: "row", gap: 8 }}>
    {PIPELINE_STATUSES.map((s) => (
      <TouchableOpacity key={s.key} style={{
        flex: 1, backgroundColor: "#fff", borderRadius: 14,
        padding: 10, alignItems: "flex-start",
        shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
      }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color, marginBottom: 8 }} />
        <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary, lineHeight: 24, marginBottom: 4 }}>
          {byStatus[s.key] ?? 0}
        </Text>
        <Text style={{ fontSize: 9, fontWeight: "600", color: theme.textHint, letterSpacing: 0.5 }} numberOfLines={1}>
          {s.label.toUpperCase()}
        </Text>
        <View style={{ height: 2, width: "100%", backgroundColor: s.color, borderRadius: 1, marginTop: 8, opacity: 0.6 }} />
      </TouchableOpacity>
    ))}
  </View>
</View>
```

### Today's Focus — cards avec bordure gauche colorée

```tsx
<View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary }}>Today's Focus</Text>
      {overdueCount > 0 && (
        <View style={{ backgroundColor: "#fef2f2", borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#ef4444" }}>{overdueCount} URGENT</Text>
        </View>
      )}
    </View>
    <TouchableOpacity onPress={() => router.push("/(app)/contacts" as AppRoute)}>
      <Text style={{ fontSize: 13, color: theme.textMuted }}>View all ›</Text>
    </TouchableOpacity>
  </View>

  {todayContacts.map((contact) => {
    const statusColor = STATUS_COLORS[contact.status as StatusKey]?.text ?? "#10b981";
    const isOverdue = contact.next_follow_up && new Date(contact.next_follow_up) < new Date();
    const progress = (STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0) / 4;

    return (
      <TouchableOpacity
        key={contact.id}
        onPress={() => router.push(`/(app)/contacts/${contact.id}` as AppRoute)}
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 14,
          marginBottom: 10,
          borderLeftWidth: 3,
          borderLeftColor: statusColor,
          shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Avatar name={contact.full_name} status={contact.status} size="md" url={contact.avatar_url} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textPrimary, marginBottom: 2 }}>
              {contact.full_name}
            </Text>
            <Text style={{ fontSize: 12, color: isOverdue ? "#ef4444" : theme.textMuted }}>
              {isOverdue
                ? `Overdue Follow-up · ${new Date(contact.next_follow_up!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                : "Due today"
              }
            </Text>
            {/* Barre progression multi-segment */}
            <View style={{ flexDirection: "row", gap: 3, marginTop: 8 }}>
              {[0,1,2,3,4].map((i) => (
                <View key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  backgroundColor: i <= (STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0)
                    ? statusColor
                    : "#e2e8f0",
                }} />
              ))}
            </View>
          </View>
          {/* Action rapide */}
          {contact.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="phone" size={15} color="#10b981" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  })}
</View>
```

### Performance

```tsx
<View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
  <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary, marginBottom: 14 }}>Performance</Text>
  <View style={{ flexDirection: "row", gap: 12 }}>
    {[
      { label: "CONTACTS ADDED", value: weeklyNewContacts,  icon: "users", color: "#10b981", sub: "↑ This week" },
      { label: "NEW CLIENTS",    value: monthlyNewClients,  icon: "star",  color: "#818cf8", sub: "↑ This month" },
    ].map((stat) => (
      <View key={stat.label} style={{
        flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 16,
        shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
      }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${stat.color}15`, alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Feather name={stat.icon as FeatherIconName} size={18} color={stat.color} />
        </View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.textPrimary, lineHeight: 30, marginBottom: 4 }}>{stat.value}</Text>
        <Text style={{ fontSize: 10, color: theme.textHint, fontWeight: "600", letterSpacing: 0.5, marginBottom: 4 }}>{stat.label}</Text>
        <Text style={{ fontSize: 12, color: stat.color, fontWeight: "600" }}>{stat.sub}</Text>
      </View>
    ))}
  </View>
</View>
```

### Recent Activity

```tsx
<View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
  <Text style={{ fontSize: 17, fontWeight: "700", color: theme.textPrimary, marginBottom: 14 }}>Recent Activity</Text>
  <View style={{ backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
    {recentActivity.slice(0, 4).map((item, i) => (
      <View key={item.id}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Feather name={INTERACTION_ICONS[item.type as InteractionType] as FeatherIconName} size={15} color="#10b981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: theme.textPrimary, lineHeight: 20 }}>{item.content}</Text>
            <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 3 }}>{formatRelativeTime(item.created_at)}</Text>
          </View>
        </View>
        {i < 3 && <View style={{ height: 1, backgroundColor: "#f1f5f9", marginLeft: 62 }} />}
      </View>
    ))}
  </View>
</View>
```

---

## ÉCRAN 2 — Liste Contacts (app/(app)/contacts/index.tsx)

### Layout général

```tsx
<SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fb" }}>
  {/* Header */}
  <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
    <Text style={{ fontSize: 30, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>
      Contacts
    </Text>
  </View>

  {/* Search bar */}
  {/* Filtre tabs : All Contacts | My Team */}
  {/* FlatList contacts */}
  
  {/* FAB */}
  <TouchableOpacity
    onPress={() => router.push("/(app)/contacts/new" as AppRoute)}
    style={{
      position: "absolute", bottom: 24, right: 20,
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: "#10b981",
      alignItems: "center", justifyContent: "center",
      shadowColor: "#10b981", shadowOffset: {width:0,height:6}, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    }}
  >
    <Feather name="plus" size={26} color="#fff" />
  </TouchableOpacity>
</SafeAreaView>
```

### Search bar

```tsx
<View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, shadowColor: "#000", shadowOffset: {width:0,height:1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
    <Feather name="search" size={16} color={theme.textMuted} />
    <TextInput
      placeholder="Search by name, tag, or stage..."
      placeholderTextColor={theme.textHint}
      style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}
      value={search}
      onChangeText={setSearch}
    />
    {search.length > 0 && (
      <TouchableOpacity onPress={() => setSearch("")}>
        <Feather name="x" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    )}
  </View>
</View>
```

### Filtres tabs (All Contacts | My Team)

```tsx
<View style={{ flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 8 }}>
  {["All Contacts", "My Team"].map((tab) => (
    <TouchableOpacity
      key={tab}
      onPress={() => setActiveFilter(tab)}
      style={{
        paddingHorizontal: 18, paddingVertical: 10,
        borderRadius: 100,
        backgroundColor: activeFilter === tab ? "#10b981" : "#fff",
        shadowColor: "#000", shadowOffset: {width:0,height:1}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: activeFilter === tab ? "#fff" : theme.textMuted }}>
        {tab}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

### ContactCard redesigné

Dans `components/contacts/ContactCard.tsx` :

```tsx
const ContactCard = React.memo(function ContactCard({ contact, pendingCount = 0, onPress }: ContactCardProps) {
  const theme = useTheme();
  const statusColor = STATUS_COLORS[contact.status as StatusKey]?.text ?? "#10b981";
  const isOverdue = contact.next_follow_up && new Date(contact.next_follow_up) < new Date();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 10,
        shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar name={contact.full_name} status={contact.status} size="md" url={contact.avatar_url} />
        
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: theme.textPrimary }}>{contact.full_name}</Text>
            {pendingCount > 0 && (
              <View style={{ backgroundColor: "#f0fdf4", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: "#10b981" }}>{pendingCount}</Text>
              </View>
            )}
          </View>
          
          <Text style={{ fontSize: 12, color: isOverdue ? "#ef4444" : theme.textMuted, marginBottom: 8 }}>
            {isOverdue
              ? `Overdue · ${new Date(contact.next_follow_up!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
              : contact.phone ?? "Aucun numéro"
            }
          </Text>
          
          {/* Barre progression multi-segment */}
          <View style={{ flexDirection: "row", gap: 3 }}>
            {[0,1,2,3,4].map((i) => (
              <View key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                backgroundColor: i <= (STATUS_PROGRESS[contact.status as PipelineStatus] ?? 0)
                  ? statusColor
                  : "#e2e8f0",
              }} />
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={{ flexDirection: "column", gap: 8 }}>
          {contact.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="phone" size={13} color="#10b981" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onPress}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="chevron-right" size={13} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});
```

---

## ÉCRAN 3 — Fiche Contact (app/(app)/contacts/[id].tsx)

### Hero section

```tsx
{/* Header */}
<View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
  <TouchableOpacity onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
    <Feather name="chevron-left" size={20} color={theme.textPrimary} />
  </TouchableOpacity>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
      <Feather name="star" size={18} color="#fbbf24" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => router.push(`/(app)/contacts/${id}/edit` as AppRoute)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 }}>
      <Feather name="edit-2" size={16} color={theme.textPrimary} />
    </TouchableOpacity>
  </View>
</View>

{/* Avatar + infos */}
<View style={{ alignItems: "center", paddingVertical: 20 }}>
  <Avatar name={contact.full_name} status={contact.status} size="lg" url={contact.avatar_url} />
  <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary, marginTop: 12, letterSpacing: -0.5 }}>
    {contact.full_name}
  </Text>
  {contact.notes && (
    <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4, textAlign: "center", paddingHorizontal: 32 }} numberOfLines={1}>
      {contact.notes}
    </Text>
  )}
  <StatusPill status={contact.status} />
</View>

{/* 4 boutons action */}
<View style={{ flexDirection: "row", justifyContent: "center", gap: 16, paddingHorizontal: 20, paddingBottom: 20 }}>
  {[
    { label: "Call",  icon: "phone",          color: "#10b981", bg: "#f0fdf4", onPress: handleCall,       show: !!contact.phone },
    { label: "Chat",  icon: "message-circle",  color: "#818cf8", bg: "#f5f3ff", onPress: handleWhatsApp,   show: !!contact.phone },
    { label: "Plan",  icon: "calendar",        color: "#f59e0b", bg: "#fffbeb", onPress: handleCreateAppt, show: true },
    { label: "More",  icon: "more-horizontal",  color: "#64748b", bg: "#f8fafc", onPress: () => {},         show: true },
  ].filter(b => b.show).map((btn) => (
    <TouchableOpacity key={btn.label} onPress={btn.onPress} style={{ alignItems: "center", gap: 6 }}>
      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: btn.bg, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }}>
        <Feather name={btn.icon as FeatherIconName} size={20} color={btn.color} />
      </View>
      <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "500" }}>{btn.label}</Text>
    </TouchableOpacity>
  ))}
</View>
```

### Workflow / Onboarding Journey (si client)

```tsx
{isClient && workflowTasks.length > 0 && (
  <View style={{ marginHorizontal: 20, marginBottom: 16, backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary }}>Onboarding Journey</Text>
      <Text style={{ fontSize: 12, color: "#10b981", fontWeight: "600" }}>
        STAGE {completedWorkflowCount} OF {workflowTasks.length}
      </Text>
    </View>
    {/* Barre progression */}
    <View style={{ height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginBottom: 10 }}>
      <View style={{ height: 6, width: `${(completedWorkflowCount/workflowTasks.length)*100}%`, backgroundColor: "#10b981", borderRadius: 3 }} />
    </View>
    {/* Prochaine étape */}
    {nextWorkflowTask && (
      <Text style={{ fontSize: 12, color: theme.textMuted }}>
        Next: <Text style={{ fontWeight: "600", color: theme.textPrimary }}>{nextWorkflowTask.title}</Text>
      </Text>
    )}
  </View>
)}
```

### Onglets

Garder les onglets existants (Infos, Groupes, Tâches, Workflow, Relance, Historique)
mais les styliser :

```tsx
<View style={{ borderBottomWidth: 1, borderBottomColor: "#f1f5f9", backgroundColor: "#fff" }}>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}>
    {tabs.map((tab) => {
      const isActive = activeTab === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          onPress={() => setActiveTab(tab.key)}
          style={{
            paddingHorizontal: 16, paddingVertical: 14,
            borderBottomWidth: 2,
            borderBottomColor: isActive ? "#10b981" : "transparent",
            marginBottom: -1,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: isActive ? "700" : "500", color: isActive ? "#10b981" : theme.textMuted }}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
</View>
```

---

## RÈGLES GLOBALES à appliquer sur TOUS les écrans

1. **Fond** : `backgroundColor: "#f8f9fb"` sur tous les `SafeAreaView`
2. **Cards** : `backgroundColor: "#fff"` + shadow douce (pas de border en light mode)
3. **Accent** : Remplacer `#6ee7b7` par `#10b981` comme couleur principale dans `theme.ts` pour le light mode
4. **Spacing** : `paddingHorizontal: 20` partout, `gap: 24` entre sections
5. **FAB** : Remplacer le bouton `+` dans le header par un FAB sur tous les écrans liste
6. **Shadows** : `shadowColor: "#000", shadowOffset: {width:0,height:2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2` sur toutes les cards
7. **Titres** : `fontSize: 28-30, fontWeight: "800", letterSpacing: -1`
8. **Sections** : Titres de section en `fontSize: 17, fontWeight: "700"` (pas uppercase)
9. **Ligne décorative** : Retirer la ligne décorative verte en haut des écrans — elle ne correspond pas au style Sleek
10. **Tab bar** : fond `#fff`, bordure top `#f1f5f9`, icône active `#10b981`

---

## Validation

Après toutes les modifications :
1. Lance `npx tsc --noEmit`
2. Vérifie que l'app se lance sans crash
3. Prends des screenshots des écrans modifiés et liste-les
4. Liste tous les fichiers modifiés
5. Signale les décisions prises et les cas ambigus
