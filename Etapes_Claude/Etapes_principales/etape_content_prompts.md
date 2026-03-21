# KIT — Bibliothèque de prompts Instagram (Feature Pro)

## Contexte

On ajoute une section "Créer du contenu" réservée aux utilisateurs Pro.
Elle contient une bibliothèque de prompts prêts à l'emploi pour générer
des visuels Instagram avec Gemini/ChatGPT, organisés par catégorie,
avec des conseils d'utilisation. Aucune API externe — c'est du contenu statique.

---

## Ce que tu dois faire

### 1. Nouvelle table Supabase — prompt_categories et prompts

```sql
create table public.prompt_categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  emoji text not null,
  description text,
  sort_order integer default 0
);

create table public.prompts (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.prompt_categories on delete cascade not null,
  title text not null,
  prompt_fr text not null,
  prompt_en text not null,
  tip text,
  tool text default 'gemini' not null,
  sort_order integer default 0
);

-- RLS public en lecture seule (pas besoin d'auth pour lire les prompts)
alter table public.prompt_categories enable row level security;
alter table public.prompts enable row level security;

create policy "Anyone can read prompt categories"
  on public.prompt_categories for select using (true);

create policy "Anyone can read prompts"
  on public.prompts for select using (true);
```

### 2. Seed — insérer les catégories et prompts

```sql
-- Catégories
insert into public.prompt_categories (name, emoji, description, sort_order) values
  ('Visuels produits', '📸', 'Photos lifestyle et packshots pour tes produits', 0),
  ('Citations mindset', '💬', 'Visuels motivationnels et citations inspirantes', 1),
  ('Recrutement MLM', '🤝', 'Contenu pour attirer de nouveaux partenaires', 2),
  ('Résultats & preuves', '🏆', 'Mets en avant tes résultats et témoignages', 3);

-- Récupérer les IDs des catégories pour les inserts suivants
-- (exécuter séparément après les catégories)

-- VISUELS PRODUITS
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Flatlay minimaliste bien-être',
  'Crée une photo flatlay minimaliste de produits bien-être (compléments alimentaires, huiles essentielles, ou crèmes). Fond blanc ou beige clair, lumière naturelle douce, quelques feuilles vertes ou fleurs séchées comme décoration, composition épurée et aérée, style Instagram premium, ratio 1:1.',
  'Create a minimalist flatlay photo of wellness products (supplements, essential oils, or creams). White or light beige background, soft natural light, a few green leaves or dried flowers as decoration, clean and airy composition, premium Instagram style, 1:1 ratio.',
  'Ajoute le nom de ton produit spécifique pour un résultat plus précis. Ex: remplace "produits bien-être" par "collagène en poudre".',
  'gemini',
  0
from public.prompt_categories where name = 'Visuels produits';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Morning routine premium',
  'Photo lifestyle d''une morning routine saine et équilibrée : tasse de café ou thé fumant, carnet de notes ouvert, produits bien-être posés élégamment sur une table en bois clair. Lumière du matin dorée, ambiance cosy et inspirante, couleurs chaudes et naturelles, style de vie aspirationnel, format portrait 4:5.',
  'Lifestyle photo of a healthy and balanced morning routine: steaming cup of coffee or tea, open notebook, wellness products elegantly placed on a light wood table. Golden morning light, cozy and inspiring atmosphere, warm and natural colors, aspirational lifestyle, 4:5 portrait format.',
  'Personnalise avec tes vrais produits pour plus d''authenticité. Tu peux aussi préciser ta palette de couleurs de marque.',
  'gemini',
  1
from public.prompt_categories where name = 'Visuels produits';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Packshot élégant fond épuré',
  'Photo packshot professionnel d''un flacon ou packaging de produit bien-être. Fond blanc pur ou fond de couleur pastel (rose pâle, vert menthe ou lavande), éclairage studio doux avec légère ombre portée, reflets subtils, rendu luxe et soigné, style e-commerce haut de gamme, ratio 1:1.',
  'Professional packshot photo of a wellness product bottle or packaging. Pure white background or pastel colored background (pale pink, mint green or lavender), soft studio lighting with slight drop shadow, subtle reflections, luxurious and refined rendering, premium e-commerce style, 1:1 ratio.',
  'Précise la couleur et la forme de ton packaging pour un résultat fidèle à ton produit.',
  'gemini',
  2
from public.prompt_categories where name = 'Visuels produits';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Ambiance spa et bien-être',
  'Photo ambiance spa luxueux avec produits naturels : bougies allumées, serviettes blanches roulées, plantes vertes, pierres de massage, et produits de soin disposés harmonieusement. Éclairage tamisé et chaud, atmosphère zen et relaxante, couleurs neutres et naturelles, format carré Instagram.',
  'Luxurious spa ambiance photo with natural products: lit candles, rolled white towels, green plants, massage stones, and skincare products arranged harmoniously. Warm dim lighting, zen and relaxing atmosphere, neutral and natural colors, square Instagram format.',
  'Idéal pour promouvoir une gamme de soins ou de bien-être. Ajoute tes produits spécifiques dans la description.',
  'gemini',
  3
from public.prompt_categories where name = 'Visuels produits';

-- CITATIONS MINDSET
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Citation fond dégradé pastel',
  'Visuel Instagram carré avec citation motivationnelle. Fond dégradé doux entre deux couleurs pastel (rose et pêche, ou lavande et bleu ciel). Texte de citation centré en police élégante serif ou sans-serif moderne, couleur blanc ou beige foncé. Petits éléments décoratifs discrets (étoiles, points, lignes fines). Style épuré et féminin. Laisse un espace vide pour que je puisse ajouter ma propre citation.',
  'Square Instagram visual with motivational quote. Soft gradient background between two pastel colors (pink and peach, or lavender and sky blue). Centered quote text in elegant serif or modern sans-serif font, white or dark beige color. Small subtle decorative elements (stars, dots, thin lines). Clean and feminine style. Leave blank space so I can add my own quote.',
  'Utilise ChatGPT pour générer d''abord ta citation, puis utilise ce prompt pour créer le visuel autour.',
  'gemini',
  0
from public.prompt_categories where name = 'Citations mindset';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Style carnet journal intime',
  'Visuel Instagram au style journal intime et carnet de notes. Fond texture papier légèrement jauni ou beige, écriture manuscrite simulée en noir ou encre foncée pour la citation, petits dessins à la main (flèches, étoiles, soulignements), ambiance authentique et personnelle, un peu de désordre créatif volontaire. Format carré, esthétique Pinterest.',
  'Instagram visual in diary and notebook style. Slightly yellowed or beige paper texture background, simulated handwritten text in black or dark ink for the quote, small hand-drawn elements (arrows, stars, underlines), authentic and personal atmosphere, a bit of intentional creative disorder. Square format, Pinterest aesthetic.',
  'Parfait pour des citations personnelles et authentiques. Ajoute ta propre expérience dans la citation pour plus d''impact.',
  'gemini',
  1
from public.prompt_categories where name = 'Citations mindset';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Minimaliste fond blanc typographie bold',
  'Visuel Instagram ultra-minimaliste. Fond blanc pur. Une seule phrase courte et impactante en très grande typographie bold noire centrée. Rien d''autre. Style éditorial magazine de luxe. Beaucoup d''espace blanc autour du texte. La phrase doit tenir en 3 à 5 mots maximum. Format carré 1:1.',
  'Ultra-minimalist Instagram visual. Pure white background. A single short and impactful sentence in very large bold black typography centered. Nothing else. Luxury magazine editorial style. Lots of white space around the text. The phrase should be 3 to 5 words maximum. Square 1:1 format.',
  'Fonctionne très bien avec des phrases courtes et percutantes comme "Ta vie. Tes règles." ou "Commence. Maintenant."',
  'gemini',
  2
from public.prompt_categories where name = 'Citations mindset';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Nature et liberté financière',
  'Photo-illustration inspirante : silhouette d''une personne debout au sommet d''une montagne ou falaise, les bras ouverts face à un coucher de soleil spectaculaire aux couleurs chaudes (orange, rose, doré). Sentiment de liberté, accomplissement et puissance. Espace en bas de l''image pour ajouter une citation. Style cinématographique, très contrasté.',
  'Inspiring photo-illustration: silhouette of a person standing at the top of a mountain or cliff, arms open facing a spectacular sunset with warm colors (orange, pink, gold). Feeling of freedom, accomplishment and power. Space at the bottom of the image to add a quote. Cinematic style, high contrast.',
  'Idéal pour des posts sur la liberté financière ou le dépassement de soi. Ajoute ta citation sur la liberté dans l''espace prévu.',
  'gemini',
  3
from public.prompt_categories where name = 'Citations mindset';

-- RECRUTEMENT MLM
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Équipe souriante et dynamique',
  'Photo lifestyle d''un groupe de 3 à 4 personnes souriantes et dynamiques, diversifiées, habillées de façon casual-chic, réunies autour d''une table dans un espace de coworking moderne ou café branché. Ambiance positive, collaborative et énergique. Lumière naturelle, couleurs vives et chaleureuses. Sentiment d''appartenance à une communauté qui réussit.',
  'Lifestyle photo of a group of 3 to 4 smiling and dynamic people, diverse, dressed in casual-chic style, gathered around a table in a modern coworking space or trendy café. Positive, collaborative and energetic atmosphere. Natural light, bright and warm colors. Sense of belonging to a successful community.',
  'Ajoute un texte par-dessus du style "Rejoins notre équipe" ou "On recrute !" pour maximiser l''impact.',
  'gemini',
  0
from public.prompt_categories where name = 'Recrutement MLM';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Liberté de travailler où tu veux',
  'Photo lifestyle d''une personne travaillant depuis un endroit paradisiaque : plage avec hamac et laptop, terrasse avec vue montagne, ou café parisien pittoresque. Personne détendue, souriante, habillée élégamment. Sentiment de liberté géographique et financière. Lumière dorée, ambiance aspirationnelle. Format portrait ou carré.',
  'Lifestyle photo of a person working from a paradise location: beach with hammock and laptop, terrace with mountain view, or picturesque Parisian café. Relaxed, smiling person, elegantly dressed. Feeling of geographical and financial freedom. Golden light, aspirational atmosphere. Portrait or square format.',
  'Ajoute une légende du style "Et si tu pouvais travailler de n''importe où ?" pour créer de la curiosité.',
  'gemini',
  1
from public.prompt_categories where name = 'Recrutement MLM';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Avant / Après style de vie',
  'Diptyque Instagram (deux images côte à côte) illustrant une transformation de style de vie. À gauche : personne stressée dans un bureau sombre, mine fatiguée, vêtements ternes. À droite : même personne épanouie, souriante, dans un espace lumineux et agréable, tenue élégante. Contraste visuel fort entre les deux situations. Format paysage 16:9.',
  'Instagram diptych (two images side by side) illustrating a lifestyle transformation. On the left: stressed person in a dark office, tired face, dull clothes. On the right: same fulfilled, smiling person in a bright and pleasant space, elegant outfit. Strong visual contrast between the two situations. Landscape 16:9 format.',
  'Très puissant pour illustrer le changement de vie. Ajoute "Avant KIT / Après KIT" ou similaire.',
  'gemini',
  2
from public.prompt_categories where name = 'Recrutement MLM';

-- RÉSULTATS & PREUVES
insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Chiffres et résultats impactants',
  'Visuel Instagram professionnel pour mettre en avant des chiffres de résultats. Fond sombre (noir ou bleu marine profond), grands chiffres en couleur vive (or, vert menthe ou blanc) au centre, sous-titre explicatif en petit. Style tableau de bord financier luxueux. Un ou deux éléments graphiques simples (graphique en hausse, étoile). Format carré.',
  'Professional Instagram visual to highlight results figures. Dark background (black or deep navy blue), large figures in vivid color (gold, mint green or white) in the center, small explanatory subtitle below. Luxurious financial dashboard style. One or two simple graphic elements (rising chart, star). Square format.',
  'Idéal pour partager tes revenus du mois, le nombre de clients, ou tes objectifs atteints. Sois précis dans tes chiffres.',
  'gemini',
  0
from public.prompt_categories where name = 'Résultats & preuves';

insert into public.prompts (category_id, title, prompt_fr, prompt_en, tip, tool, sort_order)
select 
  id,
  'Témoignage client encadré',
  'Visuel Instagram élégant pour mettre en valeur un témoignage client. Fond pastel doux (rose pâle, beige ou vert sauge), grande citation en italique au centre avec guillemets décoratifs, nom et photo miniature du client en bas, étoiles de notation (5/5) en couleur dorée. Style épuré et professionnel qui inspire confiance. Format carré.',
  'Elegant Instagram visual to highlight a customer testimonial. Soft pastel background (pale pink, beige or sage green), large italic quote in the center with decorative quotation marks, client name and thumbnail photo at the bottom, rating stars (5/5) in golden color. Clean and professional style that inspires trust. Square format.',
  'Demande toujours l''autorisation de ton client avant de publier son témoignage. Utilise ses vrais mots pour plus d''authenticité.',
  'gemini',
  1
from public.prompt_categories where name = 'Résultats & preuves';
```

---

### 3. Types TypeScript

Ajouter dans `types/index.ts` :

```ts
export interface PromptCategory {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  sort_order: number;
}

export interface Prompt {
  id: string;
  category_id: string;
  title: string;
  prompt_fr: string;
  prompt_en: string;
  tip?: string;
  tool: string;
  sort_order: number;
}
```

---

### 4. Hook usePrompts

Créer `hooks/usePrompts.ts` :

```ts
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { PromptCategory, Prompt } from "../types";

export function usePrompts() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("prompt_categories").select("*").order("sort_order"),
      supabase.from("prompts").select("*").order("sort_order"),
    ]).then(([cats, proms]) => {
      setCategories(cats.data ?? []);
      setPrompts(proms.data ?? []);
      setLoading(false);
    });
  }, []);

  const getPromptsByCategory = (categoryId: string) =>
    prompts.filter((p) => p.category_id === categoryId);

  return { categories, prompts, loading, getPromptsByCategory };
}
```

---

### 5. Écran principal — Bibliothèque de prompts

Créer `app/(app)/content/index.tsx` :

```tsx
import { useState } from "react";
import { View, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Text, Card, EmptyState } from "../../components/ui";
import { usePrompts } from "../../hooks/usePrompts";
import { useSubscription } from "../../hooks/useSubscription";
import { useTheme } from "../../lib/theme";
import { Prompt } from "../../types";

export default function ContentScreen() {
  const theme = useTheme();
  const { isPro } = useSubscription();
  const { categories, loading, getPromptsByCategory } = usePrompts();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Paywall si pas Pro
  if (!isPro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 }}>
          <Text style={{ fontSize: 48 }}>✨</Text>
          <Text style={{ fontSize: 22, fontWeight: "800", color: theme.textPrimary, textAlign: "center", letterSpacing: -0.5 }}>
            Contenu Instagram
          </Text>
          <Text style={{ fontSize: 15, color: theme.textMuted, textAlign: "center", lineHeight: 22 }}>
            Accède à notre bibliothèque de prompts IA pour créer du contenu Instagram professionnel en quelques secondes.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            style={{
              backgroundColor: theme.primaryBg,
              borderWidth: 1, borderColor: theme.primaryBorder,
              borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14,
              marginTop: 8,
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

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  const displayedCategory = activeCategory ?? categories[0]?.id;
  const displayedPrompts = displayedCategory ? getPromptsByCategory(displayedCategory) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* Ligne décorative */}
      <View style={{ height: 1, marginHorizontal: 32, backgroundColor: theme.primary, opacity: 0.25 }} />

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: theme.textPrimary, letterSpacing: -1 }}>
          Contenu Instagram
        </Text>
        <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
          Prompts prêts à utiliser avec Gemini ou ChatGPT
        </Text>
      </View>

      {/* Tuto rapide */}
      <View style={{
        marginHorizontal: 20, marginBottom: 12,
        backgroundColor: theme.primaryBg,
        borderWidth: 1, borderColor: theme.primaryBorder,
        borderRadius: 14, padding: 12,
        flexDirection: "row", alignItems: "center", gap: 10,
      }}>
        <Text style={{ fontSize: 20 }}>💡</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.primary, marginBottom: 2 }}>
            Comment utiliser ?
          </Text>
          <Text style={{ fontSize: 11, color: theme.textMuted, lineHeight: 16 }}>
            Copie un prompt → ouvre Gemini ou ChatGPT → colle-le → génère ton visuel → partage sur Instagram
          </Text>
        </View>
      </View>

      {/* Filtres catégories */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => {
          const isActive = displayedCategory === item.id;
          return (
            <TouchableOpacity
              onPress={() => setActiveCategory(item.id)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 100,
                backgroundColor: isActive ? theme.primaryBg : theme.surface,
                borderWidth: 1,
                borderColor: isActive ? theme.primaryBorder : theme.border,
              }}
            >
              <Text style={{ fontSize: 14 }}>{item.emoji}</Text>
              <Text style={{
                fontSize: 12, fontWeight: "600",
                color: isActive ? theme.primary : theme.textMuted,
              }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Liste des prompts */}
      <FlatList
        data={displayedPrompts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PromptCard prompt={item} theme={theme} />
        )}
      />
    </SafeAreaView>
  );
}

function PromptCard({ prompt, theme }: { prompt: Prompt; theme: ReturnType<typeof useTheme> }) {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"fr" | "en">("fr");

  const handleCopy = async () => {
    const { Clipboard } = require("@react-native-clipboard/clipboard");
    await Clipboard.setString(lang === "fr" ? prompt.prompt_fr : prompt.prompt_en);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGemini = () => {
    const { Linking } = require("react-native");
    Linking.openURL("https://gemini.google.com");
  };

  return (
    <View style={{
      backgroundColor: theme.surface,
      borderWidth: 1, borderColor: theme.border,
      borderRadius: 18, overflow: "hidden",
    }}>
      {/* Header card */}
      <View style={{ padding: 14, paddingBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: theme.textPrimary, flex: 1 }}>
            {prompt.title}
          </Text>
          {/* Toggle FR / EN */}
          <View style={{
            flexDirection: "row",
            backgroundColor: theme.bg,
            borderRadius: 8, borderWidth: 1, borderColor: theme.border,
            overflow: "hidden",
          }}>
            {(["fr", "en"] as const).map((l) => (
              <TouchableOpacity
                key={l}
                onPress={() => setLang(l)}
                style={{
                  paddingHorizontal: 10, paddingVertical: 4,
                  backgroundColor: lang === l ? theme.primaryBg : "transparent",
                }}
              >
                <Text style={{
                  fontSize: 11, fontWeight: "600",
                  color: lang === l ? theme.primary : theme.textMuted,
                  textTransform: "uppercase",
                }}>
                  {l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prompt text */}
        <Text style={{
          fontSize: 12, color: theme.textMuted, lineHeight: 18,
          numberOfLines: 4,
        }} numberOfLines={4}>
          {lang === "fr" ? prompt.prompt_fr : prompt.prompt_en}
        </Text>
      </View>

      {/* Tip */}
      {prompt.tip && (
        <View style={{
          marginHorizontal: 14, marginBottom: 10,
          backgroundColor: "rgba(251,191,36,0.08)",
          borderRadius: 10, padding: 10,
          flexDirection: "row", gap: 8,
        }}>
          <Text style={{ fontSize: 13 }}>💡</Text>
          <Text style={{ fontSize: 11, color: "#fbbf24", lineHeight: 16, flex: 1 }}>
            {prompt.tip}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={{
        flexDirection: "row", gap: 8,
        paddingHorizontal: 14, paddingBottom: 14,
      }}>
        <TouchableOpacity
          onPress={handleCopy}
          style={{
            flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
            paddingVertical: 10, borderRadius: 10,
            backgroundColor: copied ? theme.primaryBg : theme.bg,
            borderWidth: 1,
            borderColor: copied ? theme.primaryBorder : theme.border,
          }}
        >
          <Feather name={copied ? "check" : "copy"} size={14} color={copied ? theme.primary : theme.textMuted} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: copied ? theme.primary : theme.textMuted }}>
            {copied ? "Copié !" : "Copier le prompt"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenGemini}
          style={{
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
            backgroundColor: theme.bg,
            borderWidth: 1, borderColor: theme.border,
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          <Text style={{ fontSize: 13 }}>✨</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted }}>Gemini</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

### 6. Installer clipboard

```bash
npx expo install @react-native-clipboard/clipboard --legacy-peer-deps
```

---

### 7. Ajouter l'onglet dans la tab bar

Dans `app/(app)/_layout.tsx`, ajouter un 5ème onglet ou remplacer un onglet existant :

```tsx
<Tabs.Screen
  name="content"
  options={{
    tabBarIcon: ({ color, focused }) => (
      <TabIcon name="instagram" color={color} focused={focused} />
    ),
    tabBarLabel: "Contenu",
  }}
/>
```

> Si tu as déjà 5 onglets et ne veux pas en ajouter un 6ème, accessible depuis le Profil :
> Ajouter dans `app/(app)/profile.tsx` un lien vers `/(app)/content`

---

### 8. Ajouter dans le Profil si pas d'onglet dédié

Dans `app/(app)/profile.tsx` :

```tsx
{isPro && (
  <TouchableOpacity
    onPress={() => router.push("/(app)/content")}
    style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 4 }}
  >
    <Text style={{ fontSize: 18 }}>📸</Text>
    <Text style={{ flex: 1, fontSize: 14, color: theme.textPrimary }}>Contenu Instagram</Text>
    <Feather name="chevron-right" size={16} color={theme.textHint} />
  </TouchableOpacity>
)}
```

---

## Critères de validation

- [ ] Les tables `prompt_categories` et `prompts` existent dans Supabase
- [ ] Les 4 catégories et 11 prompts sont bien insérés
- [ ] L'écran est inaccessible sans plan Pro (paywall affiché)
- [ ] Les catégories filtrent bien les prompts
- [ ] Le toggle FR/EN bascule la langue du prompt
- [ ] Le bouton "Copier le prompt" copie dans le presse-papier
- [ ] Après 2 secondes le bouton repasse à "Copier le prompt"
- [ ] Le bouton Gemini ouvre gemini.google.com dans le navigateur
- [ ] Les tips s'affichent en jaune sous chaque prompt
- [ ] Aucune erreur TypeScript

---

## Contenu à ajouter plus tard

D'autres prompts peuvent être ajoutés directement dans Supabase sans mise à jour de l'app :
- Stories Instagram (format vertical 9:16)
- Visuels pour Facebook
- Posts de lancement de produit
- Visuels pour les fêtes et événements saisonniers
