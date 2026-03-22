import { useState } from "react";
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../ui";
import { useTheme } from "../../lib/theme";
import { useAuthContext } from "../../lib/AuthContext";
import { useProfile } from "../../hooks/useProfile";

/**
 * URL du nœud Webhook n8n (mode Production).
 * Important : dans n8n, l’URL « Test » contient souvent `/webhook-test/` — elle ne répond
 * correctement que pendant un test depuis l’éditeur. Pour l’app mobile, copie l’URL
 * **Production** (chemin `/webhook/...`) et active le workflow.
 *
 * Tu peux aussi définir EXPO_PUBLIC_N8N_FEEDBACK_URL dans .env.local (recommandé).
 */
const N8N_WEBHOOK_URL =
  (typeof process !== "undefined" &&
    process.env.EXPO_PUBLIC_N8N_FEEDBACK_URL?.trim()) ||
  "";

const CATEGORIES = [
  { key: "bug", label: "🐛 Bug", color: "#f87171" },
  { key: "improvement", label: "✨ Amélioration", color: "#fbbf24" },
  { key: "idea", label: "💡 Idée", color: "#818cf8" },
  { key: "other", label: "💬 Autre", color: "#64748b" },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

interface FeedbackSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function FeedbackSheet({ visible, onClose }: FeedbackSheetProps) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const { profile } = useProfile();

  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const canSubmit = category !== null && message.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (!N8N_WEBHOOK_URL) {
      Alert.alert(
        "Configuration",
        "Définis l’URL du webhook dans EXPO_PUBLIC_N8N_FEEDBACK_URL (.env.local) puis redémarre Expo.",
        [{ text: "OK" }]
      );
      return;
    }

    setLoading(true);

    const payload = {
      category,
      message: message.trim(),
      user_id: user?.id ?? "anonymous",
      user_email: user?.email ?? "anonymous",
      user_name: profile?.full_name ?? "Inconnu",
      app_version: "1.0.0",
      platform: Platform.OS,
      sent_at: new Date().toISOString(),
    };

    try {
      let response: Response;
      try {
        response = await fetch(N8N_WEBHOOK_URL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } catch (networkErr) {
        const msg =
          networkErr instanceof Error ? networkErr.message : String(networkErr);
        if (__DEV__) {
          console.warn("[FeedbackSheet] fetch failed:", networkErr);
        }
        Alert.alert(
          "Erreur réseau",
          `${msg}\n\nSi tu testes sur **Expo Web**, le navigateur peut bloquer la requête (CORS). Essaie sur un appareil ou un simulateur iOS/Android.\n\nSinon vérifie l’URL HTTPS et que le serveur n8n est joignable.`,
          [{ text: "OK" }]
        );
        return;
      }

      const bodyText = await response.text();
      const ok = response.ok;

      if (!ok) {
        if (__DEV__) {
          console.warn(
            "[FeedbackSheet] webhook HTTP",
            response.status,
            bodyText.slice(0, 500)
          );
        }
        const hint =
          N8N_WEBHOOK_URL.includes("webhook-test")
            ? "\n\nAstuce : tu utilises une URL « Test » (/webhook-test/). Pour l’app, utilise l’URL **Production** (/webhook/...) dans n8n et active le workflow."
            : "\n\nVérifie que le workflow n8n est **actif** et que l’URL correspond au nœud Webhook (mode production).";
        Alert.alert(
          "Le serveur a refusé l’envoi",
          `Code HTTP ${response.status}${bodyText ? `\n\n${bodyText.slice(0, 280)}${bodyText.length > 280 ? "…" : ""}` : ""}${hint}`,
          [{ text: "OK" }]
        );
        return;
      }

      setSent(true);
      setTimeout(() => {
        setSent(false);
        setCategory(null);
        setMessage("");
        onClose();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setCategory(null);
    setMessage("");
    setSent(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.4)",
          }}
          onPress={handleClose}
          activeOpacity={1}
        />

        <View
          style={{
            backgroundColor: theme.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Platform.OS === "ios" ? 34 : 24,
            maxHeight: "85%",
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.border,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 4,
            }}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.textPrimary,
                }}
              >
                Envoyer un feedback
              </Text>
              <TouchableOpacity onPress={handleClose} style={{ padding: 4 }}>
                <Feather name="x" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {sent ? (
              <View
                style={{
                  alignItems: "center",
                  paddingVertical: 32,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: theme.primaryBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="check" size={28} color={theme.primary} />
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: theme.textPrimary,
                  }}
                >
                  Merci pour ton feedback !
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.textMuted,
                    textAlign: "center",
                    paddingHorizontal: 40,
                  }}
                >
                  On en prend note et on améliore KIT pour toi. 🚀
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 20, gap: 20 }}>
                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 10,
                    }}
                  >
                    Catégorie
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.key;
                      return (
                        <TouchableOpacity
                          key={cat.key}
                          onPress={() => setCategory(cat.key)}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 9,
                            borderRadius: 100,
                            backgroundColor: isSelected
                              ? `${cat.color}15`
                              : theme.bg,
                            borderWidth: 1,
                            borderColor: isSelected ? cat.color : theme.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: isSelected ? "600" : "400",
                              color: isSelected ? cat.color : theme.textMuted,
                            }}
                          >
                            {cat.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: theme.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 10,
                    }}
                  >
                    Ton message
                  </Text>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Décris ton feedback, ton bug ou ton idée..."
                    placeholderTextColor={theme.textHint}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    style={{
                      backgroundColor: theme.bg,
                      borderWidth: 1,
                      borderColor: theme.border,
                      borderRadius: 14,
                      padding: 14,
                      fontSize: 14,
                      color: theme.textPrimary,
                      minHeight: 120,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      color: theme.textHint,
                      marginTop: 6,
                      textAlign: "right",
                    }}
                  >
                    {message.length} caractères
                  </Text>
                </View>

                <View style={{ height: 4 }} />
              </View>
            )}
          </ScrollView>

          {!sent && (
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                paddingHorizontal: 20,
                paddingTop: 8,
              }}
            >
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: theme.bg,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: theme.textMuted,
                  }}
                >
                  Annuler
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit || loading}
                style={{
                  flex: 2,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  backgroundColor: canSubmit ? theme.primary : theme.border,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text
                    style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}
                  >
                    Envoyer
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
