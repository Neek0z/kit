import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (profile?.full_name != null) setFullName(profile.full_name);
  }, [profile?.full_name]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide.");
      return;
    }
    setLoading(true);
    const { ok, error } = await updateProfile({ full_name: fullName.trim() });
    setLoading(false);
    if (ok) {
      router.back();
    } else {
      Alert.alert("Erreur", error || "Impossible de mettre à jour le profil.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-background-dark">
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
