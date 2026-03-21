# KIT — etape_03b : Swipe Cards + Arc de progression

## Contexte

L'app est fonctionnelle avec contacts, pipeline, messages, notifications et dark mode.
On ajoute deux composants ludiques et interactifs :
1. **Mode swipe** dans l'écran Contacts (toggle entre liste classique et swipe cards)
2. **Arc de progression** interactif dans la fiche contact (remplace le sélecteur de statut actuel)

---

## Étape 0 — Vérifier et installer les dépendances

Dans le terminal, vérifie si ces packages sont déjà dans `package.json`.
Installe uniquement ceux qui manquent :

```bash
npx expo install react-native-gesture-handler react-native-reanimated react-native-svg --legacy-peer-deps
```

Vérifier que `babel.config.js` contient bien `react-native-reanimated/plugin` en dernier plugin :

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }]
    ],
    plugins: [
      "react-native-reanimated/plugin"
    ]
  };
};
```

Wrapper l'app avec GestureHandlerRootView dans `app/_layout.tsx` :

```tsx
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppWithNotifications />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

---

## Partie 1 — Arc de progression dans la fiche contact

### 1. Composant PipelineArc

Créer `components/contacts/PipelineArc.tsx` :

```tsx
import { View, TouchableOpacity } from "react-native";
import Svg, { Path, Circle, Text as SvgText } from "react-native-svg";
import { Text } from "../ui";
import { PipelineStatus, PIPELINE_LABELS } from "../../types";

const STEPS: PipelineStatus[] = ["new", "contacted", "interested", "follow_up", "client"];

const STEP_COLORS: Record<PipelineStatus, string> = {
  new: "#64748b",
  contacted: "#378ADD",
  interested: "#1D9E75",
  follow_up: "#BA7517",
  client: "#639922",
  inactive: "#334155",
};

// Positions des points sur l'arc (demi-cercle)
const DOT_POSITIONS = [
  { x: 20, y: 120 },
  { x: 56, y: 53 },
  { x: 110, y: 30 },
  { x: 164, y: 53 },
  { x: 200, y: 120 },
];

const LABEL_OFFSETS = [
  { x: 20, y: 108, anchor: "middle" },
  { x: 56, y: 41, anchor: "middle" },
  { x: 110, y: 18, anchor: "middle" },
  { x: 164, y: 41, anchor: "middle" },
  { x: 200, y: 108, anchor: "middle" },
];

interface PipelineArcProps {
  status: PipelineStatus;
  onChange: (status: PipelineStatus) => void;
}

export function PipelineArc({ status, onChange }: PipelineArcProps) {
  const currentIndex = STEPS.indexOf(status);
  const color = STEP_COLORS[status];
  const totalArc = 283;
  const pct = currentIndex / (STEPS.length - 1);
  const dashOffset = totalArc - totalArc * pct;

  return (
    <View>
      {/* Arc SVG */}
      <View style={{ alignItems: "center" }}>
        <Svg width={220} height={130} viewBox="0 0 220 130">
          {/* Track */}
          <Path
            d="M 20 120 A 90 90 0 0 1 200 120"
            fill="none"
            stroke="#334155"
            strokeWidth={10}
            strokeLinecap="round"
          />

          {/* Progress */}
          <Path
            d="M 20 120 A 90 90 0 0 1 200 120"
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={totalArc}
            strokeDashoffset={dashOffset}
          />

          {/* Dots + labels */}
          {STEPS.map((step, i) => {
            const pos = DOT_POSITIONS[i];
            const lbl = LABEL_OFFSETS[i];
            const isActive = i <= currentIndex;
            const isCurrent = i === currentIndex;

            return (
              <View key={step}>
                {isCurrent && (
                  <Circle
                    cx={pos.x}
                    cy={pos.y}
                    r={10}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                  />
                )}
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={6}
                  fill={isActive ? color : "#334155"}
                  onPress={() => onChange(step)}
                />
                <SvgText
                  x={lbl.x}
                  y={lbl.y}
                  fontSize={9}
                  fill={isCurrent ? "#f1f5f9" : "#64748b"}
                  textAnchor={lbl.anchor as "middle"}
                  fontWeight={isCurrent ? "600" : "400"}
                >
                  {PIPELINE_LABELS[step]}
                </SvgText>
              </View>
            );
          })}
        </Svg>
      </View>

      {/* Contrôles sous l'arc */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginTop: 4 }}>
        <TouchableOpacity
          onPress={() => {
            const prev = Math.max(0, currentIndex - 1);
            onChange(STEPS[prev]);
          }}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 0.5, borderColor: "#334155", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 18, color: "#f1f5f9" }}>‹</Text>
        </TouchableOpacity>

        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 15, fontWeight: "500", color: color }}>
            {PIPELINE_LABELS[status]}
          </Text>
          <Text style={{ fontSize: 11, color: "#64748b" }}>
            étape {currentIndex + 1} sur {STEPS.length}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            const next = Math.min(STEPS.length - 1, currentIndex + 1);
            onChange(STEPS[next]);
          }}
          style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 0.5, borderColor: "#334155", alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 18, color: "#f1f5f9" }}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

### 2. Intégrer PipelineArc dans la fiche contact

Dans `app/(app)/contacts/[id].tsx` :

Ajouter l'import :
```tsx
import { PipelineArc } from "../../../components/contacts/PipelineArc";
```

Remplacer le sélecteur de statut actuel (les TouchableOpacity avec les statuts en chips/pills)
par le composant PipelineArc :

```tsx
{/* Arc de progression — remplace le sélecteur de statut */}
<Card>
  <Text variant="muted" className="text-xs mb-3 uppercase tracking-wider">
    Pipeline
  </Text>
  <PipelineArc
    status={contact.status as PipelineStatus}
    onChange={async (newStatus) => {
      await updateContact(contact.id, { status: newStatus });
    }}
  />
</Card>
```

---

## Partie 2 — Mode Swipe dans l'écran Contacts

### 1. Composant SwipeCard

Créer `components/contacts/SwipeCard.tsx` :

```tsx
import { useEffect } from "react";
import { View, Dimensions } from "react-native";
import {
  GestureDetector,
  Gesture,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Text, Badge, Card } from "../ui";
import { Contact, PIPELINE_LABELS, PipelineStatus } from "../../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

const STATUS_VARIANTS: Record<PipelineStatus, "success" | "info" | "warning" | "neutral" | "danger"> = {
  new: "neutral",
  contacted: "info",
  interested: "warning",
  follow_up: "danger",
  client: "success",
  inactive: "neutral",
};

interface SwipeCardProps {
  contact: Contact;
  onSwipeRight: () => void; // avancer statut
  onSwipeLeft: () => void;  // reculer statut
  onSwipeUp: () => void;    // ignorer
  isTop: boolean;
  index: number;
}

export function SwipeCard({
  contact,
  onSwipeRight,
  onSwipeLeft,
  onSwipeUp,
  isTop,
  index,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [contact.id]);

  const gesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5);
        runOnJS(onSwipeRight)();
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5);
        runOnJS(onSwipeLeft)();
      } else if (e.translationY < -SWIPE_THRESHOLD) {
        translateY.value = withTiming(-600);
        runOnJS(onSwipeUp)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const rightHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD / 2], [0, 1], Extrapolation.CLAMP),
  }));

  const leftHintStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD / 2, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const cardScale = isTop ? 1 : interpolate(index, [1, 2], [0.97, 0.94]);
  const cardTranslateY = isTop ? 0 : interpolate(index, [1, 2], [-8, -16]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const daysSince = contact.last_interaction_at
    ? Math.floor((Date.now() - new Date(contact.last_interaction_at).getTime()) / 86400000)
    : null;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: "100%",
            transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
          },
          isTop ? animatedStyle : {},
        ]}
      >
        <View
          style={{
            backgroundColor: "var(--surface)",
            borderRadius: 20,
            padding: 24,
            marginHorizontal: 4,
            borderWidth: 0.5,
            borderColor: "#1e293b",
            minHeight: 300,
            alignItems: "center",
          }}
          className="bg-surface"
        >
          {/* Hints */}
          {isTop && (
            <>
              <Animated.View
                style={[
                  { position: "absolute", top: 16, left: 16, backgroundColor: "#1D9E7522", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
                  rightHintStyle,
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#1D9E75" }}>Avancer →</Text>
              </Animated.View>
              <Animated.View
                style={[
                  { position: "absolute", top: 16, right: 16, backgroundColor: "#f8717122", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
                  leftHintStyle,
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#f87171" }}>← Reculer</Text>
              </Animated.View>
            </>
          )}

          {/* Avatar */}
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#1e3a5f", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: "600", color: "#6ee7b7" }}>
              {getInitials(contact.full_name)}
            </Text>
          </View>

          {/* Nom */}
          <Text variant="h2" className="text-center mb-1">{contact.full_name}</Text>

          {daysSince !== null && (
            <Text variant="muted" className="text-xs mb-3">
              Dernier contact il y a {daysSince} jour{daysSince > 1 ? "s" : ""}
            </Text>
          )}

          {/* Statut */}
          <Badge
            label={PIPELINE_LABELS[contact.status as PipelineStatus] ?? contact.status}
            variant={STATUS_VARIANTS[contact.status as PipelineStatus] ?? "neutral"}
          />

          {/* Note */}
          {contact.notes && (
            <View style={{ marginTop: 16, backgroundColor: "#0f172a", borderRadius: 12, padding: 12, width: "100%" }}>
              <Text style={{ fontSize: 12, color: "#94a3b8", lineHeight: 18 }}>
                "{contact.notes}"
              </Text>
            </View>
          )}

          {/* Phone */}
          {contact.phone && (
            <Text variant="muted" className="text-xs mt-3">{contact.phone}</Text>
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
```

---

### 2. Composant SwipeMode (écran complet)

Créer `components/contacts/SwipeMode.tsx` :

```tsx
import { useState, useCallback } from "react";
import { View, TouchableOpacity } from "react-native";
import { Text } from "../ui";
import { SwipeCard } from "./SwipeCard";
import { useContacts } from "../../hooks/useContacts";
import { Contact, PipelineStatus } from "../../types";
import { Feather } from "@expo/vector-icons";

const STEPS: PipelineStatus[] = ["new", "contacted", "interested", "follow_up", "client"];

export function SwipeMode({ onClose }: { onClose: () => void }) {
  const { contacts, updateContact } = useContacts();

  // Uniquement les contacts avec une relance due ou sans interaction récente
  const queue = contacts.filter((c) => c.status !== "client" && c.status !== "inactive");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleSwipeRight = useCallback(async () => {
    const contact = queue[currentIndex];
    if (!contact) return;
    const currentStep = STEPS.indexOf(contact.status as PipelineStatus);
    const next = Math.min(STEPS.length - 1, currentStep + 1);
    await updateContact(contact.id, { status: STEPS[next] });
    setLastAction(`${contact.full_name} → ${STEPS[next]}`);
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, queue]);

  const handleSwipeLeft = useCallback(async () => {
    const contact = queue[currentIndex];
    if (!contact) return;
    const currentStep = STEPS.indexOf(contact.status as PipelineStatus);
    const prev = Math.max(0, currentStep - 1);
    await updateContact(contact.id, { status: STEPS[prev] });
    setLastAction(`${contact.full_name} → ${STEPS[prev]}`);
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, queue]);

  const handleSwipeUp = useCallback(() => {
    const contact = queue[currentIndex];
    if (!contact) return;
    setLastAction(`${contact.full_name} ignoré`);
    setCurrentIndex((i) => i + 1);
  }, [currentIndex, queue]);

  const remaining = queue.slice(currentIndex, currentIndex + 3);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <Text variant="muted" style={{ fontSize: 13 }}>
          {queue.length - currentIndex} contact{queue.length - currentIndex > 1 ? "s" : ""} restant{queue.length - currentIndex > 1 ? "s" : ""}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", position: "relative", marginHorizontal: 20 }}>
        {remaining.length === 0 ? (
          <View style={{ alignItems: "center", gap: 12 }}>
            <Text style={{ fontSize: 40 }}>🎉</Text>
            <Text variant="h3">Tous traités !</Text>
            <Text variant="muted">Aucun contact en attente.</Text>
            <TouchableOpacity onPress={() => setCurrentIndex(0)} style={{ marginTop: 8 }}>
              <Text style={{ color: "#6ee7b7", fontSize: 14 }}>Recommencer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          [...remaining].reverse().map((contact, i) => (
            <SwipeCard
              key={contact.id}
              contact={contact}
              isTop={i === remaining.length - 1}
              index={remaining.length - 1 - i}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              onSwipeUp={handleSwipeUp}
            />
          ))
        )}
      </View>

      {/* Boutons d'action */}
      {remaining.length > 0 && (
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 24, paddingVertical: 24 }}>
          <TouchableOpacity
            onPress={handleSwipeLeft}
            style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 0.5, borderColor: "#f87171", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="arrow-left" size={20} color="#f87171" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSwipeUp}
            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 0.5, borderColor: "#475569", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="minus" size={16} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSwipeRight}
            style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 0.5, borderColor: "#6ee7b7", alignItems: "center", justifyContent: "center" }}
          >
            <Feather name="arrow-right" size={20} color="#6ee7b7" />
          </TouchableOpacity>
        </View>
      )}

      {/* Légende */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 32, paddingBottom: 8 }}>
        <Text variant="muted" style={{ fontSize: 10 }}>← reculer</Text>
        <Text variant="muted" style={{ fontSize: 10 }}>— ignorer</Text>
        <Text variant="muted" style={{ fontSize: 10 }}>avancer →</Text>
      </View>

      {/* Feedback dernière action */}
      {lastAction && (
        <View style={{ alignItems: "center", paddingBottom: 12 }}>
          <Text variant="muted" style={{ fontSize: 12 }}>{lastAction}</Text>
        </View>
      )}
    </View>
  );
}
```

---

### 3. Intégrer le toggle dans l'écran Contacts

Dans `app/(app)/contacts.tsx`, ajouter le toggle entre liste et mode swipe.

Ajouter l'import :
```tsx
import { SwipeMode } from "../../components/contacts/SwipeMode";
```

Ajouter le state :
```tsx
const [swipeMode, setSwipeMode] = useState(false);
```

Modifier le header pour ajouter le bouton toggle :
```tsx
<View className="flex-row items-center justify-between px-5 pt-4 pb-3">
  <Text variant="h1">Contacts</Text>
  <View className="flex-row items-center gap-3">
    {/* Toggle swipe mode */}
    <TouchableOpacity
      onPress={() => setSwipeMode(!swipeMode)}
      className={`px-3 py-1.5 rounded-full border ${
        swipeMode
          ? "bg-primary/10 border-primary"
          : "bg-surface border-border"
      }`}
    >
      <Text className={`text-xs font-semibold ${swipeMode ? "text-primary" : "text-textMuted"}`}>
        {swipeMode ? "Mode swipe" : "Mode liste"}
      </Text>
    </TouchableOpacity>

    {/* Bouton ajout */}
    {!swipeMode && (
      <TouchableOpacity
        onPress={() => router.push("/(app)/contacts/new")}
        className="bg-primary w-9 h-9 rounded-full items-center justify-center"
      >
        <Feather name="plus" size={20} color="#0f172a" />
      </TouchableOpacity>
    )}
  </View>
</View>
```

Modifier le contenu principal pour afficher SwipeMode ou la liste :
```tsx
{swipeMode ? (
  <SwipeMode onClose={() => setSwipeMode(false)} />
) : (
  <>
    {/* Recherche, filtres, liste — code existant inchangé */}
  </>
)}
```

---

### 4. Exporter les nouveaux composants

Mettre à jour `components/contacts/index.ts` :

```ts
export { ContactCard } from "./ContactCard";
export { AddInteractionSheet } from "./AddInteractionSheet";
export { FollowUpPicker } from "./FollowUpPicker";
export { PipelineArc } from "./PipelineArc";
export { SwipeCard } from "./SwipeCard";
export { SwipeMode } from "./SwipeMode";
```

---

## Critères de validation

- [ ] Le toggle "Mode liste / Mode swipe" apparaît dans le header de l'écran Contacts
- [ ] En mode swipe, les cartes s'empilent et répondent au glissement
- [ ] Swipe droite → avance le statut + mise à jour Supabase
- [ ] Swipe gauche → recule le statut + mise à jour Supabase
- [ ] Swipe haut ou bouton "—" → ignore le contact
- [ ] Les boutons ← — → fonctionnent comme alternative au swipe
- [ ] Quand tous les contacts sont traités, l'écran de fin s'affiche
- [ ] Sur la fiche contact, l'arc de progression remplace l'ancien sélecteur
- [ ] Taper sur les boutons ‹ › change le statut et met à jour Supabase
- [ ] L'arc se remplit en couleur selon le statut actuel
- [ ] Aucune erreur TypeScript

---

## Notes importantes

- Le mode swipe ne montre que les contacts actifs (exclut "client" et "inactif")
- Sur iOS, le swipe peut entrer en conflit avec la navigation — si c'est le cas,
  désactiver le geste de retour natif sur l'écran Contacts avec
  `gestureEnabled: false` dans les options de navigation
- Les animations sont plus fluides sur un build natif qu'avec Expo Go
