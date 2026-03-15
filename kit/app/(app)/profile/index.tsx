import { useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Text, Avatar, Card, Divider } from "../../../components/ui";
import { useAuthContext } from "../../../lib/AuthContext";
import { useTheme } from "../../../lib/ThemeContext";
import { useProfile } from "../../../hooks/useProfile";
import { useSubscription } from "../../../hooks/useSubscription";

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
  const { profile, fetchProfile, updateProfile, uploadAvatar, loading: profileLoading } = useProfile();
  const { isPro } = useSubscription();
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

  if (profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background dark:bg-background-dark items-center justify-center">
        <ActivityIndicator color="#6ee7b7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
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
                color="#0f172a"
              />
            </View>
          </TouchableOpacity>

          <Text variant="h2">{profile?.full_name ?? "Mon profil"}</Text>
          <Text variant="muted" className="mt-1">
            {user?.email}
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            className={`mt-3 px-4 py-1.5 rounded-full flex-row items-center gap-1.5 ${
              isPro ? "bg-primary/10" : "bg-surface dark:bg-surface-dark border border-border dark:border-border-dark"
            }`}
          >
            <Feather
              name="zap"
              size={12}
              color={isPro ? "#6ee7b7" : "#475569"}
            />
            <Text
              className={`text-xs font-semibold ${isPro ? "text-primary" : "text-textMuted dark:text-textMuted-dark"}`}
            >
              {isPro ? "Plan Pro" : "Plan Free · Passer à Pro"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-5 gap-4 pb-8">
          <Card padding="sm">
            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/edit")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <Feather name="user" size={18} color="#475569" />
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
                <Feather
                  name="zap"
                  size={18}
                  color={isPro ? "#6ee7b7" : "#475569"}
                />
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
          </Card>

          <Card padding="sm">
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Apparence
            </Text>
            <Divider />
            <View className="flex-row items-center justify-between py-3 px-1">
              <View className="flex-1 mr-4">
                <Text className="text-sm">Mode sombre</Text>
                <Text variant="muted" className="text-xs mt-0.5">
                  Utiliser le thème sombre
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(v) => setPreference(v ? "dark" : "light")}
                trackColor={{ true: "#6ee7b7", false: "#334155" }}
                thumbColor="#fff"
              />
            </View>
          </Card>

          <Card padding="sm">
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
                <Feather name="bell" size={18} color="#475569" />
                <Text className="text-sm">Paramètres de rappels</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#475569" />
            </TouchableOpacity>

            <Divider />

            <TouchableOpacity
              onPress={() => router.push("/(app)/profile/workflow")}
              className="flex-row items-center justify-between py-3 px-1"
            >
              <View className="flex-row items-center gap-3">
                <Feather name="git-branch" size={18} color="#475569" />
                <Text className="text-sm">Workflow client</Text>
              </View>
              <Feather name="chevron-right" size={16} color="#475569" />
            </TouchableOpacity>
          </Card>

          <Card padding="sm">
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
                <Feather name="download" size={18} color="#475569" />
                <View>
                  <Text className="text-sm">Exporter mes contacts</Text>
                  {!isPro && (
                    <Text variant="muted" className="text-xs">
                      Pro uniquement
                    </Text>
                  )}
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#475569" />
            </TouchableOpacity>
          </Card>

          <Card padding="sm">
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              À propos
            </Text>
            <Divider />
            <View className="flex-row items-center justify-between py-3 px-1">
              <Text variant="muted" className="text-sm">
                Version
              </Text>
              <Text variant="muted" className="text-sm">
                1.0.0
              </Text>
            </View>
            <Divider />
            <TouchableOpacity className="flex-row items-center justify-between py-3 px-1">
              <Text variant="muted" className="text-sm">
                Politique de confidentialité
              </Text>
              <Feather name="external-link" size={14} color="#475569" />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity className="flex-row items-center justify-between py-3 px-1">
              <Text variant="muted" className="text-sm">
                Conditions d'utilisation
              </Text>
              <Feather name="external-link" size={14} color="#475569" />
            </TouchableOpacity>
          </Card>

          <Card padding="sm">
            <TouchableOpacity
              onPress={handleSignOut}
              className="flex-row items-center gap-3 py-3 px-1"
            >
              <Feather name="log-out" size={18} color="#f87171" />
              <Text className="text-sm text-danger">Se déconnecter</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              onPress={handleDeleteAccount}
              className="flex-row items-center gap-3 py-3 px-1"
            >
              <Feather name="trash-2" size={18} color="#475569" />
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
