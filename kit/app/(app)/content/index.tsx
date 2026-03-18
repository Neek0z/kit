import { useEffect, useMemo, useState } from "react";
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

  const handleCopy = async () => {
    const { Clipboard } = require("@react-native-clipboard/clipboard");
    const text = lang === "fr" ? prompt.prompt_fr : prompt.prompt_en;
    await Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      {/* Header card */}
      <View style={{ padding: 14, paddingBottom: 10 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
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

          {/* Toggle FR / EN */}
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
                onPress={() => setLang(l)}
                style={{
                  paddingHorizontal: 10,
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
        </View>

        {/* Prompt text */}
        <RNText
          style={{
            fontSize: 12,
            color: theme.textMuted,
            lineHeight: 18,
          }}
          numberOfLines={4}
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
            backgroundColor: "rgba(251,191,36,0.08)",
            borderRadius: 10,
            padding: 10,
            flexDirection: "row",
            gap: 8,
          }}
        >
          <RNText style={{ fontSize: 13 }}>💡</RNText>
          <RNText style={{ fontSize: 11, color: "#fbbf24", lineHeight: 16, flex: 1 }}>
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
          paddingBottom: 14,
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
            borderRadius: 10,
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
          <RNText
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: copied ? theme.primary : theme.textMuted,
            }}
          >
            {copied ? "Copié !" : "Copier le prompt"}
          </RNText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenGemini}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: theme.bg,
            borderWidth: 1,
            borderColor: theme.border,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <RNText style={{ fontSize: 13 }}>✨</RNText>
          <RNText style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted }}>
            Gemini
          </RNText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ContentScreen() {
  const theme = useTheme();
  const { isPro } = useSubscription();
  const { categories, loading, getPromptsByCategory } = usePrompts();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const displayedCategory = activeCategory ?? categories[0]?.id ?? null;
  const displayedPrompts = useMemo(() => {
    return displayedCategory ? getPromptsByCategory(displayedCategory) : [];
  }, [displayedCategory, getPromptsByCategory]);

  useEffect(() => {
    // si on charge plus tard les categories, on force le premier filtre
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length]);

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
        ListHeaderComponent={
          <View>
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 12,
              }}
            >
              <RNText
                style={{
                  fontSize: 28,
                  fontWeight: "800",
                  color: theme.textPrimary,
                  letterSpacing: -1,
                }}
              >
                Contenu Instagram
              </RNText>
              <RNText
                style={{
                  fontSize: 13,
                  color: theme.textMuted,
                  marginTop: 4,
                }}
              >
                Prompts prêts à utiliser avec Gemini ou ChatGPT
              </RNText>
            </View>

            {/* Tuto rapide */}
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
              <RNText style={{ fontSize: 20 }}>💡</RNText>
              <View style={{ flex: 1 }}>
                <RNText
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
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
                  Copie un prompt → ouvre Gemini ou ChatGPT → colle-le → génère ton visuel → partage sur Instagram
                </RNText>
              </View>
            </View>

            {/* Filtres catégories */}
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(c) => c.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                gap: 8,
                paddingBottom: 12,
              }}
              renderItem={({ item }) => {
                const isActive = displayedCategory === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => setActiveCategory(item.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 100,
                      backgroundColor: isActive
                        ? theme.primaryBg
                        : theme.surface,
                      borderWidth: 1,
                      borderColor: isActive
                        ? theme.primaryBorder
                        : theme.border,
                    }}
                  >
                    <RNText style={{ fontSize: 14 }}>{item.emoji}</RNText>
                    <RNText
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isActive ? theme.primary : theme.textMuted,
                      }}
                    >
                      {item.name}
                    </RNText>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
            <PromptCard prompt={item} theme={theme} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

