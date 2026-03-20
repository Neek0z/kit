# KIT — Redesign Contenu Instagram

## Contexte

L'écran contenu Instagram actuel est fonctionnel mais les cards prompts
sont trop denses et le header manque d'impact visuel.
On améliore la hiérarchie visuelle, les catégories et les cards.

---

## Problèmes actuels à corriger

1. Les catégories en chips sont trop larges et débordent
2. Les cards prompts affichent trop de texte d'un coup (mur de texte)
3. Le tuto "Comment utiliser" prend trop de place
4. Pas assez de distinction visuelle entre les catégories
5. Les boutons Copier/Gemini manquent de personnalité

---

## Ce que tu dois faire

### 1. Header avec stats

```tsx
<View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 }}>
  <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
    <View>
      <Text style={{ fontSize: 26, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>
        Contenu
      </Text>
      <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 3 }}>
        Prompts IA pour Instagram
      </Text>
    </View>
    {/* Badge Pro */}
    <View style={{
      backgroundColor: "rgba(251,191,36,0.1)",
      borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
      borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5,
      flexDirection: "row", alignItems: "center", gap: 4,
    }}>
      <Feather name="star" size={11} color="#fbbf24" />
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#fbbf24" }}>Pro</Text>
    </View>
  </View>
</View>
```

---

### 2. Banner tuto — compact et dismissible

Remplacer le grand bloc vert par une bannière compacte
qui peut être fermée une fois lue (stockée dans AsyncStorage) :

```tsx
const [showTutorial, setShowTutorial] = useState(true);

// Charger la préférence au démarrage
useEffect(() => {
  AsyncStorage.getItem("kit_content_tutorial_dismissed").then((val) => {
    if (val === "true") setShowTutorial(false);
  });
}, []);

const dismissTutorial = async () => {
  await AsyncStorage.setItem("kit_content_tutorial_dismissed", "true");
  setShowTutorial(false);
};

{showTutorial && (
  <View style={{
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: theme.primaryBg,
    borderWidth: 1, borderColor: theme.primaryBorder,
    borderRadius: 14, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 10,
  }}>
    <Text style={{ fontSize: 18 }}>💡</Text>
    <Text style={{ flex: 1, fontSize: 12, color: theme.textMuted, lineHeight: 17 }}>
      Copie un prompt → ouvre Gemini → colle → génère → partage
    </Text>
    <TouchableOpacity onPress={dismissTutorial}>
      <Feather name="x" size={16} color={theme.textHint} />
    </TouchableOpacity>
  </View>
)}
```

---

### 3. Catégories — grid 2x2 avec icônes au lieu de chips

Remplacer les chips horizontaux par une grille 2x2 de cards catégories
plus visuelles et impactantes :

```tsx
{/* Grille catégories */}
<View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
    {categories.map((cat) => {
      const isActive = displayedCategory === cat.id;
      return (
        <TouchableOpacity
          key={cat.id}
          onPress={() => setActiveCategory(cat.id)}
          style={{
            width: "47%",
            backgroundColor: isActive ? theme.primaryBg : theme.surface,
            borderWidth: 1,
            borderColor: isActive ? theme.primaryBorder : theme.border,
            borderRadius: 14,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: isActive
              ? theme.primary + "20"
              : theme.bg,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 12, fontWeight: "600",
              color: isActive ? theme.primary : theme.textPrimary,
            }} numberOfLines={2}>
              {cat.name}
            </Text>
            <Text style={{ fontSize: 10, color: theme.textHint, marginTop: 1 }}>
              {getPromptsByCategory(cat.id).length} prompts
            </Text>
          </View>
          {isActive && (
            <Feather name="check-circle" size={14} color={theme.primary} />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
</View>
```

---

### 4. Cards prompts redesignées — accordéon

Les cards prompts affichent seulement le titre par défaut.
On tape pour déplier et voir le prompt complet.
Ça évite le mur de texte :

```tsx
function PromptCard({ prompt }: { prompt: Prompt }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"fr" | "en">("fr");

  const currentPrompt = lang === "fr" ? prompt.prompt_fr : prompt.prompt_en;

  const handleCopy = async () => {
    const Clipboard = require("@react-native-clipboard/clipboard").default;
    await Clipboard.setString(currentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGemini = () => {
    Linking.openURL("https://gemini.google.com");
  };

  return (
    <View style={{
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: expanded ? theme.primaryBorder : theme.border,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 8,
    }}>
      {/* Header card — toujours visible */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: "row", alignItems: "center",
          padding: 14, gap: 12,
        }}
        activeOpacity={0.7}
      >
        {/* Numéro ou icône */}
        <View style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: expanded ? theme.primaryBg : theme.bg,
          borderWidth: 1,
          borderColor: expanded ? theme.primaryBorder : theme.border,
          alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Feather
            name="image"
            size={16}
            color={expanded ? theme.primary : theme.textHint}
          />
        </View>

        <Text style={{
          flex: 1, fontSize: 14, fontWeight: "600",
          color: theme.textPrimary,
        }}>
          {prompt.title}
        </Text>

        {/* Toggle FR/EN compact */}
        <View style={{
          flexDirection: "row",
          backgroundColor: theme.bg,
          borderRadius: 8, borderWidth: 1, borderColor: theme.border,
          overflow: "hidden", marginRight: 6,
        }}>
          {(["fr", "en"] as const).map((l) => (
            <TouchableOpacity
              key={l}
              onPress={(e) => { e.stopPropagation?.(); setLang(l); }}
              style={{
                paddingHorizontal: 8, paddingVertical: 3,
                backgroundColor: lang === l ? theme.primaryBg : "transparent",
              }}
            >
              <Text style={{
                fontSize: 10, fontWeight: "700",
                color: lang === l ? theme.primary : theme.textHint,
                textTransform: "uppercase",
              }}>
                {l}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={theme.textHint}
        />
      </TouchableOpacity>

      {/* Contenu déplié */}
      {expanded && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          {/* Séparateur */}
          <View style={{ height: 1, backgroundColor: theme.border, marginBottom: 12 }} />

          {/* Texte du prompt */}
          <Text style={{
            fontSize: 13, color: theme.textMuted,
            lineHeight: 20, marginBottom: 10,
          }}>
            {currentPrompt}
          </Text>

          {/* Tip */}
          {prompt.tip && (
            <View style={{
              backgroundColor: "rgba(251,191,36,0.08)",
              borderRadius: 10, padding: 10,
              flexDirection: "row", gap: 8,
              marginBottom: 12,
            }}>
              <Text style={{ fontSize: 14 }}>💡</Text>
              <Text style={{ fontSize: 12, color: "#fbbf24", lineHeight: 17, flex: 1 }}>
                {prompt.tip}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={handleCopy}
              style={{
                flex: 1, flexDirection: "row", alignItems: "center",
                justifyContent: "center", gap: 6,
                paddingVertical: 10, borderRadius: 10,
                backgroundColor: copied ? theme.primaryBg : theme.bg,
                borderWidth: 1,
                borderColor: copied ? theme.primaryBorder : theme.border,
              }}
            >
              <Feather
                name={copied ? "check" : "copy"}
                size={14}
                color={copied ? theme.primary : theme.textMuted}
              />
              <Text style={{
                fontSize: 12, fontWeight: "600",
                color: copied ? theme.primary : theme.textMuted,
              }}>
                {copied ? "Copié !" : "Copier"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenGemini}
              style={{
                paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 10, borderWidth: 1, borderColor: theme.border,
                flexDirection: "row", alignItems: "center", gap: 6,
                backgroundColor: theme.bg,
              }}
            >
              <Text style={{ fontSize: 13 }}>✨</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted }}>
                Gemini
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
```

---

### 5. Layout général de l'écran

```tsx
export default function ContentScreen() {
  const theme = useTheme();
  const { isPro } = useSubscription();
  const { categories, loading, getPromptsByCategory } = usePrompts();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const displayedCategory = activeCategory ?? categories[0]?.id;
  const displayedPrompts = displayedCategory
    ? getPromptsByCategory(displayedCategory)
    : [];

  // Paywall si pas Pro
  if (!isPro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 22,
            backgroundColor: "rgba(251,191,36,0.1)",
            borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: 32 }}>📸</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary, textAlign: "center", letterSpacing: -0.5 }}>
            Contenu Instagram Pro
          </Text>
          <Text style={{ fontSize: 14, color: theme.textMuted, textAlign: "center", lineHeight: 21 }}>
            Accède à notre bibliothèque de prompts IA pour créer du contenu professionnel en quelques secondes.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            style={{
              backgroundColor: theme.primaryBg,
              borderWidth: 1, borderColor: theme.primaryBorder,
              borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14,
            }}
          >
            <Text style={{ color: theme.primary, fontWeight: "700", fontSize: 15 }}>
              Passer à Pro →
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        {/* ... voir section 1 */}

        {/* Banner tuto dismissible */}
        {/* ... voir section 2 */}

        {/* Grille catégories 2x2 */}
        {/* ... voir section 3 */}

        {/* Titre section prompts */}
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: theme.textPrimary }}>
            {categories.find((c) => c.id === displayedCategory)?.name ?? "Prompts"}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
            {displayedPrompts.length} prompt{displayedPrompts.length > 1 ? "s" : ""} disponible{displayedPrompts.length > 1 ? "s" : ""}
          </Text>
        </View>

        {/* Liste prompts accordéon */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          {displayedPrompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Critères de validation

- [ ] Le header affiche "Contenu" + badge Pro ambre
- [ ] La bannière tuto est dismissible et ne réapparaît pas après fermeture
- [ ] Les catégories sont en grille 2x2 avec emoji + nom + compteur de prompts
- [ ] La catégorie active a une bordure verte et une icône check
- [ ] Les cards prompts sont repliées par défaut (titre seulement)
- [ ] Tap sur une card déploie le prompt complet
- [ ] Le toggle FR/EN est dans le header de chaque card
- [ ] Le tip s'affiche en ambre dans la card dépliée
- [ ] "Copié !" s'affiche 2 secondes après la copie
- [ ] Le bouton Gemini ouvre gemini.google.com
- [ ] Le paywall s'affiche si pas Pro
- [ ] Aucune régression fonctionnelle
- [ ] Aucune erreur TypeScript
