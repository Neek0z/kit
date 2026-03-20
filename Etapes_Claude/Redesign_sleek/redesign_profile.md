# KIT — Redesign Profil

## Contexte

L'écran profil actuel est trop générique.
On le redesigne avec un hero plus impactant, des stats utilisateur,
et des sections settings plus lisibles.

---

## Problèmes actuels à corriger

1. Le hero (photo + nom + email) manque de personnalité
2. Pas de stats sur l'utilisation de l'app
3. Les sections settings sont trop basiques visuellement
4. Le badge Pro/Free manque d'impact

---

## Ce que tu dois faire

### 1. Hero section redesigné

```tsx
{/* Hero */}
<View style={{ alignItems: "center", paddingTop: 24, paddingBottom: 20, paddingHorizontal: 20 }}>

  {/* Avatar avec bouton caméra */}
  <TouchableOpacity onPress={handleAvatarPress} style={{ position: "relative", marginBottom: 14 }}>
    {uploading ? (
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    ) : (
      <Avatar name={profile?.full_name ?? user?.email} url={profile?.avatar_url} size="lg" />
    )}
    <View style={{
      position: "absolute", bottom: 0, right: 0,
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: theme.primary,
      borderWidth: 2, borderColor: theme.bg,
      alignItems: "center", justifyContent: "center",
    }}>
      <Feather name="camera" size={12} color={theme.isDark ? "#0f172a" : "#ffffff"} />
    </View>
  </TouchableOpacity>

  {/* Nom */}
  <Text style={{ fontSize: 20, fontWeight: "800", color: theme.textPrimary, letterSpacing: -0.5, marginBottom: 4 }}>
    {profile?.full_name ?? "Mon profil"}
  </Text>

  {/* Email */}
  <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 12 }}>
    {user?.email}
  </Text>

  {/* Badge plan */}
  <TouchableOpacity
    onPress={() => router.push("/(app)/subscription")}
    style={{
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 14, paddingVertical: 7,
      borderRadius: 100,
      backgroundColor: isPro ? "rgba(251,191,36,0.1)" : theme.primaryBg,
      borderWidth: 1,
      borderColor: isPro ? "rgba(251,191,36,0.3)" : theme.primaryBorder,
    }}
  >
    <Feather name={isPro ? "star" : "zap"} size={13} color={isPro ? "#fbbf24" : theme.primary} />
    <Text style={{
      fontSize: 12, fontWeight: "700",
      color: isPro ? "#fbbf24" : theme.primary,
    }}>
      {isPro ? "Plan Pro ✨" : "Plan Free · Passer à Pro"}
    </Text>
    {!isPro && <Feather name="chevron-right" size={13} color={theme.primary} />}
  </TouchableOpacity>
</View>
```

---

### 2. Stats utilisateur

Ajouter un bloc stats compact sous le hero :

```tsx
{/* Stats */}
<View style={{ flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 20 }}>
  {[
    { label: "Contacts",     value: totalContacts,           icon: "users" },
    { label: "Clients",      value: byStatus.client ?? 0,    icon: "star" },
    { label: "Interactions", value: totalInteractions,       icon: "activity" },
  ].map((stat) => (
    <View key={stat.label} style={{
      flex: 1,
      backgroundColor: theme.surface,
      borderWidth: 1, borderColor: theme.border,
      borderRadius: 14, padding: 12,
      alignItems: "center", gap: 4,
    }}>
      <Text style={{ fontSize: 20, fontWeight: "800", color: theme.textPrimary }}>
        {stat.value}
      </Text>
      <Text style={{ fontSize: 10, color: theme.textMuted, textAlign: "center" }}>
        {stat.label}
      </Text>
    </View>
  ))}
</View>
```

Ajouter dans `useDashboard` :
```ts
// Compter le total des interactions
const { data: interactionsCount } = await supabase
  .from("interactions")
  .select("id", { count: "exact" })
  .eq("user_id", user.id);

const totalInteractions = interactionsCount?.length ?? 0;
```

---

### 3. Sections settings redesignées

Chaque section a un label uppercase et des rows avec icônes colorées :

```tsx
// Composant SettingsRow réutilisable
function SettingsRow({
  icon,
  iconColor,
  label,
  subtitle,
  value,
  onPress,
  rightElement,
  danger = false,
}: {
  icon: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  const theme = useTheme();
  const color = danger ? "#f87171" : iconColor ?? theme.textMuted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 4 }}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={{
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: danger ? "rgba(248,113,113,0.1)" : `${color}15`,
        alignItems: "center", justifyContent: "center",
      }}>
        <Feather name={icon as any} size={15} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "500", color: danger ? "#f87171" : theme.textPrimary }}>
          {label}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>{subtitle}</Text>
        )}
      </View>
      {value && (
        <Text style={{ fontSize: 13, color: theme.textMuted }}>{value}</Text>
      )}
      {rightElement}
      {onPress && !rightElement && (
        <Feather name="chevron-right" size={15} color={theme.textHint} />
      )}
    </TouchableOpacity>
  );
}

// Composant SettingsSection
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 11, color: theme.textHint,
        textTransform: "uppercase", letterSpacing: 0.8,
        fontWeight: "600", marginBottom: 6,
        paddingHorizontal: 20,
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: theme.surface,
        borderWidth: 1, borderColor: theme.border,
        borderRadius: 16,
        marginHorizontal: 20,
        paddingHorizontal: 10,
      }}>
        {children}
      </View>
    </View>
  );
}
```

---

### 4. Layout complet du profil

```tsx
export default function ProfileScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuthContext();
  const { profile, loading, uploadAvatar } = useProfile();
  const { isPro } = useSubscription();
  const { totalContacts, byStatus } = useDashboard();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero */}
        {/* ... voir section 1 */}

        {/* Stats */}
        {/* ... voir section 2 */}

        {/* Section Mon compte */}
        <SettingsSection title="Mon compte">
          <SettingsRow
            icon="user"
            iconColor={theme.primary}
            label="Modifier le profil"
            onPress={() => router.push("/(app)/profile/edit")}
          />
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <SettingsRow
            icon="zap"
            iconColor={isPro ? "#fbbf24" : theme.primary}
            label="Abonnement"
            value={isPro ? "Pro ✨" : "Free"}
            onPress={() => router.push("/(app)/subscription")}
          />
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <SettingsRow
            icon="users"
            iconColor="#818cf8"
            label="Mes groupes"
            onPress={() => router.push("/(app)/groups")}
          />
        </SettingsSection>

        {/* Section Apparence */}
        <SettingsSection title="Apparence">
          <SettingsRow
            icon="moon"
            iconColor="#818cf8"
            label="Mode sombre"
            subtitle="Utiliser le thème sombre"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#f1f5f9"
              />
            }
          />
        </SettingsSection>

        {/* Section Notifications & Workflow */}
        <SettingsSection title="Notifications & Workflow">
          <SettingsRow
            icon="bell"
            iconColor="#fbbf24"
            label="Paramètres de rappels"
            onPress={() => router.push("/(app)/profile/notifications")}
          />
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <SettingsRow
            icon="git-branch"
            iconColor="#6ee7b7"
            label="Workflow client"
            onPress={() => router.push("/(app)/profile/workflow")}
          />
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <SettingsRow
            icon="calendar"
            iconColor="#38bdf8"
            label="Synchronisation calendrier"
            onPress={() => router.push("/(app)/profile/calendar")}
          />
        </SettingsSection>

        {/* Section Mes données */}
        <SettingsSection title="Mes données">
          <SettingsRow
            icon="download"
            iconColor={theme.primary}
            label="Exporter mes contacts"
            subtitle={isPro ? undefined : "Pro uniquement"}
            onPress={() => isPro ? router.push("/(app)/profile/export") : router.push("/(app)/subscription")}
          />
        </SettingsSection>

        {/* Section À propos */}
        <SettingsSection title="À propos">
          <SettingsRow
            icon="info"
            iconColor={theme.textHint}
            label="Version"
            value="1.0.0"
          />
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <SettingsRow
            icon="shield"
            iconColor={theme.textHint}
            label="Politique de confidentialité"
            onPress={() => Linking.openURL("https://kit.app/privacy")}
          />
        </SettingsSection>

        {/* Actions compte */}
        <View style={{ marginHorizontal: 20, marginBottom: 32, gap: 8 }}>
          <TouchableOpacity
            onPress={handleSignOut}
            style={{
              backgroundColor: theme.surface,
              borderWidth: 1, borderColor: theme.border,
              borderRadius: 14, padding: 14,
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Feather name="log-out" size={16} color="#f87171" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#f87171" }}>
              Se déconnecter
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={{ padding: 12, alignItems: "center" }}
          >
            <Text style={{ fontSize: 13, color: theme.textHint }}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Critères de validation

- [ ] Le hero affiche avatar + nom + email + badge plan cliquable
- [ ] Le badge Pro est ambre, le badge Free est vert avec flèche
- [ ] Les 3 stats (Contacts, Clients, Interactions) s'affichent sous le hero
- [ ] Chaque row settings a une icône colorée dans un carré arrondi
- [ ] Le toggle dark mode fonctionne
- [ ] Toutes les navigations existantes fonctionnent
- [ ] Le bouton Se déconnecter est rouge avec icône
- [ ] Supprimer mon compte est discret en bas
- [ ] Aucune régression fonctionnelle
- [ ] Aucune erreur TypeScript
