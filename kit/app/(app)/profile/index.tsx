import React, { useState } from "react";
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

interface ProfileRowProps {
  icon: FeatherName;
  label: string;
  subtitle?: string;
  value?: string;
  color: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function ProfileRow({ icon, label, subtitle, value, color, onPress, rightElement, danger }: ProfileRowProps) {
  const designTheme = useDesignTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 4 }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: danger ? designTheme.dangerBg : `${color}1F`,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={icon} size={15} color={danger ? designTheme.danger : color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: danger ? designTheme.danger : designTheme.textPrimary }}>
          {label}
        </Text>
        {subtitle && (
          <Text variant="muted" style={{ fontSize: 12, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {value && <Text style={{ fontSize: 13, color: designTheme.textMuted }}>{value}</Text>}
      {rightElement ?? (onPress && <Feather name="chevron-right" size={15} color={designTheme.textHint} />)}
    </TouchableOpacity>
  );
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
              backgroundColor: isPro ? designTheme.warningBg : designTheme.primaryBg,
              borderWidth: 1,
              borderColor: isPro ? designTheme.warningBorder : designTheme.primaryBorder,
            }}
          >
            <Feather
              name={isPro ? "star" : "zap"}
              size={12}
              color={isPro ? designTheme.warning : designTheme.primary}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: isPro ? designTheme.warning : designTheme.primary,
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
            { label: "Clients", value: byStatus.client ?? 0, icon: "star" as const, color: designTheme.warning },
            {
              label: "Interactions",
              value: totalInteractions,
              icon: "activity" as const,
              color: designTheme.accent,
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
            <ProfileRow
              icon="user"
              label="Modifier le profil"
              color={designTheme.textHint}
              onPress={() => router.push("/(app)/profile/edit")}
            />

            <Divider />

            <ProfileRow
              icon={isPro ? "star" : "zap"}
              label="Abonnement"
              color={isPro ? designTheme.primary : designTheme.textHint}
              value={isPro ? "Pro ✨" : "Free"}
              onPress={() => router.push("/(app)/subscription")}
            />

            <Divider />

            <ProfileRow
              icon="users"
              label="Mes groupes"
              color={designTheme.accent}
              onPress={() => router.push("/(app)/groups")}
            />
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Apparence
            </Text>
            <Divider />
            <ProfileRow
              icon="moon"
              label="Mode sombre"
              subtitle="Utiliser le thème sombre"
              color={designTheme.accent}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={(v) => setPreference(v ? "dark" : "light")}
                  trackColor={{ true: designTheme.primary, false: designTheme.border }}
                  thumbColor="#fff"
                />
              }
            />
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Notifications & workflow
            </Text>
            <Divider />
            <ProfileRow
              icon="bell"
              label="Paramètres de rappels"
              color={designTheme.warning}
              onPress={() => router.push("/(app)/profile/notifications")}
            />

            <Divider />

            <ProfileRow
              icon="git-branch"
              label="Workflow parrain"
              subtitle="Tes relances quand un contact devient client"
              color={designTheme.primary}
              onPress={() => router.push("/(app)/profile/workflow")}
            />

            <Divider />

            <ProfileRow
              icon="user-check"
              label="Arrivée client"
              subtitle="Checklist formalités & onboarding côté client"
              color="#7dd3fc"
              onPress={() => router.push("/(app)/profile/workflow-client")}
            />
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              Mes données
            </Text>
            <Divider />
            <ProfileRow
              icon="download"
              label="Exporter mes contacts"
              subtitle={isPro ? undefined : "Pro uniquement"}
              color={designTheme.primary}
              onPress={() => router.push("/(app)/profile/export")}
            />
          </Card>

          <Card>
            <Text
              variant="muted"
              className="text-xs uppercase tracking-wider px-1 py-2"
            >
              À propos
            </Text>
            <Divider />
            <ProfileRow icon="info" label="Version" color={designTheme.textHint} value="1.0.0" />
            <Divider />
            <ProfileRow
              icon="shield"
              label="Politique de confidentialité"
              color={designTheme.textHint}
              onPress={() => Linking.openURL("https://kit.app/privacy")}
              rightElement={<Feather name="external-link" size={14} color={designTheme.textHint} />}
            />
            <Divider />
            <ProfileRow
              icon="file-text"
              label="Conditions d'utilisation"
              color={designTheme.textHint}
              onPress={() => Linking.openURL("https://kit.app/terms")}
              rightElement={<Feather name="external-link" size={14} color={designTheme.textHint} />}
            />
          </Card>

          <Card>
            <ProfileRow
              icon="log-out"
              label="Se déconnecter"
              color={designTheme.danger}
              danger
              onPress={handleSignOut}
            />
            <Divider />
            <ProfileRow
              icon="trash-2"
              label="Supprimer mon compte"
              color={designTheme.textHint}
              onPress={handleDeleteAccount}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
