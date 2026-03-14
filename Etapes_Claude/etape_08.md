# KIT — etape_08 : Profil utilisateur & Paramètres

## Contexte

Widget en place (etape_07 validée).
On construit l'écran Profil complet : photo, infos personnelles,
paramètres de notification et gestion du compte.

---

## Ce que tu dois faire

### 1. Installer expo-image-picker

```bash
npx expo install expo-image-picker
```

Ajouter dans `app.json` :

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "KIT accède à ta galerie pour changer ta photo de profil.",
          "cameraPermission": "KIT accède à ta caméra pour prendre une photo de profil."
        }
      ]
    ]
  }
}
```

---

### 2. Bucket Supabase pour les avatars

Dans Supabase → Storage → New bucket :
- Nom : `avatars`
- Public : ✅ oui

Puis dans SQL Editor :

```sql
-- Politique pour que chaque user gère son propre avatar
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');
```

---

### 3. Hook useProfile

Créer `hooks/useProfile.ts` :

```ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { UserProfile } from "../types";
import { useAuthContext } from "../lib/AuthContext";

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (data: Partial<Pick<UserProfile, "full_name" | "avatar_url">>) => Promise<boolean>;
  uploadAvatar: (uri: string) => Promise<string | null>;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (
    data: Partial<Pick<UserProfile, "full_name" | "avatar_url">>
  ): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error) return false;

    setProfile((prev) => prev ? { ...prev, ...data } : null);
    return true;
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    if (!user) return null;

    // Lire le fichier et convertir en blob
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = uri.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

    if (error) return null;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  return { profile, loading, updateProfile, uploadAvatar };
}
```

---

### 4. Écran Profil complet

Remplacer `app/(app)/profile.tsx` :

```tsx
import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Alert, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { Text, Avatar, Card, Divider } from "../../components/ui";
import { useAuthContext } from "../../lib/AuthContext";
import { useProfile } from "../../hooks/useProfile";
import { useSubscription } from "../../hooks/useSubscription";

export default function ProfileScreen() {
  const { user, signOut } = useAuthContext();
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { isPro } = useSubscription();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    Alert.alert("Photo de profil", "Choisir une source", [
      {
        text: "Galerie",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled) await handleUpload(result.assets[0].uri);
        },
      },
      {
        text: "Caméra",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
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
    const url = await uploadAvatar(uri);
    if (url) await updateProfile({ avatar_url: url });
    setUploadingAvatar(false);
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
            // À implémenter : appel à une Edge Function qui supprime le compte
            Alert.alert("Pour supprimer ton compte, contacte support@kit.app");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Header profil */}
        <View className="items-center pt-8 pb-6 px-5">
          <TouchableOpacity onPress={handlePickAvatar} className="relative mb-4">
            <Avatar
              name={profile?.full_name ?? user?.email}
              url={profile?.avatar_url}
              size="lg"
            />
            <View className="absolute bottom-0 right-0 bg-primary w-7 h-7 rounded-full items-center justify-center border-2 border-background">
              <Feather name={uploadingAvatar ? "loader" : "camera"} size={13} color="#0f172a" />
            </View>
          </TouchableOpacity>

          <Text variant="h2">{profile?.full_name ?? "Mon profil"}</Text>
          <Text variant="muted" className="mt-1">{user?.email}</Text>

          {/* Badge plan */}
          <TouchableOpacity
            onPress={() => router.push("/(app)/subscription")}
            className={`mt-3 px-4 py-1.5 rounded-full flex-row items-center gap-1.5 ${
              isPro ? "bg-primary/10" : "bg-surface border border-border"
            }`}
          >
            <Feather name="zap" size={12} color={isPro ? "#6ee7b7" : "#475569"} />
            <Text className={`text-xs font-semibold ${isPro ? "text-primary" : "text-textMuted"}`}>
              {isPro ? "Plan Pro" : "Plan Free · Passer à Pro"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="px-5 gap-4 pb-8">

          {/* Infos du compte */}
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
                <Feather name="zap" size={18} color={isPro ? "#6ee7b7" : "#475569"} />
                <Text className="text-sm">Abonnement</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className={`text-xs font-semibold ${isPro ? "text-primary" : "text-textMuted"}`}>
                  {isPro ? "Pro ✨" : "Free"}
                </Text>
                <Feather name="chevron-right" size={16} color="#475569" />
              </View>
            </TouchableOpacity>
          </Card>

          {/* Notifications */}
          <Card padding="sm">
            <Text variant="muted" className="text-xs uppercase tracking-wider px-1 py-2">
              Notifications
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
          </Card>

          {/* Données */}
          <Card padding="sm">
            <Text variant="muted" className="text-xs uppercase tracking-wider px-1 py-2">
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
                  {!isPro && <Text variant="muted" className="text-xs">Pro uniquement</Text>}
                </View>
              </View>
              <Feather name="chevron-right" size={16} color="#475569" />
            </TouchableOpacity>
          </Card>

          {/* À propos */}
          <Card padding="sm">
            <Text variant="muted" className="text-xs uppercase tracking-wider px-1 py-2">
              À propos
            </Text>
            <Divider />
            <View className="flex-row items-center justify-between py-3 px-1">
              <Text variant="muted" className="text-sm">Version</Text>
              <Text variant="muted" className="text-sm">1.0.0</Text>
            </View>
            <Divider />
            <TouchableOpacity className="flex-row items-center justify-between py-3 px-1">
              <Text variant="muted" className="text-sm">Politique de confidentialité</Text>
              <Feather name="external-link" size={14} color="#475569" />
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity className="flex-row items-center justify-between py-3 px-1">
              <Text variant="muted" className="text-sm">Conditions d'utilisation</Text>
              <Feather name="external-link" size={14} color="#475569" />
            </TouchableOpacity>
          </Card>

          {/* Compte */}
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
              <Text variant="muted" className="text-sm">Supprimer mon compte</Text>
            </TouchableOpacity>
          </Card>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 5. Écran édition du profil

Créer `app/(app)/profile/edit.tsx` :

```tsx
import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text, Input, Button } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useProfile } from "../../../hooks/useProfile";

export default function EditProfileScreen() {
  const { profile, updateProfile } = useProfile();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }
    setLoading(true);
    const success = await updateProfile({ full_name: fullName.trim() });
    setLoading(false);
    if (success) {
      router.back();
    } else {
      Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Modifier le profil" showBack />
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="gap-4 pt-4 pb-8">
          <Input
            label="Nom complet"
            placeholder="Jean Dupont"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Button label="Enregistrer" onPress={handleSave} loading={loading} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### 6. Écran paramètres notifications

Créer `app/(app)/profile/notifications.tsx` :

```tsx
import { useState } from "react";
import { View, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Card, Divider } from "../../../components/ui";
import { Header } from "../../../components/layout";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function NotificationSettingsScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [morningDigest, setMorningDigest] = useState(false);

  const toggle = async (key: string, value: boolean) => {
    await AsyncStorage.setItem(`notif_${key}`, value.toString());
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Notifications" showBack />
      <View className="px-5 pt-4">
        <Card padding="sm">
          <View className="flex-row items-center justify-between py-3 px-1">
            <View className="flex-1 mr-4">
              <Text className="text-sm">Rappels de relance</Text>
              <Text variant="muted" className="text-xs mt-0.5">
                Notifie-moi à la date de relance prévue
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={(v) => { setRemindersEnabled(v); toggle("reminders", v); }}
              trackColor={{ true: "#6ee7b7", false: "#334155" }}
              thumbColor="#fff"
            />
          </View>
          <Divider />
          <View className="flex-row items-center justify-between py-3 px-1">
            <View className="flex-1 mr-4">
              <Text className="text-sm">Récap matinal</Text>
              <Text variant="muted" className="text-xs mt-0.5">
                Résumé des relances du jour à 9h00
              </Text>
            </View>
            <Switch
              value={morningDigest}
              onValueChange={(v) => { setMorningDigest(v); toggle("morning_digest", v); }}
              trackColor={{ true: "#6ee7b7", false: "#334155" }}
              thumbColor="#fff"
            />
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}
```

---

### 7. Écran export des données (Pro)

Créer `app/(app)/profile/export.tsx` :

```tsx
import { View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Button, Card } from "../../../components/ui";
import { Header } from "../../../components/layout";
import { useSubscription } from "../../../hooks/useSubscription";
import { useContacts } from "../../../hooks/useContacts";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function ExportScreen() {
  const { isPro } = useSubscription();
  const { contacts } = useContacts();

  const handleExport = async () => {
    if (!isPro) {
      router.push("/(app)/subscription");
      return;
    }

    const headers = "Nom,Téléphone,Email,Statut,Prochaine relance,Notes\n";
    const rows = contacts.map((c) =>
      [
        `"${c.full_name}"`,
        `"${c.phone ?? ""}"`,
        `"${c.email ?? ""}"`,
        `"${c.status}"`,
        `"${c.next_follow_up ? new Date(c.next_follow_up).toLocaleDateString("fr-FR") : ""}"`,
        `"${(c.notes ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    ).join("\n");

    const csv = headers + rows;
    const path = `${FileSystem.documentDirectory}kit_contacts_${Date.now()}.csv`;

    await FileSystem.writeAsStringAsync(path, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: "Exporter mes contacts KIT",
      });
    } else {
      Alert.alert("Export", `Fichier enregistré : ${path}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Exporter mes données" showBack />
      <View className="px-5 pt-4 gap-4">
        <Card>
          <Text variant="muted" className="text-sm leading-relaxed">
            Exporte tous tes contacts au format CSV, compatible avec Excel,
            Google Sheets et la plupart des CRM.
          </Text>
          <Text variant="muted" className="text-sm mt-2">
            {contacts.length} contact{contacts.length > 1 ? "s" : ""} à exporter
          </Text>
        </Card>

        {!isPro && (
          <Card>
            <Text className="text-sm text-secondary font-semibold mb-1">
              Fonctionnalité Pro
            </Text>
            <Text variant="muted" className="text-sm">
              Passe à Pro pour exporter tes données.
            </Text>
          </Card>
        )}

        <Button
          label={isPro ? "Exporter en CSV" : "Passer à Pro pour exporter"}
          onPress={handleExport}
        />
      </View>
    </SafeAreaView>
  );
}
```

Installer les dépendances pour l'export :

```bash
npx expo install expo-file-system expo-sharing
```

---

## Critères de validation

Avant de passer à etape_09, vérifier que :

- [ ] L'écran Profil affiche la photo, le nom et l'email
- [ ] Taper sur la photo ouvre le sélecteur (galerie ou caméra)
- [ ] La photo uploadée s'affiche dans Supabase Storage → avatars
- [ ] L'écran d'édition sauvegarde le nom dans Supabase
- [ ] Les toggles de notifications se sauvegardent (AsyncStorage)
- [ ] L'export CSV fonctionne et partage un fichier lisible
- [ ] L'export est bloqué pour les utilisateurs Free
- [ ] La déconnexion fonctionne avec confirmation

---

## Ce qu'on ne fait PAS dans cette étape

- Pas de connexion sociale (Google, Apple) — peut être ajouté plus tard
- Pas de reset mot de passe in-app — renvoyer vers Supabase email
- Pas de synchronisation iCloud/Google Drive — peut être ajouté plus tard

---

## Prochaine étape

`etape_09` — Préparation à la publication (assets, screenshots, tests)
