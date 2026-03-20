import { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Text, Avatar, Card, Divider } from "../../../components/ui";
import { useAuthContext } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { useTheme as useDesignTheme } from "../../../lib/theme";
import { useProfile } from "../../../hooks/useProfile";
import { useSubscription } from "../../../hooks/useSubscription";
import { useDashboard } from "../../../hooks/useDashboard";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

// Une seule source de vérité : on n’affiche que des URL https (Supabase). Jamais file:// / content://
function avatarDisplayUrl(
  avatarUrl?: string | null,
  updatedAt?: string | null,
  refreshKey?: number
): string | undefined {
  if (!avatarUrl) return undefined;
  if (avatarUrl.startsWith("file://") || avatarUrl.startsWith("content://")) return undefined;
  const sep = avatarUrl.includes("?") ? "&" : "?";
  return `${avatarUrl}${sep}t=${updatedAt || ""}${refreshKey != null ? `&k=${refreshKey}` : ""}`;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthContext();
  const { isDark, setPreference } = useTheme();
  const designTheme = useDesignTheme();
  const { profile, fetchProfile, updateProfile, uploadAvatar, loading: profileLoading } = useProfile();
  const { isPro } = useSubscription();
  const { totalContacts, byStatus, totalInteractions, loading: dashboardLoading } = useDashboard();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  // Changé à chaque succès upload+update → force le rechargement de l’image (évite le cache)
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  const handlePickAvatar = () => {
    Alert.alert("Photo de profil", "Choisir une source", [
      {
        text: "Galerie",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.8,
          });
          if (!result.canceled) await handleUpload(result.assets[0].uri);
        },
      },
      {
        text: "Caméra",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
          });
          if (!result.canceled) await handleUpload(result.assets[0].uri);
        },
      },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const handleUpload = async (uri: string) => {
    setUploadingAvatar(true);
    try {
      const { url, error: uploadError } = await uploadAvatar(uri);
      if (uploadError || !url) {
        Alert.alert(
          "Erreur d’envoi",
          uploadError || "Impossible d’envoyer la photo. Vérifie le bucket « avatars » et les politiques Storage dans Supabase."
        );
        return;
      }
      const { ok, error: updateError } = await updateProfile({ avatar_url: url });
      if (!ok) {
        Alert.alert(
          "Profil non mis à jour",
          updateError || "Photo envoyée mais le profil n’a pas pu être mis à jour."
        );
      } else {
        await fetchProfile();
        setAvatarRefreshKey((k) => k + 1);
      }
    } catch {
      Alert.alert("Erreur", "Une erreur s’est produite lors de l’envoi de la photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Se déconnecter", "Tu vas être déconnecté de KIT.", [
      { text: "Annuler", style: "cancel" },
      { text: "Se déconnecter", style: "destructive", onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Supprimer le compte",
      "Cette action est irréversible. Toutes tes données seront supprimées.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Pour supprimer ton compte",
              "Contacte support@kit.app"
            );
          },
        },
      ]
    );
  };

  if (profileLoading || dashboardLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: designTheme.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={designTheme.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: designTheme.bg }}>
      {/* Ligne décorative */}
      <View
        style={{
          height: 1,
          marginHorizontal: 32,
          backgroundColor: designTheme.primary,
          opacity: 0.25,
        }}
      />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="items-center pt-8 pb-6 px-5">
          <TouchableOpacity onPress={handlePickAvatar} className="relative mb-4">
            <Avatar
              name={profile?.full_name ?? user?.email ?? ""}
              url={avatarDisplayUrl(profile?.avatar_url, profile?.updated_at, avatarRefreshKey)}
              size="lg"
            />
            <View className="absolute bottom-0 right-0 bg-primary w-7 h-7 rounded-full items-center justify-center border-2 border-background">
              <Feather
                name={(uploadingAvatar ? "loader" : "camera") as FeatherName}
                size={13}
                color={designTheme.textPrimary}
              />
            </View>
          </TouchableOpacity>

          <Text variant="h2">{profile?.full_name ?? "Mon profil"}</Text>
          <Text variant="muted" className="mt-1">
            {user?.email}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            style={{
              marginTop: 12,
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 999,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: isPro ? "rgba(251,191,36,0.1)" : designTheme.primaryBg,
              borderWidth: 1,
              borderColor: isPro ? "rgba(251,191,36,0.25)" : designTheme.primaryBorder,
            }}
          >
            <Feather
              name={isPro ? "star" : "zap"}
              size={12}
              color={isPro ? "#fbbf24" : designTheme.primary}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: isPro ? "#fbbf24" : designTheme.primary,
              }}
            >
              {isPro ? "Plan Pro ✨" : "Plan Free · Passer à Pro"}
            </Text>
            {!isPro && <Feather name="chevron-right" size={13} color={designTheme.primary} />}
          </TouchableOpacity>
        </View>

        {/* Stats utilisateur */}
        <View style={{ flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 20 }}>
          {[
            { label: "Contacts", value: totalContacts, icon: "users" as const, color: designTheme.primary },
            { label: "Clients", value: byStatus.client ?? 0, icon: "star" as const, color: "#fbbf24" },
            {
              label: "Interactions",
              value: totalInteractions,
              icon: "activity" as const,
              color: "#818cf8",
            },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: designTheme.surface,
                borderWidth: 1,
                borderColor: designTheme.border,
                borderRadius: 14,
                padding: 12,
                alignItems: "center",
                gap: 4,
              }}
            >
              <Feather name={stat.icon} size={16} color={stat.color} />
              <Text style={{ fontSize: 20, fontWeight: "800", color: designTheme.textPrimary }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 10, color: designTheme.textMuted, textAlign: "center" }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <View className="px-5 gap-4 pb-8">
          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Mon compte
            </Text>
            <Divider />
            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/edit")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "rgba(71,85,105,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="user" size={18} color="#475569" />
                </View>
                <Text className="text-sm">Modifier le profil</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#475569" />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              onPress={() => router.push("/(app)/subscription")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: isPro
                      ? "rgba(110,231,183,0.12)"
                      : "rgba(71,85,105,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={isPro ? "star" : "zap"}
                    size={18}
                    color={isPro ? "#6ee7b7" : "#475569"}
                  />
                </View>
                <Text className="text-sm">Abonnement</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text
                  className={`text-xs font-semibold ${isPro ? "text-primary" : "text-textMuted dark:text-textMuted-dark"}`}
                >
                  {isPro ? "Pro ✨" : "Free"}
                </Text>
                <Feather name="chevron-right" size={16} color="#475569" />
              </View>
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              onPress={() => router.push("/(app)/groups")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "rgba(129,140,248,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="users" size={18} color="#818cf8" />
                </View>
                <Text className="text-sm">Mes groupes</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#818cf8" />
            </TouchableOpacity>
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Apparence
            </Text>
            <Divider />
            <View className="flex-row items-center justify-between py-3 px-1">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "rgba(129,140,248,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Feather name="moon" size={18} color="#818cf8" />
              </View>
              <View className="flex-1 mr-4">
                <Text className="text-sm">Mode sombre</Text>
                <Text variant="muted" className="text-xs mt-0.5">
                  Utiliser le thème sombre
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(v) => setPreference(v ? "dark" : "light")}
                trackColor={{ true: designTheme.primary, false: designTheme.border }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Notifications & workflow
            </Text>
            <Divider />
            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/notifications")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "rgba(251,191,36,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="bell" size={18} color="#fbbf24" />
                </View>
                <Text className="text-sm">Paramètres de rappels</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#fbbf24" />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/workflow")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "rgba(110,231,183,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="git-branch" size={18} color="#6ee7b7" />
                </View>
                <Text className="text-sm">Workflow client</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#6ee7b7" />
            </TouchableOpacity>
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Mes données
            </Text>
            <Divider />
            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/export")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: designTheme.primaryBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="download" size={18} color={designTheme.primary} />
                </View>
                <View>
                  <Text className="text-sm">Exporter mes contacts</Text>
                  {!isPro && (
                    <Text variant="muted" className="text-xs">
                      Pro uniquement
                    </Text>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={16} color={designTheme.primary} />
            </TouchableOpacity>
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              À propos
            </Text>
            <Divider />
            <View className="flex-row items-center justify-between py-3 px-1">
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "rgba(148,163,184,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Feather name="info" size={18} color="#94a3b8" />
              </View>
              <Text variant="muted" className="text-sm flex-1">
                Version
              </Text>
              <Text variant="muted" className="text-sm">
                1.0.0
              </Text>
            </View>
            <Divider />
            <TouchableOpacity
              onPress={() => Linking.openURL("https://kit.app/privacy")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "rgba(148,163,184,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="shield" size={18} color="#94a3b8" />
                </View>
                <Text variant="muted" className="text-sm">
                  Politique de confidentialité
                </Text>
              </View>
              <Feather name="external-link" size={14} color="#94a3b8" />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              onPress={() => Linking.openURL("https://kit.app/terms")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: "rgba(148,163,184,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="file-text" size={18} color="#94a3b8" />
                </View>
                <Text variant="muted" className="text-sm">
                  Conditions d'utilisation
                </Text>
              </View>
              <Feather name="external-link" size={14} color="#94a3b8" />
            </TouchableOpacity>
          </Card>

          <Card>
            <TouchableOpacity
              onPress={handleSignOut}
              className="flex-row items-center gap-3 py-3 px-1"
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "rgba(248,113,113,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="log-out" size={18} color="#f87171" />
              </View>
              <Text className="text-sm text-danger">Se déconnecter</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              onPress={handleDeleteAccount}
              className="flex-row items-center gap-3 py-3 px-1"
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: "rgba(71,85,105,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name="trash-2" size={18} color="#475569" />
              </View>
              <Text variant="muted" className="text-sm">
                Supprimer mon compte
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
