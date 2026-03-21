import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Text as RNText,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Card, EmptyState } from "../../../components/ui";
import { usePrompts } from "../../../hooks/usePrompts";
import { useSubscription } from "../../../hooks/useSubscription";
import { useTheme } from "../../../lib/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Prompt } from "../../../types";

function PromptCard({
  prompt,
  theme,
}: {
  prompt: Prompt;
  theme: ReturnType<typeof useTheme>;
}) {
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const [expanded, setExpanded] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setExpanded(false);
  }, [prompt.id]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    const { Clipboard } = require("@react-native-clipboard/clipboard");
    const text = lang === "fr" ? prompt.prompt_fr : prompt.prompt_en;
    await Clipboard.setString(text);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGemini = () => {
    Linking.openURL("https://gemini.google.com");
  };

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 18,
        overflow: "hidden",
      }}
    >
      {/* Accordion header */}
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.85}
      >
        <View style={{ padding: 14 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <RNText
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: theme.textPrimary,
                flex: 1,
              }}
              numberOfLines={2}
            >
              {prompt.title}
            </RNText>

            {/* Toggle FR / EN (toujours visible dans le header) */}
            <View
              style={{
                flexDirection: "row",
                backgroundColor: theme.bg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.border,
                overflow: "hidden",
              }}
            >
              {(["fr", "en"] as const).map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={(e) => {
                    (e as { stopPropagation?: () => void }).stopPropagation?.();
                    setLang(l);
                  }}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    backgroundColor:
                      lang === l ? theme.primaryBg : "transparent",
                  }}
                >
                  <RNText
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: lang === l ? theme.primary : theme.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    {l}
                  </RNText>
                </TouchableOpacity>
              ))}
            </View>

            <Feather
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={theme.textHint}
            />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={{ paddingBottom: 14 }}>
          {/* Prompt text */}
          <View style={{ paddingHorizontal: 14, marginBottom: 10 }}>
            <RNText
              style={{
                fontSize: 12,
                color: theme.textMuted,
                lineHeight: 18,
              }}
            >
              {lang === "fr" ? prompt.prompt_fr : prompt.prompt_en}
            </RNText>
          </View>

          {/* Tip */}
          {prompt.tip && (
            <View
              style={{
                marginHorizontal: 14,
                marginBottom: 10,
                backgroundColor: theme.warningBg,
                borderRadius: 12,
                padding: 10,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <RNText style={{ fontSize: 13 }}>💡</RNText>
              <RNText
                style={{
                  fontSize: 11,
                  color: theme.warning,
                  lineHeight: 16,
                  flex: 1,
                }}
              >
                {prompt.tip}
              </RNText>
            </View>
          )}

          {/* Actions */}
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              paddingHorizontal: 14,
            }}
          >
            <TouchableOpacity
              onPress={handleCopy}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: copied ? theme.primaryBg : `${theme.primary}12`,
                borderWidth: 1,
                borderColor: copied ? theme.primaryBorder : `${theme.primary}25`,
              }}
            >
              <Feather
                name={copied ? "check" : "copy"}
                size={14}
                color={copied ? theme.primary : theme.textMuted}
              />
              <RNText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: copied ? theme.primary : theme.textMuted,
                }}
              >
                {copied ? "Copié !" : "Copier"}
              </RNText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenGemini}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: theme.accentBg,
                borderWidth: 1,
                borderColor: theme.accentBorder,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RNText style={{ fontSize: 13 }}>✨</RNText>
              <RNText
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: theme.textMuted,
                }}
              >
                Ouvrir Gemini
              </RNText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function ContentScreen() {
  const theme = useTheme();
  const { isPro } = useSubscription();
  const { categories, loading, getPromptsByCategory } = usePrompts();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const displayedCategory = activeCategory ?? categories[0]?.id ?? null;
  const displayedPrompts = useMemo(() => {
    return displayedCategory ? getPromptsByCategory(displayedCategory) : [];
  }, [displayedCategory, getPromptsByCategory]);

  const promptCountByCategory = useMemo(
    () => Object.fromEntries(
      categories.map((cat) => [cat.id, getPromptsByCategory(cat.id).length])
    ),
    [categories, getPromptsByCategory]
  );

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem("kit_content_tutorial_dismissed")
      .then((val) => {
        if (!mounted) return;
        if (val === "true") setShowTutorial(false);
      })
      .catch((err) => {
        console.warn("AsyncStorage tutorial read:", err);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const renderPromptItem = useCallback(
    ({ item }: { item: Prompt }) => (
      <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
        <PromptCard prompt={item} theme={theme} />
      </View>
    ),
    [theme]
  );

  const dismissTutorial = async () => {
    try {
      await AsyncStorage.setItem("kit_content_tutorial_dismissed", "true");
    } finally {
      setShowTutorial(false);
    }
  };

  // Paywall si pas Pro
  if (!isPro) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            gap: 16,
          }}
        >
          <RNText style={{ fontSize: 48 }}>✨</RNText>
          <RNText
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: theme.textPrimary,
              textAlign: "center",
              letterSpacing: -0.5,
            }}
          >
            Contenu Instagram
          </RNText>
          <RNText
            style={{
              fontSize: 15,
              color: theme.textMuted,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Accède à notre bibliothèque de prompts IA pour créer du contenu Instagram
            professionnel en quelques secondes.
          </RNText>
          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            style={{
              backgroundColor: theme.primaryBg,
              borderWidth: 1,
              borderColor: theme.primaryBorder,
              borderRadius: 14,
              paddingHorizontal: 28,
              paddingVertical: 14,
              marginTop: 8,
            }}
          >
            <RNText
              style={{
                color: theme.primary,
                fontWeight: "700",
                fontSize: 15,
              }}
            >
              Passer à Pro →
            </RNText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: theme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (categories.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <EmptyState
          icon="📸"
          title="Aucun prompt disponible"
          description="Les prompts doivent être configurés dans Supabase."
          actionLabel="Recommencer"
          onAction={() => router.replace("/(app)/content")}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: theme.primary,
          opacity: 0.25,
        }}
      />

      {/* Liste verticale unique (évite VirtualizedLists imbriqués) */}
      <FlatList
        data={displayedPrompts}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 32,
        }}
        windowSize={10}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <RNText
                    style={{
                      fontSize: 28,
                      fontWeight: "800",
                      color: theme.textPrimary,
                      letterSpacing: -1,
                    }}
                  >
                    Contenu
                  </RNText>
                  <RNText
                    style={{
                      fontSize: 13,
                      color: theme.textMuted,
                      marginTop: 4,
                    }}
                  >
                    Prompts IA pour Instagram
                  </RNText>
                </View>

                <View
                  style={{
                    backgroundColor: theme.warningBg,
                    borderWidth: 1,
                    borderColor: theme.warningBorder,
                    borderRadius: 100,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <Feather name="star" size={12} color={theme.warning} />
                  <RNText style={{ fontSize: 12, fontWeight: "800", color: theme.warning }}>
                    Pro
                  </RNText>
                </View>
              </View>
            </View>

            {/* Tuto rapide (dismissible) */}
            {showTutorial && (
              <View
                style={{
                  marginHorizontal: 20,
                  marginBottom: 12,
                  backgroundColor: theme.primaryBg,
                  borderWidth: 1,
                  borderColor: theme.primaryBorder,
                  borderRadius: 14,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <RNText style={{ fontSize: 18 }}>💡</RNText>
                <View style={{ flex: 1 }}>
                  <RNText
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: theme.primary,
                      marginBottom: 2,
                    }}
                  >
                    Comment utiliser ?
                  </RNText>
                  <RNText
                    style={{
                      fontSize: 11,
                      color: theme.textMuted,
                      lineHeight: 16,
                    }}
                  >
                    Copie un prompt → ouvre Gemini → colle → génère → partage
                  </RNText>
                </View>

                <TouchableOpacity onPress={dismissTutorial} hitSlop={10}>
                  <Feather name="x" size={16} color={theme.textHint} />
                </TouchableOpacity>
              </View>
            )}

            {/* Catégories : grille 2x2 */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 12,
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {categories.map((cat) => {
                const isActive = displayedCategory === cat.id;
                const promptsCount = promptCountByCategory[cat.id] ?? 0;
                const color: string = (cat as unknown as { color?: string }).color ?? theme.primary;

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
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: isActive ? `${theme.primary}20` : theme.bg,
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <RNText style={{ fontSize: 18 }}>{cat.emoji}</RNText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <RNText
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: isActive ? theme.primary : theme.textPrimary,
                        }}
                        numberOfLines={2}
                      >
                        {cat.name}
                      </RNText>
                      <RNText
                        style={{
                          fontSize: 10,
                          color: theme.textHint,
                          marginTop: 1,
                        }}
                      >
                        {promptsCount} prompts
                      </RNText>
                    </View>

                    {isActive && (
                      <Feather
                        name="check-circle"
                        size={16}
                        color={theme.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={renderPromptItem}
      />
    </SafeAreaView>
  );
}

